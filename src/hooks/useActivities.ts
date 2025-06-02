import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { DatabaseActivity } from '../database/models';

export const ACTIVITIES_QUERY_KEY = 'activities';

// Get all activities - returns database models
export const useActivities = () => {
  return useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY],
    queryFn: async () => {
      const uiActivities = await db.getActivities();
      // Convert UI models back to database format
      return uiActivities.map(activity => ({
        id: activity.id,
        name: activity.name,
        category: activity.category,
        description: activity.description,
        external_system: activity.externalSystem,
        order: activity.order,
        created_at: activity.createdAt,
        updated_at: activity.updatedAt,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Add activity - accepts database model
export const useAddActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Omit<DatabaseActivity, 'id'>) => {
      // Convert database format to UI format for the database service
      const uiActivity = {
        name: activity.name,
        category: activity.category,
        description: activity.description,
        externalSystem: activity.external_system,
        order: activity.order,
        createdAt: activity.created_at,
        updatedAt: activity.updated_at,
      };
      return db.addActivity(uiActivity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
};

// Update activity - accepts database model
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: DatabaseActivity) => {
      // Convert database format to UI format for the database service
      const uiActivity = {
        id: activity.id,
        name: activity.name,
        category: activity.category,
        description: activity.description,
        externalSystem: activity.external_system,
        order: activity.order,
        createdAt: activity.created_at,
        updatedAt: activity.updated_at,
      };
      return db.updateActivity(uiActivity);
    },
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
