import {
  CharacterTextSplitter,
  RecursiveCharacterTextSplitter,
  TextSplitter,
  TextSplitterParams,
} from 'langchain/text_splitter';

export const DEFAULT_CHUNK_SIZE = 2048;
export const DEFAULT_CHUNK_OVERLAP = 250;

type SplitterType = '\n\n' | '\n' | ' ' | '';
export class MyTextSplitter extends TextSplitter {
  constructor(
    fields: Partial<TextSplitterParams> = {
      chunkSize: DEFAULT_CHUNK_SIZE,
      chunkOverlap: DEFAULT_CHUNK_OVERLAP,
    },
  ) {
    super(fields);
  }

  splitText = async (
    text: string,
    splitter: SplitterType = '\n\n',
    result: string[] = [],
  ) => {
    const chunks =
      splitter === '\n\n' ? text?.trim().split(splitter) : [text.trim()];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length <= this.chunkSize) {
        result.push(chunk);
      } else {
        const subChunks = this.splitChunksLoop(chunk);
        result.push(...subChunks);
      }
    }
    return result;
  };

  getSplitter = (prev: SplitterType) => {
    if (prev === '\n\n') return '\n';
    if (prev === '\n') return ' ';
    return '';
  };

  splitChunksLoop = (
    text: string,
    limit: number = this.chunkSize - this.chunkOverlap,
    sep = '\n',
  ) => {
    text = text.trim();
    const result: string[] = [];
    let prevChunk = '';
    while (text.length) {
      let sp = sep;
      const subSlice = text.slice(0, limit);
      let ind = subSlice.lastIndexOf(sp);
      if (ind < 0) {
        sp = ' ';
        ind = subSlice.lastIndexOf(sp);
      }
      if (ind < 0) {
        sp = '';
        ind = subSlice.lastIndexOf(sp);
      }
      let nextChunk =
        prevChunk?.length && prevChunk.length > this.chunkOverlap
          ? prevChunk.slice(prevChunk.length - this.chunkOverlap) +
            text.slice(0, ind)
          : text.slice(0, ind);

      result.push(nextChunk);
      prevChunk = nextChunk;
      text = text.slice(ind + sp.length);
    }
    return result;
  };
}

export const getTextSplitter = (
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP,
) => {
  const splitter = new MyTextSplitter({ chunkOverlap, chunkSize });
  return splitter;
};

export const getRecursiveSplitter = (
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP,
) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  return splitter;
};

export const getCharacterSplitter = (
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP,
) => {
  const splitter = new CharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  return splitter;
};
