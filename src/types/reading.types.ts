export interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: 'yellow' | 'green' | 'blue';
  note?: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
}
