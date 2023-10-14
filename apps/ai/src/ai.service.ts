import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CohereEmbeddings } from 'langchain/embeddings/cohere';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { Document } from 'langchain/document';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import * as cohere from 'cohere-ai';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  embeddings: CohereEmbeddings | undefined = undefined;
  weaviate: WeaviateClient | undefined = undefined;
  defaultClassName: string = 'Symptom_desease';
  openai: OpenAI = undefined;

  constructor(private readonly configService: ConfigService) {
    this.init();
  }

  init() {
    cohere.init(this.configService.get('COHERE_API_KEY'));
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.embeddings = new CohereEmbeddings({
      apiKey: this.configService.get('COHERE_API_KEY'), // In Node.js defaults to process.env.COHERE_API_KEY
      batchSize: 48, // Default value if omitted is 48. Max value is 96
      modelName: 'embed-english-v2.0', //'embed-multilingual-v2.0',
    });

    this.weaviate = weaviate.client({
      scheme: this.configService.get('WEAVIATE_SCHEME'),
      host: this.configService.get('WEAVIATE_URL'),
    });
  }

  async createStore(className = this.defaultClassName) {
    let result = await this.weaviate.schema
      .classCreator()
      .withClass({ class: className })
      .do();
    return result;
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

  async addDocsIntoStore(
    docs: Document<Record<string, any>>[],
    className: string = this.defaultClassName,
  ) {
    const store = await WeaviateStore.fromExistingIndex(this.embeddings, {
      client: this.weaviate,
      indexName: className,
    });
    await store.addDocuments(docs);
    return store;
  }

  async vectorizeQuery(query: string) {
    if (!this.embeddings) throw new Error('Embeddings not initialized');
    return this.embeddings?.embedQuery(query);
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
      .withFields('text _additional { id vector }')
      .do();
    const result = response.data['Get']?.[className];
    console.log('result', result);
    return result?.map((doc: any) => ({
      id: doc['_additional']?.id,
      // metadata: { source: doc?.source },
      pageContent: doc?.text,
    }));
  }

  async rerankDocs(docs: Document<Record<string, any>>[]) {}

  async completeResponse(query: string, docs: Document<Record<string, any>>[]) {
    const prompt = `
    Talk and help the user politely and answer his queries based on the context provided here.
    List the possible illnesses that the user might have accurately with possible percentages based on the context if possible.
    If there's no relationship between the user query and context, just say "I don't know".
    \nCONTEXT: ${docs.map((d) => `${d.pageContent}\n`)}`;
    const content = `${query}`;
    const chatCompletion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0,
    });

    console.log(chatCompletion.choices);
    return chatCompletion?.choices?.[0]?.message?.content;
  }

  async answerQuery(query: string) {
    const vectors = await this.vectorizeQuery(query);
    const docs = await this.searchHybrid(query, undefined, { vector: vectors });
    console.log('DOCS', docs);
    const response = await this.completeResponse(query, docs.slice(0, 3));
    return response;
  }
}

interface IHybridSearchOptions {
  alpha?: number;
  limit?: number;
  vector?: number[];
}
