import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface TimeTrackerDB extends DBSchema {
  activities: {
    key: number;
    value: {
      id?: number;
      name: string;
      category: string;
      description: string;
      external_system: string;
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
  settings: {
    id?: number;
    max_duration: number; // in seconds
    warning_threshold: number; // in seconds
    created_at: Date;
    updated_at: Date;
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

        // Create settings store
        db.createObjectStore('settings', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
  }

  // Activity methods
  async addActivity(activity: Omit<TimeTrackerDB['activities']['value'], 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      return await this.db.add('activities', {
        ...activity,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  async updateActivity(activity: TimeTrackerDB['activities']['value']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!activity.id) throw new Error('Activity ID is required for update');
    try {
      await this.db.put('activities', {
        ...activity,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  async getActivities(): Promise<TimeTrackerDB['activities']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      return await this.db.getAll('activities');
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
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

  async deleteTimeEntry(entryId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('timeEntries', entryId);
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

  async getTrackingSettings(): Promise<{ maxDuration: number; warningThreshold: number }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const settings = await this.db.getAll('settings');
      if (settings.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          max_duration: 12 * 3600, // 12 hours in seconds
          warning_threshold: 3600, // 1 hour warning
          created_at: new Date(),
          updated_at: new Date()
        };
        await this.db.add('settings', defaultSettings);
        return {
          maxDuration: defaultSettings.max_duration,
          warningThreshold: defaultSettings.warning_threshold
        };
      }
      return {
        maxDuration: settings[0].max_duration,
        warningThreshold: settings[0].warning_threshold
      };
    } catch (error) {
      console.error('Error getting tracking settings:', error);
      throw error;
    }
  }

  async updateTrackingSettings(maxDuration: number, warningThreshold: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const settings = await this.db.getAll('settings');
      if (settings.length === 0) {
        await this.db.add('settings', {
          max_duration: maxDuration,
          warning_threshold: warningThreshold,
          created_at: new Date(),
          updated_at: new Date()
        });
      } else {
        await this.db.put('settings', {
          id: settings[0].id,
          max_duration: maxDuration,
          warning_threshold: warningThreshold,
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating tracking settings:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();
