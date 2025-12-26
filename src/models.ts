import type { Period, FirstDayOfWeek } from './utils/constants';

// UI layer models - camelCase naming, business logic focused
export interface Activity {
  id?: string;
  name: string;
  category: string;
  description: string;
  externalSystem: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id?: string;
  activityId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingSettings {
  maxDuration: number; // in seconds
  warningThreshold: number; // in seconds
  firstDayOfWeek: FirstDayOfWeek;
  defaultGoalNotificationThreshold: number; // percentage (0-100)
  notificationsEnabled: boolean;
  stopTrackingOnClose: boolean; // Stop tracking when app/tab closes
  stopTrackingOnTabSwitch: boolean; // Stop tracking when tab becomes hidden
  darkMode?: boolean; // Optional for backwards compatibility
}

export interface Goal {
  id?: string;
  activityId: string;
  targetHours: number;
  period: Period;
  notificationThreshold: number; // percentage (0-100)
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  progressPercentage: number;
}

export interface ActivityWithStats extends Activity {
  totalDuration: number;
}

export interface WeeklyStats {
  totalTime: number;
  byActivity: { [key: string]: number };
  byCategory: { [key: string]: number };
  byExternalSystem: { [key: string]: number };
  dailyBreakdown: {
    [key: string]: {
      // activity name
      [key: string]: number; // day of week -> duration
    };
  };
  goalStats: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    byPeriod: {
      daily: { total: number; completed: number };
      weekly: { total: number; completed: number };
      monthly: { total: number; completed: number };
      yearly: { total: number; completed: number };
    };
    byActivity: {
      [key: string]: {
        name: string;
        target: number;
        progress: number;
        percentage: number;
        period: Period;
      };
    };
  };
}

// Re-export common types from database models
export type { Period, FirstDayOfWeek };
