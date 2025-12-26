import type { ValidationResult, FormFieldError } from '../types/ui';
import { z } from 'zod';
import type { Activity, TimeEntry, Category, Goal } from '../models';
// Types are imported through ui types
// Individual model types no longer needed since type guards were moved

// Generic validation helper
export const createValidationResult = (
  errors: FormFieldError[] = [],
): ValidationResult => ({
  isValid: errors.length === 0,
  errors,
});

// Field validation functions
export const validateRequired = (
  field: string,
  value: unknown,
  fieldName: string,
): FormFieldError | null => {
  if (value === null || value === undefined || value === '') {
    return {
      field,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD',
    };
  }
  return null;
};

export const validateMinLength = (
  field: string,
  value: string,
  minLength: number,
  fieldName: string,
): FormFieldError | null => {
  if (value.length < minLength) {
    return {
      field,
      message: `${fieldName} must be at least ${minLength} characters`,
      code: 'MIN_LENGTH',
    };
  }
  return null;
};

export const validateMaxLength = (
  field: string,
  value: string,
  maxLength: number,
  fieldName: string,
): FormFieldError | null => {
  if (value.length > maxLength) {
    return {
      field,
      message: `${fieldName} must be no more than ${maxLength} characters`,
      code: 'MAX_LENGTH',
    };
  }
  return null;
};

export const validatePositiveNumber = (
  field: string,
  value: number,
  fieldName: string,
): FormFieldError | null => {
  if (value <= 0) {
    return {
      field,
      message: `${fieldName} must be a positive number`,
      code: 'POSITIVE_NUMBER',
    };
  }
  return null;
};

export const validateDateRange = (
  endField: string,
  startDate: Date,
  endDate: Date | null,
): FormFieldError[] => {
  const errors: FormFieldError[] = [];

  if (endDate && startDate >= endDate) {
    errors.push({
      field: endField,
      message: 'End time must be after start time',
      code: 'INVALID_DATE_RANGE',
    });
  }

  return errors;
};

// Specific validation functions
export const validateActivity = (data: unknown): Activity => {
  return ActivitySchema.parse(data);
};

export const validateTimeEntry = (data: unknown): TimeEntry => {
  return TimeEntrySchema.parse(data);
};

export const validateCategory = (data: unknown): Category => {
  return CategorySchema.parse(data);
};

export const validateGoal = (data: unknown): Goal => {
  return GoalSchema.parse(data);
};

// Partial validation for updates
export const validateActivityUpdate = (data: unknown) => {
  return ActivitySchema.partial().extend({ id: z.string().uuid() }).parse(data);
};

export const validateTimeEntryUpdate = (data: unknown) => {
  const BaseTimeEntrySchema = z.object({
    id: z.string().uuid().optional(),
    activityId: z.string().uuid('Invalid activity ID'),
    startTime: z.date(),
    endTime: z.date().nullable(),
    duration: z.number().min(0, 'Duration must be positive').nullable(),
    notes: z.string().max(1000, 'Notes too long').default(''),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  });

  return BaseTimeEntrySchema.partial()
    .extend({ id: z.string().uuid() })
    .parse(data);
};

// Business logic validations
export const validateTrackingDuration = (
  startTime: Date,
  endTime?: Date | null,
): boolean => {
  if (!endTime) return true;
  const duration = endTime.getTime() - startTime.getTime();
  const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return duration > 0 && duration <= maxDuration;
};

export const validateGoalProgress = (
  targetHours: number,
  currentHours: number,
): boolean => {
  return currentHours >= 0 && currentHours <= targetHours * 2; // Allow 200% over-achievement
};

// Base schemas
export const ActivitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, 'Activity name is required')
    .max(100, 'Activity name too long'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(500, 'Description too long').default(''),
  externalSystem: z.string().default(''),
  order: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const TimeEntrySchema = z
  .object({
    id: z.string().uuid().optional(),
    activityId: z.string().uuid('Invalid activity ID'),
    startTime: z.date(),
    endTime: z.date().nullable(),
    duration: z.number().min(0, 'Duration must be positive').nullable(),
    notes: z.string().max(1000, 'Notes too long').default(''),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  })
  .refine((data) => !data.endTime || data.endTime >= data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name too long'),
  order: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const GoalSchema = z.object({
  id: z.string().uuid().optional(),
  activityId: z.string().uuid('Invalid activity ID'),
  targetHours: z
    .number()
    .min(0.1, 'Target hours must be at least 0.1')
    .max(1000, 'Target hours too high'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  notificationThreshold: z
    .number()
    .min(0)
    .max(100, 'Notification threshold must be between 0-100'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Note: Type guards are available in ../utils/type-guards.ts
