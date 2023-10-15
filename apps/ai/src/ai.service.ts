import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cohere from 'cohere-ai';
import { Document } from 'langchain/document';
import { CohereEmbeddings } from 'langchain/embeddings/cohere';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import OpenAI from 'openai';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { WeaviateClassName } from './types';
import { v2, v3beta1 } from '@google-cloud/translate';

interface FormattedDoc {
  text: string;
  score: number;
}

const translateProjectId = 'mythic-emissary-398922';

@Injectable()
export class AiService {
  embeddings: CohereEmbeddings | undefined = undefined;
  weaviate: WeaviateClient | undefined = undefined;
  defaultClassName: WeaviateClassName = WeaviateClassName.Symptom_desease;
  openai: OpenAI = undefined;
  translatev2 = undefined;
  translationClient = undefined;

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
      modelName: 'embed-multilingual-v2.0', //'embed-multilingual-v2.0',
    });

    this.weaviate = weaviate.client({
      scheme: this.configService.get('WEAVIATE_SCHEME'),
      host: this.configService.get('WEAVIATE_URL'),
    });
    this.translatev2 = new v2.Translate({ projectId: translateProjectId });
    this.translationClient = new v3beta1.TranslationServiceClient();
  }

  async createStore(className: WeaviateClassName = this.defaultClassName) {
    let result = await this.weaviate.schema
      .classCreator()
      .withClass({
        class: className,
        properties: [
          {
            name: 'text',
            dataType: ['text'],
          },
        ],
      })
      .do();
    return result;
  }

  async createStoreFromDocs(
    docs: Document<Record<string, any>>[],
    className: WeaviateClassName = this.defaultClassName,
  ) {
    const vStore = await WeaviateStore.fromDocuments(docs, this.embeddings, {
      indexName: className,
      client: this.weaviate,
      metadataKeys: docs.map((d) => d.metadata?.id),
    });
    return vStore;
  }

  async addDocsIntoStore(
    docs: Document<Record<string, any>>[],
    className: WeaviateClassName = this.defaultClassName,
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
    className: WeaviateClassName = this.defaultClassName,
    options: IHybridSearchOptions = {
      alpha: 0.75,
      limit: 5,
      vector: undefined,
      fields: ['text'],
    },
  ): Promise<Document<Record<string, any>>[]> {
    const response = await this.weaviate.graphql
      .get()
      .withClassName(className)
      .withHybrid({
        query,
        alpha: options.alpha ?? 0.75,
        vector: options.vector,
      })
      .withLimit(options.limit ?? 5)
      .withFields(
        `${
          options?.fields?.length ? options.fields.join(' ') : 'text'
        } _additional { id vector }`,
      )
      .do();
    const result = response.data['Get']?.[className];
    console.log('HYBRID SEARCH', result);
    console.log('response', response);
    return result?.map((doc: any) => ({
      id: doc['_additional']?.id,
      categoryId: doc?.categoryId,
      // metadata: { source: doc?.source },
      pageContent: doc?.text,
    }));
  }

  async rerankDocs(query: string, docs: Document<Record<string, any>>[]) {
    let response = await fetch('http://fastapi:4001/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        docs: docs.map((d) => d.pageContent),
      }),
    });
    const result = await response.json();
    console.log('RERANK RESULT', result);
    return result?.docs?.results;
  }

  async completeResponse(
    query: string,
    docs: { name: string; score: number }[],
  ) {
    const prompt = `
    Give a very short one sentence summary based on the ilnesses inside context and query provided.
    List and Format the following diseases with their prediction score percentage as being the possible illness user might have.
    \nCONTEXT: ${docs.map(
      (d) => `${d.name}\nPrediction score: ${d.score * 100}%\n\n`,
    )}`;

    const content = `${query}`;
    const chatCompletion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0,
    });

    console.log('CHAT COMPLETIONS', chatCompletion.choices);
    return chatCompletion?.choices?.[0]?.message?.content;
  }

  formatResponse(docs: FormattedDoc[]) {}

  extractDisease(text?: string) {
    if (!text) return undefined;
    const disease = text.split('Symptoms')?.[0]?.split('Disease:')?.[1]?.trim();
    return disease;
  }

  async answerQuery(query: string) {
    const { text, detectedLanguage } = await this.translate(query);
    const vectors = await this.vectorizeQuery(text);
    const docs = await this.searchHybrid(text, undefined, { vector: vectors });
    let reranked = await this.rerankDocs(text, docs);
    reranked = reranked.map((d) => ({
      name: this.extractDisease(d?.document?.text),
      score: d?.relevance_score,
    }));

    reranked = reranked.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.name === value.name),
    );

    const completedResponse =
      'You might have these following illnesses, but please, talk to real professional doctors before making any desicion.';
    const { text: responseTr } =
      detectedLanguage === 'en'
        ? { text: completedResponse }
        : await this.translate(completedResponse, detectedLanguage);
    const diseasesTr = await this.translateDocs(reranked, detectedLanguage);

    return {
      diseases: diseasesTr,
      detectedLanguage,
      responseText: responseTr,
    };
  }

  async translate(text: string, dest = 'en') {
    let response = await fetch('http://fastapi:4001/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage: dest,
      }),
    });
    const result = await response.json();
    console.log('TRANSLATION RESULT', result);
    return result as { text: string; detectedLanguage: string };
  }

  async translateDocs(docs: { name: string; score: number }[], dest = 'en') {
    const results = [];
    for (const doc of docs) {
      let response = await fetch('http://fastapi:4001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: doc.name,
          targetLanguage: dest,
        }),
      });
      const result = await response.json();
      results.push({ ...doc, name: result?.text });
    }
    return results;
  }

  async findDoctors(disease: string) {
    const vector = await this.vectorizeQuery(disease);
    const docs = await this.searchHybrid(
      disease,
      WeaviateClassName.Doctor_disease,
      {
        vector,
        fields: ['text', 'categoryId'],
        limit: 5,
      },
    );
    const reranked = await this.rerankDocs(disease, docs);
    const catIds: number[] = reranked.map((d, i) => {
      // console.log('d', d);
      // console.log('docs', docs);
      return Number((docs[d?.index] as any)?.categoryId);
    });
    console.log('carIds', catIds);
    return { categoryIds: catIds };
  }
}

interface IHybridSearchOptions {
  alpha?: number;
  limit?: number;
  vector?: number[];
  fields?: string[];
}
