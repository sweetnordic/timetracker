import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { DatabaseGoal } from '../database/models';
import type { Goal } from '../models';

export const GOALS_QUERY_KEY = 'goals';
export const GOAL_PROGRESS_QUERY_KEY = 'goalProgress';

// Convert UI goal to database format
const convertUIToDatabase = (goal: Goal): DatabaseGoal => ({
  id: goal.id,
  activity_id: goal.activityId,
  target_hours: goal.targetHours,
  period: goal.period,
  notification_threshold: goal.notificationThreshold,
  created_at: goal.createdAt,
  updated_at: goal.updatedAt,
});

// Get all goals - returns database models
export const useGoals = () => {
  return useQuery({
    queryKey: [GOALS_QUERY_KEY],
    queryFn: async () => {
      const uiGoals = await db.getGoals();
      return uiGoals.map(convertUIToDatabase);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get goals by activity - returns database models
export const useGoalsByActivity = (activityId: string) => {
  return useQuery({
    queryKey: [GOALS_QUERY_KEY, 'by-activity', activityId],
    queryFn: async () => {
      const uiGoals = await db.getGoalsByActivity(activityId);
      return uiGoals.map(convertUIToDatabase);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!activityId,
  });
};

// Get goal progress
export const useGoalProgress = (goalId: string) => {
  return useQuery({
    queryKey: [GOAL_PROGRESS_QUERY_KEY, goalId],
    queryFn: () => db.getGoalProgress(goalId),
    staleTime: 30 * 1000, // 30 seconds - progress should be relatively fresh
    enabled: !!goalId,
  });
};

// Add goal - accepts database model
export const useAddGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<DatabaseGoal, 'id'>) => {
      // Convert database format to UI format for the database service
      const uiGoal = {
        activityId: goal.activity_id,
        targetHours: goal.target_hours,
        period: goal.period,
        notificationThreshold: goal.notification_threshold,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
      };
      return db.addGoal(uiGoal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
    },
  });
};

// Update goal - accepts database model
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: DatabaseGoal) => {
      // Convert database format to UI format for the database service
      const uiGoal = {
        id: goal.id,
        activityId: goal.activity_id,
        targetHours: goal.target_hours,
        period: goal.period,
        notificationThreshold: goal.notification_threshold,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
      };
      return db.updateGoal(uiGoal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [GOAL_PROGRESS_QUERY_KEY, variables.id]
      });
    },
  });
};

// Delete goal
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => db.deleteGoal(goalId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [GOAL_PROGRESS_QUERY_KEY, variables]
      });
    },
  });
};
