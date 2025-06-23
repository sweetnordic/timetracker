import type { Activity, Category, TimeEntry, Goal } from '../models';

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Query types for better type safety
export interface TimeEntryFilters {
  activityId?: string;
  startDate?: Date;
  endDate?: Date;
  hasNotes?: boolean;
}

export interface ActivityFilters {
  categoryId?: string;
  hasDescription?: boolean;
  isActive?: boolean;
}

export interface GoalFilters {
  activityId?: string;
  period?: Goal['period'];
  isCompleted?: boolean;
}

// Database operation types
export type CreateActivityPayload = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateActivityPayload = Partial<Activity> & { id: string };

export type CreateTimeEntryPayload = Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTimeEntryPayload = Partial<TimeEntry> & { id: string };

export type CreateCategoryPayload = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryPayload = Partial<Category> & { id: string };

export type CreateGoalPayload = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGoalPayload = Partial<Goal> & { id: string };

// Validation schemas (can be extended with Zod later)
export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  validate?: (value: unknown) => boolean;
}

export const ACTIVITY_VALIDATION: ValidationRule<Activity>[] = [
  { field: 'name', required: true, minLength: 1, maxLength: 100 },
  { field: 'category', required: true, minLength: 1 },
  { field: 'description', maxLength: 500 },
];

export const TIME_ENTRY_VALIDATION: ValidationRule<TimeEntry>[] = [
  { field: 'activityId', required: true },
  { field: 'startTime', required: true },
  { field: 'duration', min: 0 },
];

export const GOAL_VALIDATION: ValidationRule<Goal>[] = [
  { field: 'activityId', required: true },
  { field: 'targetHours', required: true, min: 0.1, max: 1000 },
  { field: 'notificationThreshold', min: 0, max: 100 },
];
