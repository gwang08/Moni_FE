export interface ListeningPassage {
  id: string;
  title: string;
  audioUrl: string;
  transcript: TranscriptSegment[];
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface TimestampNote {
  id: string;
  timestamp: number;
  note: string;
}
