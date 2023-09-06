import { Example, LegacyWordDocument, Word, WordDocument } from '../types';
import WordClassEnum from '../shared/constants/WordClassEnum';
import { SearchRegExp } from '../shared/utils/createRegExp';

type ResponseData = {
  contentLength: number;
};

export type WithPronunciation = Omit<Example, 'pronunciations'> & {
  pronunciation: string;
};

export interface ExampleResponseData extends ResponseData {
  examples: Example[] | WithPronunciation[];
}

export interface WordResponseData extends ResponseData {
  words: Partial<Word | WordDocument | LegacyWordDocument>[];
}
