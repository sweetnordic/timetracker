import React, { useState, useEffect } from 'react';
import { db } from '../database/db';

interface Activity {
  id?: number;
  name: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

interface Category {
  id?: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export const ActivityManager: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newActivityName, setNewActivityName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const loadedActivities = await db.getActivities();
      const loadedCategories = await db.getCategories();
      setActivities(loadedActivities);
      setCategories(loadedCategories);
    };
    loadData();
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !selectedCategory) return;

    const now = new Date();
    const newActivity: Omit<Activity, 'id'> = {
      name: newActivityName,
      category: selectedCategory,
      created_at: now,
      updated_at: now,
    };

    await db.addActivity(newActivity);
    const updatedActivities = await db.getActivities();
    setActivities(updatedActivities);
    setNewActivityName('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    const now = new Date();
    const newCategory: Omit<Category, 'id'> = {
      name: newCategoryName,
      created_at: now,
      updated_at: now,
    };

    await db.addCategory(newCategory);
    const updatedCategories = await db.getCategories();
    setCategories(updatedCategories);
    setNewCategoryName('');
  };

  return (
    <div className="activity-manager">
      <h2>Activity Manager</h2>

      <div className="category-section">
        <h3>Categories</h3>
        <form onSubmit={handleAddCategory}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
          />
          <button type="submit">Add Category</button>
        </form>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>{category.name}</li>
          ))}
        </ul>
      </div>

      <div className="activity-section">
        <h3>Activities</h3>
        <form onSubmit={handleAddActivity}>
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="New activity name"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="submit">Add Activity</button>
        </form>
        <ul>
          {activities.map((activity) => (
            <li key={activity.id}>
              {activity.name} ({activity.category})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
