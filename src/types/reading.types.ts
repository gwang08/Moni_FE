export interface Highlight {
  id: string;
  stimulusId: number;
  text: string;
  startOffset: number;
  endOffset: number;
  color: 'yellow' | 'green' | 'blue';
  note?: string;
}

export interface VocabItem {
  id: string;
  stimulusId: number;
  word: string;
  definition?: string;
  highlightId?: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
}
