import { useMemo } from 'react';
import { useActivities, useTimeEntries, useGoals } from '.';
import type { ActivityWithStats, Activity, TimeEntry, Goal } from '../models';

/**
 * Optimized hook that combines activities with their statistics
 * Memoized to prevent unnecessary recalculations
 */
export const useActivitiesWithStats = () => {
  const {
    data: dbActivities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useActivities();
  const { data: allTimeEntries = [], isLoading: entriesLoading } =
    useTimeEntries();
  const { data: allGoals = [], isLoading: goalsLoading } = useGoals();

  // Memoize activity statistics calculation
  const activitiesWithStats: ActivityWithStats[] = useMemo(() => {
    if (!dbActivities.length) return [];

    return dbActivities.map((activity: Activity) => {
      // Calculate total duration for this activity
      const activityTimeEntries = allTimeEntries.filter(
        (entry: TimeEntry) =>
          entry.activityId === activity.id && entry.duration !== null,
      );

      const totalDuration = activityTimeEntries.reduce(
        (total: number, entry: TimeEntry) => total + (entry.duration || 0),
        0,
      );

      return {
        ...activity,
        totalDuration,
      };
    });
  }, [dbActivities, allTimeEntries]);

  // Memoize activities grouped by category
  const activitiesByCategory = useMemo(() => {
    return activitiesWithStats.reduce(
      (acc, activity) => {
        if (!acc[activity.category]) {
          acc[activity.category] = [];
        }
        acc[activity.category].push(activity);
        return acc;
      },
      {} as Record<string, ActivityWithStats[]>,
    );
  }, [activitiesWithStats]);

  // Memoize goal progress calculations
  const goalProgressMap = useMemo(() => {
    const progressMap = new Map<string, number>();

    allGoals.forEach((goal: Goal) => {
      const activityEntries = allTimeEntries.filter(
        (entry: TimeEntry) =>
          entry.activityId === goal.activityId && entry.duration !== null,
      );

      const totalHours = activityEntries.reduce(
        (total: number, entry: TimeEntry) =>
          total + (entry.duration || 0) / 3600,
        0,
      );

      const progressPercentage = (totalHours / goal.targetHours) * 100;
      progressMap.set(goal.activityId, Math.min(progressPercentage, 100));
    });

    return progressMap;
  }, [allGoals, allTimeEntries]);

  const isLoading = activitiesLoading || entriesLoading || goalsLoading;
  const error = activitiesError;

  return {
    activitiesWithStats,
    activitiesByCategory,
    goalProgressMap,
    isLoading,
    error,
  };
};
