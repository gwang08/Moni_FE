export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  translation: string;
  collectionId: string;
}

export interface VocabCollection {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  icon: string;
}
