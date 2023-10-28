import { createStream } from '@app/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cohere from 'cohere-ai';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { VectorDBQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChainTool, DynamicTool, SerpAPI } from 'langchain/tools';
import { Calculator } from 'langchain/tools/calculator';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { FileLike } from 'openai/uploads';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { functions } from './constants';
import {
  FunctionCallReturnType,
  IChatRequest,
  IHybridSearchOptions,
  ResponseType,
  WeaviateClassName,
} from './types';

@Injectable()
export class AiService {
  embeddings: OpenAIEmbeddings | undefined = undefined;
  weaviate: WeaviateClient | undefined = undefined;
  defaultClassName: WeaviateClassName = WeaviateClassName.Hackathon_docs;
  openai: OpenAI = undefined;
  chatModel: ChatOpenAI = undefined;
  serpApiKey: string = undefined;
  availableFunctions = {
    document_qa_search_morrow: async (query: string) => this.searchQA(query),
    web_search: async (query: string) => this.searchWeb(query),
    generate_image: async (query: string) => this.generateImages(query),
  };

  constructor(private readonly configService: ConfigService) {
    this.init();
  }

  init() {
    cohere.init(this.configService.get('COHERE_API_KEY'));
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.weaviate = weaviate.client({
      scheme: this.configService.get('WEAVIATE_SCHEME'),
      host: this.configService.get('WEAVIATE_URL'),
    });
    this.serpApiKey = this.configService.get('SERPAPI_API_KEY');
    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-4',
      streaming: true,
      temperature: 0,
    });
  }

  // Chat via voice/audio command
  async *chatFlowAudio(audio: FileLike): AsyncGenerator<ResponseType> {
    yield this.yieldFormattedResponse('Transcribing audio', 'text', 'status');
    const { error, content } = await this.stt(audio);
    if (error) return { contentType: 'text', type: 'response', content: error };
    let result = '';
    const stream = createStream(this.chatFlow(content));
    const reader = stream.getReader();
    while (true) {
      let { value, done } = await reader.read();
      if (value?.content) {
        result += value.content;
        yield value;
      }
      if (value?.type === 'response' || done) {
        break;
      }
    }
  }

  // Chat with Langchain's prebuilt Agent
  async *chatFlowAgent(query: string): AsyncGenerator<ResponseType> {
    const stream = createStream(this.runAgent(query));
    const reader = stream.getReader();
    while (true) {
      let { value, done } = await reader.read();
      yield this.yieldFormattedResponse(
        value,
        'text',
        done ? 'response' : 'partial',
      );
      if (done) {
        break;
      }
    }
  }

  // Chat with custom Agent
  async *chatFlow(query: string): AsyncGenerator<ResponseType> {
    const prompt = `Answer the question based on the Context provided. If the answer is fully on the context, beautifully convert it and respond it. Otherwise, think carefully and take the next step.`;
    let userQuery = 'Context:\n';
    let responseMessage: OpenAI.Chat.Completions.ChatCompletionMessage =
      undefined;
    const response = await this.sendChatRequest([
      { role: 'system', content: prompt },
      { role: 'user', content: query },
    ]);
    responseMessage = response.choices[0].message;
    console.log('responseMessage 1', responseMessage);
    let maxTries = 4;

    while (responseMessage.function_call && maxTries > 0) {
      yield this.yieldFormattedResponse(
        responseMessage.content,
        'text',
        'partial',
      );
      maxTries -= 1;
      const functionName = responseMessage.function_call
        .name as keyof typeof this.availableFunctions;

      const functionToCall = this.availableFunctions[functionName];
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      if (functionToCall) {
        yield this.yieldFormattedResponse(
          this.formatProcessType(functionName),
          'text',
          'status',
        );
        const functionResponse: FunctionCallReturnType<string | string[]> =
          // @ts-expect-error
          await functionToCall(...Object.values(functionArgs));
        if (functionResponse.error) {
          yield this.yieldFormattedResponse(
            `Error occured while ${this.formatProcessType(functionName)}`,
            'text',
            'response',
          );
          break;
        }
        if (functionResponse.type === 'image') {
          yield {
            type: 'response',
            content: functionResponse.content,
            contentType: 'image',
          };
          break;
        }

        userQuery += functionResponse.content + '\n';
        const response = await this.sendChatRequest([
          { role: 'system', content: prompt },
          { role: 'user', content: 'Question: ' + query + userQuery },
        ]);
        responseMessage = response.choices[0].message;
        if (responseMessage.content) {
          yield {
            type: responseMessage.function_call ? 'partial' : 'response',
            content: responseMessage.content,
            contentType: 'text',
          };
        }
      }
    }

    yield {
      type: 'partial',
      content: responseMessage.content,
      contentType: 'text',
    };
  }

  // OpenAI chat request
  async sendChatRequest(
    messages: Array<ChatCompletionMessageParam>,
    options: IChatRequest = {
      model: 'gpt-4',
      temperature: 0,
      function_call: 'auto' as 'auto' | 'none',
      functions,
    },
  ) {
    const response = await this.openai.chat.completions.create({
      messages,
      model: options.model,
      temperature: options.temperature,
      function_call: options.function_call,
      functions: options.functions,
    });
    return response;
  }

  async getTools() {
    const chain = await this.getStoreChain();
    const qaTool = new ChainTool({
      name: 'document_qa_search_morrow',
      description:
        'useful for answering questions on morrow docs and hackathon',
      chain: chain,
    });
    const tools = [
      qaTool,
      new SerpAPI(this.configService.get('SERPAPI_API_KEY')),
      new Calculator(),
      new DynamicTool({
        name: 'generate_image',
        description: 'useful for generating images',
        func: async (query: string) => {
          const res = await this.generateImages(query);
          return res.content?.[0];
        },
      }),
    ];

    return tools;
  }

  // Search internal documents
  async searchQA(query: string, docStoreName = this.defaultClassName) {
    try {
      console.log('Vectorizing query');
      const vectors = await this.vectorizeQuery(query);

      console.log('Searching from Weaviate');
      const docs = await this.searchHybrid(query, docStoreName, {
        vector: vectors,
      });
      const result: FunctionCallReturnType<string> = {
        type: 'text',
        shouldBeFormatted: true,
        content: docs
          .slice(0, 5)
          .reduce(
            (accumulator, currentValue) =>
              accumulator + '\n' + currentValue.pageContent,
            '',
          ),
      };
      return result;
    } catch (error) {
      console.log('error', error);
      return {
        error: 'Error occured while document search.',
      } as FunctionCallReturnType<string>;
    }
  }

  // Search WEB
  async searchWeb(query: string): Promise<FunctionCallReturnType<string>> {
    try {
      console.log('Sending api request to SERPAPI');
      if (!this.serpApiKey) throw new Error('Error occured while browsing..');
      let resp = await fetch(
        `https://serpapi.com/search?q=${query}&api_key=${this.serpApiKey}`,
      );
      const res = await resp.json();
      if (res?.error) {
        console.log(`Got error from serpAPI: ${res.error}`);
        return {
          error: 'Error occured while browsing the net',
        } as FunctionCallReturnType<string>;
      }
      // console.log('res', res);
      return {
        content: this.formatSearchResponse(res),
        type: 'text',
        shouldBeFormatted: true,
      };
    } catch (error) {
      console.log('Got error from serpAPI', error);
      return {
        error: 'Error occured while browsing the net',
      } as FunctionCallReturnType<string>;
    }
  }

  async generateImages(
    query: string,
    n = 1,
  ): Promise<FunctionCallReturnType<string[]>> {
    try {
      console.log('Generating Image...');
      const response = await this.openai.images.generate({
        prompt: query,
        size: '512x512',
        n,
      });
      const images = response.data.map((d) => d.url);
      return { content: images, type: 'image', shouldBeFormatted: false };
    } catch (error) {
      console.log('error', error);
      return {
        error: 'Error occured while generating an image',
      } as FunctionCallReturnType<string[]>;
    }
  }

  async stt(audio: FileLike) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        file: audio,
        model: 'whisper-1',
      });
      return { content: response.text };
    } catch (error) {
      console.log('error', error);
      return { error: 'Error occured while transcribing the audio' };
    }
  }

  async getStoreChain(className: WeaviateClassName = this.defaultClassName) {
    const store = await WeaviateStore.fromExistingIndex(this.embeddings, {
      client: this.weaviate,
      indexName: className,
    });
    const chain = VectorDBQAChain.fromLLM(this.chatModel, store);
    return chain;
  }

  async *runAgent(query: string) {
    const tools = await this.getTools();
    const executor = await initializeAgentExecutorWithOptions(
      tools,
      this.chatModel,
      {
        agentType: 'zero-shot-react-description',
        verbose: true,
      },
    );
    const result = await executor.call({ input: query });
    yield result?.output;
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
    });
    return vStore;
  }

  async createStoreFromText(text: string) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const output = await splitter.createDocuments([text]);
    return this.createStoreFromDocs(output);
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
  ): Promise<Document<Record<string, string>>[]> {
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
        } _additional { vector }`,
      )
      .do();
    const result = response.data['Get']?.[className];
    console.log('HYBRID SEARCH', result);
    return result?.map((doc: any) => ({
      pageContent: doc?.text,
    }));
  }

  formatSearchResponse(res: any): string {
    const answer_box = res.answer_box_list
      ? res.answer_box_list[0]
      : res.answer_box;
    if (answer_box) {
      if (answer_box.result) {
        return answer_box.result;
      } else if (answer_box.answer) {
        return answer_box.answer;
      } else if (answer_box.snippet) {
        return answer_box.snippet;
      } else if (answer_box.snippet_highlighted_words) {
        return answer_box.snippet_highlighted_words.toString();
      } else {
        const answer = {};
        Object.keys(answer_box)
          .filter(
            (k) =>
              !Array.isArray(answer_box[k]) &&
              typeof answer_box[k] !== 'object' &&
              !(
                typeof answer_box[k] === 'string' &&
                answer_box[k].startsWith('http')
              ),
          )
          .forEach((k) => {
            answer[k] = answer_box[k];
          });
        return JSON.stringify(answer);
      }
    }
    if (res.events_results) {
      return JSON.stringify(res.events_results);
    }
    if (res.sports_results) {
      return JSON.stringify(res.sports_results);
    }
    if (res.top_stories) {
      return JSON.stringify(res.top_stories);
    }
    if (res.news_results) {
      return JSON.stringify(res.news_results);
    }
    if (res.jobs_results?.jobs) {
      return JSON.stringify(res.jobs_results.jobs);
    }
    if (res.questions_and_answers) {
      return JSON.stringify(res.questions_and_answers);
    }
    if (res.popular_destinations?.destinations) {
      return JSON.stringify(res.popular_destinations.destinations);
    }
    if (res.top_sights?.sights) {
      const sights = res.top_sights.sights
        .map((s) => ({
          title: s.title,
          description: s.description,
          price: s.price,
        }))
        .slice(0, 8);
      return JSON.stringify(sights);
    }
    if (res.shopping_results && res.shopping_results[0]?.title) {
      return JSON.stringify(res.shopping_results.slice(0, 3));
    }
    if (res.images_results && res.images_results[0]?.thumbnail) {
      return res.images_results
        .map((ir) => ir.thumbnail)
        .slice(0, 10)
        .toString();
    }
    const snippets = [];
    if (res.knowledge_graph) {
      if (res.knowledge_graph.description) {
        snippets.push(res.knowledge_graph.description);
      }
      const title = res.knowledge_graph.title || '';
      Object.keys(res.knowledge_graph)
        .filter(
          (k) =>
            typeof res.knowledge_graph[k] === 'string' &&
            k !== 'title' &&
            k !== 'description' &&
            !k.endsWith('_stick') &&
            !k.endsWith('_link') &&
            !k.startsWith('http'),
        )
        .forEach((k) =>
          snippets.push(`${title} ${k}: ${res.knowledge_graph[k]}`),
        );
    }
    for (const orgResult of res.organic_results?.slice(0, 4)) {
      if (orgResult) {
        if (orgResult.snippet) {
          snippets.push(orgResult.snippet);
        } else if (orgResult.snippet_highlighted_words) {
          snippets.push(orgResult.snippet_highlighted_words);
        } else if (orgResult.rich_snippet) {
          snippets.push(orgResult.rich_snippet);
        } else if (orgResult.rich_snippet_table) {
          snippets.push(orgResult.rich_snippet_table);
        } else if (orgResult.link) {
          snippets.push(orgResult.link);
        }
      }
    }
    if (res.buying_guide) {
      snippets.push(res.buying_guide);
    }
    if (res.local_results?.places) {
      snippets.push(res.local_results.places);
    }
    if (snippets.length > 0) {
      console.log('snippets', snippets);
      return JSON.stringify(snippets);
    } else {
      return 'No good search result found';
    }
  }

  formatProcessType(functionName: keyof typeof this.availableFunctions) {
    switch (functionName) {
      case 'generate_image':
        return 'Generating Image';
      case 'web_search':
        return 'Browsing Web';
      case 'document_qa_search_morrow':
        return 'Searching Morrow Docs';
    }
  }

  yieldFormattedResponse(
    content: string,
    contentType: 'text' | 'image' | 'audio',
    type: 'response' | 'status' | 'partial',
  ): ResponseType {
    return {
      content: content,
      contentType,
      type,
    };
  }
}
