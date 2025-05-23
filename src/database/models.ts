export type Period = 'daily' | 'weekly' | 'monthly';
export type FirstDayOfWeek = 'monday' | 'sunday';

export const DEFAULT_ORDER: number = 1;
export const DEFAULT_NOTIFICATION_THRESHOLD: number = 90;
export const DEFAULT_FIRST_DAY_OF_WEEK: FirstDayOfWeek = 'monday';
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface Activity {
  id?: string;
  name: string;
  category: string;
  description: string;
  external_system: string;
  order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id?: string;
  name: string;
  order: number;
  created_at: Date;
  updated_at: Date;
}

export interface TimeEntry {
  id?: string;
  activity_id: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export interface TrackingSettings {
  maxDuration: number; // in seconds
  warningThreshold: number; // in seconds
  firstDayOfWeek: FirstDayOfWeek;
  defaultGoalNotificationThreshold: number; // percentage (0-100)
  notificationsEnabled: boolean;
}

export interface ImportData {
  activities: Activity[];
  timeEntries: TimeEntry[];
  categories: Category[];
  goals: Goal[];
  exportDate: string;
  databaseVersion: number;
}

export interface Goal {
  id?: string;
  activity_id: string;
  target_hours: number;
  period: Period;
  notification_threshold: number; // percentage (0-100)
  created_at: Date;
  updated_at: Date;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  progressPercentage: number;
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
