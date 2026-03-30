const READING_BANDS = [
  0, 0, 0, 0, 0, 0, 2.5, 3, 3, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 5, 5, 5, 5.5, 5.5, 5.5, 6, 6, 6.5, 6.5, 6.5, 7, 7, 7, 7.5, 7.5, 8, 8, 8.5, 8.5, 9, 9, 9, 9, 9,
] as const;

const LISTENING_BANDS = [
  0, 0, 0, 0, 0, 0, 2.5, 3, 3, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 5, 5, 5, 5.5, 5.5, 5.5, 6, 6, 6, 6.5, 6.5, 7, 7, 7.5, 7.5, 8, 8, 8, 8.5, 8.5, 9, 9, 9, 9, 9,
] as const;

function mapRawTo40(correct: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  if (totalQuestions === 40) return Math.max(0, Math.min(correct, 40));
  const scaled = Math.round((correct / totalQuestions) * 40);
  return Math.max(0, Math.min(scaled, 40));
}

export function getReadingBand(correct: number, totalQuestions: number): number {
  return READING_BANDS[mapRawTo40(correct, totalQuestions)];
}

export function getListeningBand(correct: number, totalQuestions: number): number {
  return LISTENING_BANDS[mapRawTo40(correct, totalQuestions)];
}
