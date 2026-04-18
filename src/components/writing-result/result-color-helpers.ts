// Color helpers cho UI kết quả bài viết — phân loại theo band IELTS
// 8+ = xanh lá (xuất sắc), 6.5+ = teal (tốt), 5+ = amber (trung bình), <5 = đỏ

export function bandTextColor(b: number) {
  if (b >= 8) return 'text-emerald-600';
  if (b >= 6.5) return 'text-teal-600';
  if (b >= 5) return 'text-amber-600';
  return 'text-rose-600';
}

export function bandBgBorder(b: number) {
  if (b >= 8) return 'bg-emerald-50/50 border-emerald-100';
  if (b >= 6.5) return 'bg-teal-50/50 border-teal-100';
  if (b >= 5) return 'bg-amber-50/50 border-amber-100';
  return 'bg-rose-50/50 border-rose-100';
}

export function bandBorder(b: number) {
  if (b >= 8) return 'border-emerald-200';
  if (b >= 6.5) return 'border-teal-200';
  if (b >= 5) return 'border-amber-200';
  return 'border-rose-200';
}

export function bandAccent(b: number) {
  if (b >= 8) return 'bg-emerald-400';
  if (b >= 6.5) return 'bg-teal-400';
  if (b >= 5) return 'bg-amber-400';
  return 'bg-rose-400';
}

export function bandBadge(b: number) {
  if (b >= 8) return 'bg-emerald-100 text-emerald-700';
  if (b >= 6.5) return 'bg-teal-100 text-teal-700';
  if (b >= 5) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

// Gradient cho thanh progress bar theo band
export function bandBarGradient(b: number) {
  if (b >= 8) return 'linear-gradient(90deg,#10B981,#34D399)';
  if (b >= 6.5) return 'linear-gradient(90deg,#14B8A6,#34D399)';
  if (b >= 5) return 'linear-gradient(90deg,#F59E0B,#FBBF24)';
  return 'linear-gradient(90deg,#F43F5E,#FB7185)';
}
