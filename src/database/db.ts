import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface TimeTrackerDB extends DBSchema {
  activities: {
    key: number;
    value: {
      id?: number;
      name: string;
      category: string;
      created_at: Date;
      updated_at: Date;
    };
    indexes: { 'by-category': string };
  };
  timeEntries: {
    key: number;
    value: {
      id?: number;
      activity_id: number;
      start_time: Date;
      end_time: Date | null;
      duration: number | null;
      notes: string;
      created_at: Date;
      updated_at: Date;
    };
    indexes: { 'by-activity': number; 'by-date': Date };
  };
  categories: {
    key: number;
    value: {
      id?: number;
      name: string;
      created_at: Date;
      updated_at: Date;
    };
  };
}

class DatabaseService {
  private db: IDBPDatabase<TimeTrackerDB> | null = null;
  private readonly DB_NAME = 'TimeTrackerDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB<TimeTrackerDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create activities store
        const activitiesStore = db.createObjectStore('activities', {
          keyPath: 'id',
          autoIncrement: true,
        });
        activitiesStore.createIndex('by-category', 'category');

        // Create time entries store
        const timeEntriesStore = db.createObjectStore('timeEntries', {
          keyPath: 'id',
          autoIncrement: true,
        });
        timeEntriesStore.createIndex('by-activity', 'activity_id');
        timeEntriesStore.createIndex('by-date', 'start_time');

        // Create categories store
        db.createObjectStore('categories', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
  }

  // Activity methods
  async addActivity(activity: Omit<TimeTrackerDB['activities']['value'], 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('activities', activity);
  }

  async getActivities(): Promise<TimeTrackerDB['activities']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('activities');
  }

  // Time entry methods
  async addTimeEntry(entry: Omit<TimeTrackerDB['timeEntries']['value'], 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('timeEntries', entry);
  }

  async updateTimeEntry(entry: TimeTrackerDB['timeEntries']['value']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('timeEntries', entry);
  }

  async getTimeEntries(): Promise<TimeTrackerDB['timeEntries']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('timeEntries');
  }

  async getTimeEntriesByActivity(activityId: number): Promise<TimeTrackerDB['timeEntries']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    const index = this.db.transaction('timeEntries').store.index('by-activity');
    return index.getAll(activityId);
  }

  async getTotalDurationByActivity(activityId: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const entries = await this.getTimeEntriesByActivity(activityId);
    return entries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  }

  // Category methods
  async addCategory(category: Omit<TimeTrackerDB['categories']['value'], 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('categories', category);
  }

  async getCategories(): Promise<TimeTrackerDB['categories']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('categories');
  }
}

export const db = new DatabaseService();
