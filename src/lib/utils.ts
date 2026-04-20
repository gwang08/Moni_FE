import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a VND amount for display. Null/undefined → "0đ". */
export function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}
