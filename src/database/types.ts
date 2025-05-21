export const DEFAULT_ORDER: number = 1;
export const DEFAULT_NOTIFICATION_THRESHOLD: number = 90;
export const DEFAULT_FIRST_DAY_OF_WEEK: FirstDayOfWeek = 'monday';
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const DEFAULT_SCHEDULE: WorkSchedule[] = [
  {
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_workday: true,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Monday
  {
    day_of_week: 2,
    start_time: '09:00',
    end_time: '17:00',
    is_workday: true,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Tuesday
  {
    day_of_week: 3,
    start_time: '09:00',
    end_time: '17:00',
    is_workday: true,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Wednesday
  {
    day_of_week: 4,
    start_time: '09:00',
    end_time: '17:00',
    is_workday: true,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Thursday
  {
    day_of_week: 5,
    start_time: '09:00',
    end_time: '17:00',
    is_workday: true,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Friday
  {
    day_of_week: 6,
    start_time: '00:00',
    end_time: '00:00',
    is_workday: false,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Saturday
  {
    day_of_week: 0,
    start_time: '00:00',
    end_time: '00:00',
    is_workday: false,
    created_at: new Date(),
    updated_at: new Date(),
  }, // Sunday
];

export const DEFAULT_SETTINGS = {
  id: 'default',
  max_duration: 12 * 3600, // 12 hours in seconds
  warning_threshold: 3600, // 1 hour warning
  first_day_of_week: DEFAULT_FIRST_DAY_OF_WEEK,
  default_goal_notification_threshold: DEFAULT_NOTIFICATION_THRESHOLD,
  notifications_enabled: true,
  created_at: new Date(),
  updated_at: new Date(),
};

export type FirstDayOfWeek = 'monday' | 'sunday';
export type OffTimeType = 'vacation' | 'sick' | 'business_trip' | 'education' | 'other';
export type Period = 'daily' | 'weekly' | 'monthly';

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

export interface WorkSchedule {
  id?: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  is_workday: boolean; // false for weekends/holidays
  created_at: Date;
  updated_at: Date;
}

export interface OffTime {
  id?: string;
  start_date: Date;
  end_date: Date;
  type: OffTimeType;
  description?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: Date;
  updated_at: Date;
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
