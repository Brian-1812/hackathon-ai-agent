import OpenAI from 'openai';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

export enum WeaviateClassName {
  Hackathon_docs = 'Hackathon_docs',
}

export interface FunctionCallReturnType<T> {
  type: 'image' | 'text';
  content: T;
  shouldBeFormatted: boolean;
  error?: string;
}

export interface ResponseType {
  type: 'response' | 'status' | 'partial';
  content: string | string[] | Uint8Array;
  contentType: 'text' | 'image' | 'audio';
}

export interface IHybridSearchOptions {
  alpha?: number;
  limit?: number;
  vector?: number[];
  fields?: string[];
}

export interface IChatRequest {
  model: ChatCompletionCreateParamsBase['model'];
  temperature: number;
  function_call: 'auto' | 'none';
  functions: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[];
}
