import type { Activity, TimeEntry, Goal, Category } from '../models';

// Type guards for runtime type checking
export const isValidActivity = (obj: unknown): obj is Activity => {
  if (typeof obj !== 'object' || obj === null) return false;

  const activity = obj as Record<string, unknown>;

  return (
    typeof activity.name === 'string' &&
    typeof activity.category === 'string' &&
    typeof activity.description === 'string' &&
    typeof activity.externalSystem === 'string' &&
    typeof activity.order === 'number' &&
    activity.createdAt instanceof Date &&
    activity.updatedAt instanceof Date
  );
};

export const isValidTimeEntry = (obj: unknown): obj is TimeEntry => {
  if (typeof obj !== 'object' || obj === null) return false;

  const entry = obj as Record<string, unknown>;

  return (
    typeof entry.activityId === 'string' &&
    entry.startTime instanceof Date &&
    (entry.endTime === null || entry.endTime instanceof Date) &&
    (entry.duration === null || typeof entry.duration === 'number') &&
    typeof entry.notes === 'string' &&
    entry.createdAt instanceof Date &&
    entry.updatedAt instanceof Date
  );
};

export const isValidGoal = (obj: unknown): obj is Goal => {
  if (typeof obj !== 'object' || obj === null) return false;

  const goal = obj as Record<string, unknown>;
  const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];

  return (
    typeof goal.activityId === 'string' &&
    typeof goal.targetHours === 'number' &&
    typeof goal.period === 'string' &&
    validPeriods.includes(goal.period as string) &&
    typeof goal.notificationThreshold === 'number' &&
    goal.createdAt instanceof Date &&
    goal.updatedAt instanceof Date
  );
};

export const isValidCategory = (obj: unknown): obj is Category => {
  if (typeof obj !== 'object' || obj === null) return false;

  const category = obj as Record<string, unknown>;

  return (
    typeof category.name === 'string' &&
    typeof category.order === 'number' &&
    category.createdAt instanceof Date &&
    category.updatedAt instanceof Date
  );
};

// Array type guards
export const isActivityArray = (obj: unknown): obj is Activity[] => {
  return Array.isArray(obj) && obj.every(isValidActivity);
};

export const isTimeEntryArray = (obj: unknown): obj is TimeEntry[] => {
  return Array.isArray(obj) && obj.every(isValidTimeEntry);
};

export const isGoalArray = (obj: unknown): obj is Goal[] => {
  return Array.isArray(obj) && obj.every(isValidGoal);
};

export const isCategoryArray = (obj: unknown): obj is Category[] => {
  return Array.isArray(obj) && obj.every(isValidCategory);
};

// Utility type guards for common types
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isNonEmptyString = (value: unknown): value is string => {
  return isString(value) && value.trim().length > 0;
};

export const isPositiveNumber = (value: unknown): value is number => {
  return isNumber(value) && value > 0;
};

export const isNonNegativeNumber = (value: unknown): value is number => {
  return isNumber(value) && value >= 0;
};

// Generic type guard for objects with required keys
export const hasRequiredKeys = <T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[],
): obj is T => {
  if (typeof obj !== 'object' || obj === null) return false;

  const record = obj as Record<string, unknown>;
  return keys.every((key) => key in record);
};

// Type assertion helpers with validation
export const assertActivity = (obj: unknown): Activity => {
  if (!isValidActivity(obj)) {
    throw new Error('Invalid activity object');
  }
  return obj;
};

export const assertTimeEntry = (obj: unknown): TimeEntry => {
  if (!isValidTimeEntry(obj)) {
    throw new Error('Invalid time entry object');
  }
  return obj;
};

export const assertGoal = (obj: unknown): Goal => {
  if (!isValidGoal(obj)) {
    throw new Error('Invalid goal object');
  }
  return obj;
};

export const assertCategory = (obj: unknown): Category => {
  if (!isValidCategory(obj)) {
    throw new Error('Invalid category object');
  }
  return obj;
};
