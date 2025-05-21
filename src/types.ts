export const DEFAULT_ORDER: number = 1;

export interface Activity {
  id?: string;
  name: string;
  category: string;
  description: string;
  external_system: string;
  created_at: Date;
  updated_at: Date;
  order: number;
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
}

export interface ImportData {
  activities: Activity[];
  timeEntries: TimeEntry[];
  categories: Category[];
  exportDate: string;
  databaseVersion: number;
}
