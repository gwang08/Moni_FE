/** Normalize duration to minutes — handles legacy data stored in seconds (>= 300) */
export function toMinutes(duration: number | null | undefined): number {
  if (!duration || duration <= 0) return 0;
  return duration >= 300 ? Math.round(duration / 60) : duration;
}
