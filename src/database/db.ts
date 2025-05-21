import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ORDER } from '../types';

interface TimeTrackerDB extends DBSchema {
  categories: {
    key: string;
    value: {
      id?: string;
      name: string;
      order: number;
      created_at: Date;
      updated_at: Date;
    };
  };
  activities: {
    key: string;
    value: {
      id?: string;
      name: string;
      category: string;
      description: string;
      external_system: string;
      order: number;
      created_at: Date;
      updated_at: Date;
    };
    indexes: {
      'by-category': string;
      'by-order': number;
    };
  };
  timeEntries: {
    key: string;
    value: {
      id?: string;
      activity_id: string;
      start_time: Date;
      end_time: Date | null;
      duration: number | null;
      notes: string;
      created_at: Date;
      updated_at: Date;
    };
    indexes: { 'by-activity': string; 'by-date': Date };
  };
  settings: {
    key: string;
    value: {
      id?: string;
      max_duration: number; // in seconds
      warning_threshold: number; // in seconds
      first_day_of_week: 'monday' | 'sunday';
      created_at: Date;
      updated_at: Date;
    };
  };
}

/**
 * Name of the Database in the browser's IndexedDB
 */
export const DB_NAME = 'TimeTrackerDB';

/**
 * Version of the Database to trigger upgrades
 */
export const DB_VERSION = 2;

class DatabaseService {
  private db: IDBPDatabase<TimeTrackerDB> | null = null;
  private readonly DB_NAME = DB_NAME;
  private readonly DB_VERSION = DB_VERSION;

  async init(): Promise<void> {
    this.db = await openDB<TimeTrackerDB>(this.DB_NAME, this.DB_VERSION, {
      async upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Create activities store
          const activitiesStore = db.createObjectStore('activities', {
            keyPath: 'id',
          });
          activitiesStore.createIndex('by-category', 'category');
          activitiesStore.createIndex('by-order', 'order');

          // Create time entries store
          const timeEntriesStore = db.createObjectStore('timeEntries', {
            keyPath: 'id',
          });
          timeEntriesStore.createIndex('by-activity', 'activity_id');
          timeEntriesStore.createIndex('by-date', 'start_time');

          // Create categories store
          db.createObjectStore('categories', {
            keyPath: 'id',
          });

          // Create settings store
          db.createObjectStore('settings', {
            keyPath: 'id',
          });
        } else if (oldVersion < 2) {
          // Add by-order index to existing activities store
          const activitiesStore = db.createObjectStore('activities', {
            keyPath: 'id',
          });
          activitiesStore.createIndex('by-category', 'category');
          activitiesStore.createIndex('by-order', 'order');
        }
      },
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Activity methods
  async addActivity(activity: Omit<TimeTrackerDB['activities']['value'], 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      return await this.db.add('activities', {
        id: uuidv4(),
        ...activity,
        created_at: activity.created_at || new Date(),
        updated_at: activity.updated_at || new Date(),
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
      const activities = await this.db.getAll('activities');
      return activities.sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER));
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  }

  async updateActivityOrder(activityId: string, newOrder: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('activities', 'readwrite');
    const store = tx.objectStore('activities');
    const activity = await store.get(activityId);

    if (activity) {
      activity.order = newOrder;
      activity.updated_at = new Date();
      await store.put(activity);
    }

    await tx.done;
  }

  // Time entry methods
  async addTimeEntry(entry: Omit<TimeTrackerDB['timeEntries']['value'], 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('timeEntries', {
      id: uuidv4(),
      ...entry,
      created_at: entry.created_at || new Date(),
      updated_at: entry.updated_at || new Date()
    });
  }

  async updateTimeEntry(entry: TimeTrackerDB['timeEntries']['value']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('timeEntries', entry);
  }

  async deleteTimeEntry(entryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('timeEntries', entryId);
  }

  async getTimeEntries(): Promise<TimeTrackerDB['timeEntries']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('timeEntries');
  }

  async getTimeEntriesByActivity(activityId: string): Promise<TimeTrackerDB['timeEntries']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    const index = this.db.transaction('timeEntries').store.index('by-activity');
    return index.getAll(activityId);
  }

  async getTotalDurationByActivity(activityId: string): Promise<number> {
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
  async addCategory(category: Omit<TimeTrackerDB['categories']['value'], 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.add('categories', {
      id: uuidv4(),
      ...category,
      created_at: category.created_at || new Date(),
      updated_at: category.updated_at || new Date(),
    });
  }

  async getCategories(): Promise<TimeTrackerDB['categories']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('categories');
  }

  async getTrackingSettings(): Promise<{ maxDuration: number; warningThreshold: number; firstDayOfWeek: 'monday' | 'sunday' }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const settings = await this.db.getAll('settings');
      if (settings.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          id: 'default',
          max_duration: 12 * 3600, // 12 hours in seconds
          warning_threshold: 3600, // 1 hour warning
          first_day_of_week: 'monday' as const,
          created_at: new Date(),
          updated_at: new Date()
        };
        try {
          await this.db.add('settings', defaultSettings);
        } catch (error) {
          // If settings already exist, try to get them
          const existingSettings = await this.db.getAll('settings');
          if (existingSettings.length > 0) {
            return {
              maxDuration: existingSettings[0].max_duration,
              warningThreshold: existingSettings[0].warning_threshold,
              firstDayOfWeek: existingSettings[0].first_day_of_week
            };
          }
          throw error;
        }
        return {
          maxDuration: defaultSettings.max_duration,
          warningThreshold: defaultSettings.warning_threshold,
          firstDayOfWeek: defaultSettings.first_day_of_week
        };
      }
      return {
        maxDuration: settings[0].max_duration,
        warningThreshold: settings[0].warning_threshold,
        firstDayOfWeek: settings[0].first_day_of_week
      };
    } catch (error) {
      console.error('Error getting tracking settings:', error);
      throw error;
    }
  }

  async updateTrackingSettings(
    maxDuration: number,
    warningThreshold: number,
    firstDayOfWeek: 'monday' | 'sunday'
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const settings = await this.db.getAll('settings');
      if (settings.length === 0) {
        await this.db.add('settings', {
          id: 'default',
          max_duration: maxDuration,
          warning_threshold: warningThreshold,
          first_day_of_week: firstDayOfWeek,
          created_at: new Date(),
          updated_at: new Date()
        });
      } else {
        await this.db.put('settings', {
          id: settings[0].id,
          max_duration: maxDuration,
          warning_threshold: warningThreshold,
          first_day_of_week: firstDayOfWeek,
          created_at: settings[0].created_at,
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating tracking settings:', error);
      throw error;
    }
  }

  async getOpenTimeEntries(): Promise<TimeTrackerDB['timeEntries']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const allEntries = await this.db.getAll('timeEntries');
      return allEntries
        .filter(entry => entry.end_time === null)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    } catch (error) {
      console.error('Error getting open time entries:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      await Promise.all([
        this.db.clear('activities'),
        this.db.clear('timeEntries'),
        this.db.clear('categories'),
        this.db.clear('settings')
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();
