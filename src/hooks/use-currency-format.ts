import { useCallback } from 'react';

/**
 * Format a number to Vietnamese currency string (e.g. 100000 → "100,000")
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
}

/**
 * Parse a formatted currency string back to number (e.g. "100,000" → 100000)
 */
export function parseCurrency(value: string): number {
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Hook for currency input handling.
 * Returns onChange handler that auto-formats and a display value.
 *
 * Usage:
 * const { displayValue, onChange } = useCurrencyInput(price, setPrice);
 * <Input value={displayValue} onChange={onChange} />
 */
export function useCurrencyInput(
  value: number,
  setValue: (v: number) => void
) {
  const displayValue = value ? formatCurrency(value) : '';

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      setValue(raw ? parseInt(raw, 10) : 0);
    },
    [setValue]
  );

  return { displayValue, onChange };
}
