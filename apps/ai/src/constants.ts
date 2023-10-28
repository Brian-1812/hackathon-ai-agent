import { WeaviateClassName } from './types';

export const functions = [
  {
    name: 'document_qa_search_morrow',
    description: 'useful for answering questions on morrow docs and hackathon',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Actual query the user is asking',
        },
        docStoreName: {
          type: 'string',
          enum: [WeaviateClassName.Hackathon_docs],
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'web_search',
    description:
      'useful for answering queries with searching the web or google.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Actual query the user is asking',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'generate_image',
    description: 'useful for generating images',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Actual query the user is asking',
        },
        // docStoreName: {
        //   type: 'string',
        //   enum: [WeaviateClassName.morrow_docs],
        // },
      },
      required: ['query'],
    },
  },
];
