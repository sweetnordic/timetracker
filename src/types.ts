export const DEFAULT_ORDER: number = 1;
export const DEFAULT_NOTIFICATION_THRESHOLD: number = 90;

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
  created_at: Date;
  updated_at: Date;
  order: number;
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
  firstDayOfWeek: 'monday' | 'sunday';
  defaultGoalNotificationThreshold: number; // percentage (0-100)
  notificationsEnabled: boolean;
}

export interface ImportData {
  activities: Activity[];
  timeEntries: TimeEntry[];
  categories: Category[];
  exportDate: string;
  databaseVersion: number;
}

export interface Goal {
  id?: string;
  activity_id: string;
  target_hours: number;
  period: 'daily' | 'weekly' | 'monthly';
  notification_threshold: number; // percentage (0-100)
  created_at: Date;
  updated_at: Date;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  progressPercentage: number;
}
