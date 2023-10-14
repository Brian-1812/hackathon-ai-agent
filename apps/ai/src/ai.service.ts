import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CohereEmbeddings } from 'langchain/embeddings/cohere';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { Document } from 'langchain/document';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import { ChatOpenAI } from 'langchain/chat_models/openai';

@Injectable()
export class AiService {
  embeddings: CohereEmbeddings | undefined = undefined;
  weaviate: WeaviateClient | undefined = undefined;
  defaultClassName: string = 'symptom_desease';
  chatModel = undefined;

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new CohereEmbeddings({
      apiKey: this.configService.get('COHERE_API_KEY'), // In Node.js defaults to process.env.COHERE_API_KEY
      batchSize: 48, // Default value if omitted is 48. Max value is 96
      modelName: 'embed-multilingual-v2.0',
    });
    this.weaviate = weaviate.client({
      scheme: this.configService.get('WEAVIATE_SCHEME'),
      host: this.configService.get('WEAVIATE_URL'),
    });
    this.chatModel = new ChatOpenAI({
      temperature: 0.9,
      openAIApiKey: 'YOUR-API-KEY', // In Node.js defaults to process.env.OPENAI_API_KEY
    });
  }

  async vectorizeQuery(query: string) {
    if (!this.embeddings) throw new Error('Embeddings not initialized');
    return this.embeddings?.embedQuery(query);
  }

  async createStoreFromDocs(
    docs: Document<Record<string, any>>[],
    className: string = this.defaultClassName,
  ) {
    const vStore = await WeaviateStore.fromDocuments(docs, this.embeddings, {
      indexName: className,
      client: this.weaviate,
      metadataKeys: docs.map((d) => d.metadata?.source),
    });
    return vStore;
  }

  async searchHybrid(
    query: string,
    className: string = this.defaultClassName,
    options: IHybridSearchOptions = {
      alpha: 0.75,
      limit: 5,
      vector: undefined,
    },
  ): Promise<Document<Record<string, any>>[]> {
    const response = await this.weaviate.graphql
      .get()
      .withClassName(className)
      .withHybrid({
        query,
        alpha: options.alpha,
        vector: options.vector,
      })
      .withLimit(options.limit ?? 5)
      .withFields('text source _additional { id vector }')
      .do();
    const result = response.data['Get']?.[className];
    return result?.map((doc: any) => ({
      id: doc['_additional']?.id,
      metadata: { source: doc?.source },
      pageContent: doc?.text,
    }));
  }

  async answerQuery(query: string) {
    const vectors = await this.vectorizeQuery(query);
    // const docs = await this.searchHybrid(query, undefined, { vector: vectors });
    const response = "Sizni ko'tiz og'riyapti";
    return response;
  }
}

interface IHybridSearchOptions {
  alpha?: number;
  limit?: number;
  vector?: number[];
}
