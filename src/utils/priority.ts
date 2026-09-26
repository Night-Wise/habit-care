/** Stored as numbers for sort/compat. None=0, Low=1, Medium=2, High=3, Critical=4. */
export type PriorityValue = 0 | 1 | 2 | 3 | 4;

export const PRIORITY_NONE = 0 as const;
export const PRIORITY_LOW = 1 as const;
export const PRIORITY_MEDIUM = 2 as const;
export const PRIORITY_HIGH = 3 as const;
export const PRIORITY_CRITICAL = 4 as const;

export const PRIORITY_OPTIONS: { value: PriorityValue; label: string }[] = [
  { value: PRIORITY_NONE, label: 'None' },
  { value: PRIORITY_LOW, label: 'Low' },
  { value: PRIORITY_MEDIUM, label: 'Medium' },
  { value: PRIORITY_HIGH, label: 'High' },
  { value: PRIORITY_CRITICAL, label: 'Critical' },
];

/** Map any stored number (including legacy P5+) into None/Low/Medium/High/Critical. */
export function normalizePriority(priority: unknown): PriorityValue {
  if (typeof priority !== 'number' || Number.isNaN(priority) || priority <= 0) {
    return PRIORITY_NONE;
  }
  if (priority === 1) return PRIORITY_LOW;
  if (priority === 2) return PRIORITY_MEDIUM;
  if (priority === 3) return PRIORITY_HIGH;
  return PRIORITY_CRITICAL;
}

export function formatPriorityLabel(priority: unknown): string {
  const value = normalizePriority(priority);
  return PRIORITY_OPTIONS.find((option) => option.value === value)?.label ?? 'None';
}

export function hasPriority(priority: unknown): boolean {
  return normalizePriority(priority) > PRIORITY_NONE;
}

export type PriorityTone = 'low' | 'medium' | 'high' | 'critical';

export function getPriorityTone(priority: unknown): PriorityTone | null {
  const value = normalizePriority(priority);
  if (value === PRIORITY_CRITICAL) return 'critical';
  if (value === PRIORITY_HIGH) return 'high';
  if (value === PRIORITY_MEDIUM) return 'medium';
  if (value === PRIORITY_LOW) return 'low';
  return null;
}
