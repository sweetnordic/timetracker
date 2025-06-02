import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { Goal } from '../models';

export const GOALS_QUERY_KEY = 'goals';

// Get all goals - returns UI models directly
export const useGoals = () => {
  return useQuery({
    queryKey: [GOALS_QUERY_KEY],
    queryFn: () => db.getGoals(),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get goals by activity - returns UI models directly
export const useGoalsByActivity = (activityId: string) => {
  return useQuery({
    queryKey: [GOALS_QUERY_KEY, 'by-activity', activityId],
    queryFn: () => db.getGoalsByActivity(activityId),
    staleTime: 60 * 1000,
    enabled: !!activityId,
  });
};

// Get goal progress
export const useGoalProgress = (goalId: string) => {
  return useQuery({
    queryKey: [GOALS_QUERY_KEY, 'progress', goalId],
    queryFn: () => db.getGoalProgress(goalId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!goalId,
  });
};

// Add goal - accepts UI model directly
export const useAddGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: Omit<Goal, 'id'>) => db.addGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
    },
  });
};

// Update goal - accepts UI model directly
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: Goal) => db.updateGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
    },
  });
};

// Delete goal
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => db.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
    },
  });
};
