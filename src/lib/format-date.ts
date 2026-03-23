/**
 * Format a date string from backend (LocalDateTime, may lack timezone) to Vietnamese locale.
 * Backend stores UTC but may omit 'Z' suffix — we normalize before parsing.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const utcStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  return new Date(utcStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const utcStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  return new Date(utcStr).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
