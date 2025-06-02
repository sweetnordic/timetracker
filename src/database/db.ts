import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ORDER } from '../utils/constants';
import type { Activity, Category, TimeEntry, Goal } from '../models';

export interface TimeTrackerDB extends DBSchema {
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-order': number; };
  };
  activities: {
    key: string;
    value: Activity;
    indexes: { 'by-category': string; 'by-order': number; };
  };
  timeEntries: {
    key: string;
    value: TimeEntry;
    indexes: { 'by-activity': string; 'by-date': Date };
  };
  goals: {
    key: string;
    value: Goal;
    indexes: { 'by-activity': string };
  };
}

/**
 * Name of the Database in the browser's IndexedDB
 */
export const DB_NAME = 'TimeTrackerDB';

/**
 * Version of the Database to trigger upgrades
 */
export const DB_VERSION = 1;

class DatabaseService {
  private db: IDBPDatabase<TimeTrackerDB> | null = null;
  private readonly DB_NAME = DB_NAME;
  private readonly DB_VERSION = DB_VERSION;

  async init(): Promise<void> {
    this.db = await openDB<TimeTrackerDB>(this.DB_NAME, this.DB_VERSION, {
      async upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Create categories store
          const categoriesStore = db.createObjectStore('categories', {
            keyPath: 'id',
          });
          categoriesStore.createIndex('by-order', 'order', { unique: false });

          // Create activities store
          const activitiesStore = db.createObjectStore('activities', {
            keyPath: 'id',
          });
          activitiesStore.createIndex('by-category', 'category');
          activitiesStore.createIndex('by-order', 'order', { unique: false });

          // Create time entries store
          const timeEntriesStore = db.createObjectStore('timeEntries', {
            keyPath: 'id',
          });
          timeEntriesStore.createIndex('by-activity', 'activityId');
          timeEntriesStore.createIndex('by-date', 'startTime');

          // Create goals store
          const goalsStore = db.createObjectStore('goals', {
            keyPath: 'id',
          });
          goalsStore.createIndex('by-activity', 'activityId');
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

  // Activity methods - now work directly with UI models
  async addActivity(activity: Omit<Activity, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const newActivity: Activity = {
        id: uuidv4(),
        ...activity,
        createdAt: activity.createdAt || new Date(),
        updatedAt: activity.updatedAt || new Date(),
      };
      await this.db.add('activities', newActivity);
      return newActivity.id!;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  async updateActivity(activity: Activity): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!activity.id) throw new Error('Activity ID is required for update');
    try {
      const updatedActivity = {
        ...activity,
        updatedAt: new Date()
      };
      await this.db.put('activities', updatedActivity);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  async getActivities(): Promise<Activity[]> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const dbActivities = await this.db.getAll('activities');
      return dbActivities
        .sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER));
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  }

  async updateActivityOrder(activityId: string, newOrder: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('activities', 'readwrite');
    const store = tx.objectStore('activities');
    const dbActivity = await store.get(activityId);

    if (dbActivity) {
      dbActivity.order = newOrder;
      dbActivity.updatedAt = new Date();
      await store.put(dbActivity);
    }

    await tx.done;
  }

  // Time entry methods - now return UI models
  async addTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const dbEntry = {
      id: uuidv4(),
      ...entry,
      createdAt: entry.createdAt || new Date(),
      updatedAt: entry.updatedAt || new Date()
    };
    return this.db.add('timeEntries', dbEntry);
  }

  async updateTimeEntry(entry: TimeEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const dbEntry = {
      ...entry,
      updatedAt: new Date()
    };
    await this.db.put('timeEntries', dbEntry);
  }

  async deleteTimeEntry(entryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('timeEntries', entryId);
  }

  async getTimeEntries(): Promise<TimeEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    const dbEntries = await this.db.getAll('timeEntries');
    return dbEntries;
  }

  async getTimeEntriesByActivity(activityId: string): Promise<TimeEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    const index = this.db.transaction('timeEntries').store.index('by-activity');
    const dbEntries = await index.getAll(activityId);
    return dbEntries;
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

  // Category methods - now return UI models
  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const dbCategory = {
      id: uuidv4(),
      ...category,
      createdAt: category.createdAt || new Date(),
      updatedAt: category.updatedAt || new Date(),
    };
    return this.db.add('categories', dbCategory);
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    const dbCategories = await this.db.getAll('categories');
    return dbCategories;
  }

  async updateCategoryOrder(categoryId: string, newOrder: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    const dbCategory = await store.get(categoryId);

    if (dbCategory) {
      dbCategory.order = newOrder;
      dbCategory.updatedAt = new Date();
      await store.put(dbCategory);
    }

    await tx.done;
  }

  async updateCategory(category: Category): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!category.id) throw new Error('Category ID is required for update');
    try {
      const updatedCategory = {
        ...category,
        updatedAt: new Date()
      };
      await this.db.put('categories', updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      await this.db.delete('categories', categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async getOpenTimeEntries(): Promise<TimeEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const allDbEntries = await this.db.getAll('timeEntries');
      return allDbEntries
        .filter(entry => entry.endTime === null)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } catch (error) {
      console.error('Error getting open time entries:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      await Promise.all([
        this.db.clear('categories'),
        this.db.clear('activities'),
        this.db.clear('timeEntries'),
        this.db.clear('goals'),
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Goal methods - now return UI models
  async addGoal(goal: Omit<Goal, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const dbGoal = {
      id: uuidv4(),
      ...goal,
      createdAt: goal.createdAt || new Date(),
      updatedAt: goal.updatedAt || new Date(),
    };
    return this.db.add('goals', dbGoal);
  }

  async updateGoal(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!goal.id) throw new Error('Goal ID is required for update');
    const updatedGoal = {
      ...goal,
      updatedAt: new Date()
    };
    await this.db.put('goals', updatedGoal);
  }

  async deleteGoal(goalId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('goals', goalId);
  }

  async getGoals(): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');
    const dbGoals = await this.db.getAll('goals');
    return dbGoals;
  }

  async getGoalsByActivity(activityId: string): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');
    const index = this.db.transaction('goals').store.index('by-activity');
    const dbGoals = await index.getAll(activityId);
    return dbGoals;
  }

  async getGoalProgress(goalId: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const dbGoal = await this.db.get('goals', goalId);
    if (!dbGoal) return 0;

    const now = new Date();
    let startDate: Date;

    switch (dbGoal.period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return 0;
    }

    const entries = await this.getTimeEntriesByActivity(dbGoal.activityId);
    const relevantEntries = entries.filter(entry =>
      entry.endTime &&
      new Date(entry.startTime) >= startDate &&
      new Date(entry.startTime) <= now
    );

    const totalSeconds = relevantEntries.reduce((total, entry) =>
      total + (entry.duration || 0), 0
    );

    return totalSeconds / 3600; // Convert to hours
  }
}

export const db = new DatabaseService();
