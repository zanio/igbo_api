import { assign, omit, pick, isEmpty } from 'lodash';
import { Types } from 'mongoose';
import Version from '../../shared/constants/Version';
import { Definition, PartialWordType, WordDialect, WordType } from '../../types/word';
import { Example } from '../../types';

type InitialMinimizedWord = Omit<WordType, 'hypernyms' | 'hyponyms' | 'updatedAt' | 'createdAt'>;

type MinimizedDefinition = Omit<Definition, 'label' | 'igboDefinitions' | '_id' | 'id'>;

type MinimizedDefinitionOrString = MinimizedDefinition | string;

type MinimizedWord = Omit<InitialMinimizedWord, 'examples' | 'dialects' | 'relatedTerms' | 'stems'> & {
  definitions: MinimizedDefinitionOrString[] | undefined;
  examples: Partial<Example>[];
  tenses: unknown;
  dialects: Partial<WordDialect>[] | undefined;
  relatedTerms: (string | Partial<{ id: string; _id?: Types.ObjectId }>)[];
  stems: (string | Partial<{ id: string; _id?: Types.ObjectId }>)[];
};

const minimizeWords = (words: PartialWordType[], version: Version) => {
  console.time('Minimize words');
  const minimizedWords = words.map((word) => {
    let minimizedWord = assign(word);
    minimizedWord = omit(minimizedWord, ['hypernyms', 'hyponyms', 'updatedAt', 'createdAt']);
    const definitions =
      version === Version.VERSION_2
        ? (minimizedWord.definitions || []).map((definition) => {
            let minimizedDefinition: Partial<MinimizedDefinitionOrString> = assign(definition);
            if (typeof minimizedDefinition === 'object') {
              minimizedDefinition = omit(minimizedDefinition, ['label', 'igboDefinitions', '_id', 'id']);
              if (!minimizedDefinition.nsibidi) {
                minimizedDefinition = omit(minimizedDefinition, ['nsibidi']);
              }
            }
            return minimizedDefinition;
          })
        : minimizedWord.definitions;
    let newMinimizedWord: Partial<MinimizedWord> = assign(minimizedWord, { definitions }) as MinimizedWord;
    if (!newMinimizedWord.variations?.length) {
      newMinimizedWord = omit(newMinimizedWord, ['variations']);
    }
    if (newMinimizedWord.examples?.length) {
      newMinimizedWord.examples = newMinimizedWord.examples?.map((example) => {
        let minimizedExample: Partial<Example> = assign(example);
        minimizedExample = omit(minimizedExample, [
          'associatedWords',
          'pronunciation',
          'updatedAt',
          'createdAt',
          'meaning',
          'style',
          'associatedDefinitionsSchemas',
          'archived',
          'id',
        ]);
        if (!minimizedExample.nsibidi) {
          minimizedExample = omit(minimizedExample, ['nsibidi']);
        }
        return minimizedExample;
      });
    } else {
      newMinimizedWord = omit(newMinimizedWord, ['example']);
    }
    const tensesValues = Object.values(newMinimizedWord.tenses || {});
    if (!tensesValues.length || tensesValues.every((tense) => tense === '')) {
      newMinimizedWord = omit(newMinimizedWord, ['tenses']);
    }

    if (version === Version.VERSION_2 && newMinimizedWord.dialects?.length) {
      newMinimizedWord.dialects = newMinimizedWord.dialects?.map((dialect) => {
        let minimizedDialect = omit(dialect, ['variations', 'id', '_id']);
        if (!minimizedDialect.pronunciation) {
          minimizedDialect = omit(minimizedDialect, ['pronunciation']);
        }
        return minimizedDialect;
      });
    } else if (version === Version.VERSION_2 && !newMinimizedWord.dialects?.length) {
      newMinimizedWord = omit(newMinimizedWord, ['dialects']);
    }

    if (newMinimizedWord.relatedTerms?.length) {
      newMinimizedWord.relatedTerms = newMinimizedWord.relatedTerms?.map((relatedTerm) => {
        if (typeof relatedTerm === 'string' || !relatedTerm) {
          return relatedTerm;
        }
        return pick(relatedTerm, ['word', 'id', '_id']);
      });
    } else {
      newMinimizedWord = omit(newMinimizedWord, ['relatedTerms']);
    }

    if (newMinimizedWord.stems?.length) {
      newMinimizedWord.stems = newMinimizedWord.stems?.map((stem) => {
        if (typeof stem === 'string' || !stem) {
          return stem;
        }
        return pick(stem, ['word', 'id', '_id']);
      });
    } else {
      newMinimizedWord = omit(newMinimizedWord, ['stems']);
    }
    return newMinimizedWord;
  });
  console.timeEnd('Minimize words');
  return minimizedWords;
};

export default minimizeWords;
