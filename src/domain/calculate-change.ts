import type { NumericChange } from './types';

export function calculateChange(current: number, previous: number): NumericChange {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || current < 0 || previous < 0) {
    throw new Error('Change values must be finite non-negative numbers.');
  }

  if (previous === 0 && current === 0) {
    return {
      kind: 'unchanged-zero',
      current: 0,
      previous: 0,
      absolute: 0,
    };
  }

  if (previous === 0) {
    return {
      kind: 'from-zero',
      current,
      previous: 0,
      absolute: current,
    };
  }

  return {
    kind: 'percentage',
    current,
    previous,
    percentage: Math.round(((current - previous) / previous) * 100),
  };
}
