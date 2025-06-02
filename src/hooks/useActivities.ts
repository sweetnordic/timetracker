import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { Activity } from '../models';

export const ACTIVITIES_QUERY_KEY = 'activities';

// Get all activities - returns UI models directly
export const useActivities = () => {
  return useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY],
    queryFn: () => db.getActivities(),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Add activity - accepts UI model directly
export const useAddActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activity: Omit<Activity, 'id'>) => db.addActivity(activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
};

// Update activity - accepts UI model directly
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activity: Activity) => db.updateActivity(activity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
};

// Update activity order
export const useUpdateActivityOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, newOrder }: { activityId: string; newOrder: number }) =>
      db.updateActivityOrder(activityId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
};
