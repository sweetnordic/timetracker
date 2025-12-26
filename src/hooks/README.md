# React Query Hooks for Time Tracker

This directory contains React Query hooks for all database entities in the Time Tracker application. These hooks provide a clean abstraction layer with automatic caching, loading states, and error handling.

## Installation Requirements

Make sure you have React Query installed:

```bash
npm install @tanstack/react-query
```

## Setup

Wrap your app with QueryClient provider in your main component:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```

## Usage Examples

### Categories

```tsx
import {
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateCategoryOrder,
} from './hooks';

function CategoriesComponent() {
  const { data: categories, isLoading, error } = useCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateOrder = useUpdateCategoryOrder();

  const handleAddCategory = () => {
    addCategory.mutate({
      name: 'New Category',
      order: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  const handleUpdateCategory = (category) => {
    updateCategory.mutate({
      ...category,
      name: 'Updated Name',
    });
  };

  const handleDeleteCategory = (categoryId) => {
    deleteCategory.mutate(categoryId);
  };

  const handleReorderCategory = (categoryId, newOrder) => {
    updateOrder.mutate({ categoryId, newOrder });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {categories?.map((category) => (
        <div key={category.id}>
          {category.name}
          <button onClick={() => handleUpdateCategory(category)}>Update</button>
          <button onClick={() => handleDeleteCategory(category.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={handleAddCategory}>Add Category</button>
    </div>
  );
}
```

### Activities

```tsx
import {
  useActivities,
  useAddActivity,
  useUpdateActivity,
  useUpdateActivityOrder,
} from './hooks';

function ActivitiesComponent() {
  const { data: activities, isLoading, error } = useActivities();
  const addActivity = useAddActivity();
  const updateActivity = useUpdateActivity();
  const updateOrder = useUpdateActivityOrder();

  const handleAddActivity = () => {
    addActivity.mutate({
      name: 'New Activity',
      category: 'category-id',
      description: 'Activity description',
      external_system: '',
      order: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  return (
    <div>
      {activities?.map((activity) => (
        <div key={activity.id}>{activity.name}</div>
      ))}
    </div>
  );
}
```

### Time Entries

```tsx
import {
  useTimeEntries,
  useTimeEntriesByActivity,
  useOpenTimeEntries,
  useTotalDurationByActivity,
  useAddTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
} from './hooks';

function TimeTrackingComponent({ activityId }) {
  const { data: timeEntries } = useTimeEntries();
  const { data: activityEntries } = useTimeEntriesByActivity(activityId);
  const { data: openEntries } = useOpenTimeEntries();
  const { data: totalDuration } = useTotalDurationByActivity(activityId);

  const addTimeEntry = useAddTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();

  const startTracking = () => {
    addTimeEntry.mutate({
      activity_id: activityId,
      start_time: new Date(),
      end_time: null,
      duration: null,
      notes: '',
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  const stopTracking = (entryId, startTime) => {
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    updateTimeEntry.mutate({
      id: entryId,
      activity_id: activityId,
      start_time: startTime,
      end_time: endTime,
      duration: duration,
      notes: '',
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  return (
    <div>
      <p>Total Duration: {totalDuration} seconds</p>
      <p>Open Entries: {openEntries?.length || 0}</p>
      <button onClick={startTracking}>Start Tracking</button>
    </div>
  );
}
```

### Settings

```tsx
import { useTrackingSettings, useUpdateTrackingSettings } from './hooks';

function SettingsComponent() {
  const { data: settings, isLoading } = useTrackingSettings();
  const updateSettings = useUpdateTrackingSettings();

  const handleSaveSettings = () => {
    updateSettings.mutate({
      max_duration: 8 * 3600, // 8 hours
      warning_threshold: 3600, // 1 hour
      first_day_of_week: 'monday',
      default_goal_notification_threshold: 80,
      notifications_enabled: true,
    });
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div>
      <p>Max Duration: {settings?.max_duration} seconds</p>
      <p>Warning Threshold: {settings?.warning_threshold} seconds</p>
      <p>First Day of Week: {settings?.first_day_of_week}</p>
      <p>
        Notifications:{' '}
        {settings?.notifications_enabled ? 'Enabled' : 'Disabled'}
      </p>
      <button onClick={handleSaveSettings}>Save Settings</button>
    </div>
  );
}
```

### Goals

```tsx
import {
  useGoals,
  useGoalsByActivity,
  useGoalProgress,
  useAddGoal,
  useUpdateGoal,
  useDeleteGoal,
} from './hooks';

function GoalsComponent({ activityId }) {
  const { data: allGoals } = useGoals();
  const { data: activityGoals } = useGoalsByActivity(activityId);
  const addGoal = useAddGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const handleAddGoal = () => {
    addGoal.mutate({
      activity_id: activityId,
      target_hours: 8,
      period: 'daily',
      notification_threshold: 80,
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  return (
    <div>
      <h3>Goals for Activity</h3>
      {activityGoals?.map((goal) => (
        <GoalItem key={goal.id} goal={goal} />
      ))}
      <button onClick={handleAddGoal}>Add Goal</button>
    </div>
  );
}

function GoalItem({ goal }) {
  const { data: progress } = useGoalProgress(goal.id);

  return (
    <div>
      <p>
        {goal.target_hours} hours ({goal.period})
      </p>
      <p>Progress: {progress} hours</p>
      <div
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#f0f0f0',
        }}
      >
        <div
          style={{
            width: `${Math.min((progress / goal.target_hours) * 100, 100)}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
          }}
        />
      </div>
    </div>
  );
}
```
