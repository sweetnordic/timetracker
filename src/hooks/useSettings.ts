import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { DatabaseSettings } from '../database/models';

export const SETTINGS_QUERY_KEY = 'settings';

// Get tracking settings - returns database model
export const useTrackingSettings = () => {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: async () => {
      // Use the existing public method but return raw database format
      const uiSettings = await db.getTrackingSettings();
      // Convert UI settings back to database format
      return {
        max_duration: uiSettings.maxDuration,
        warning_threshold: uiSettings.warningThreshold,
        first_day_of_week: uiSettings.firstDayOfWeek,
        default_goal_notification_threshold: uiSettings.defaultGoalNotificationThreshold,
        notifications_enabled: uiSettings.notificationsEnabled
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
  });
};

// Update tracking settings - accepts database model
export const useUpdateTrackingSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Omit<DatabaseSettings, 'id' | 'created_at' | 'updated_at'>) => {
      // Convert database format to UI format for the database service
      const uiSettings = {
        maxDuration: settings.max_duration,
        warningThreshold: settings.warning_threshold,
        firstDayOfWeek: settings.first_day_of_week,
        defaultGoalNotificationThreshold: settings.default_goal_notification_threshold,
        notificationsEnabled: settings.notifications_enabled
      };
      await db.updateTrackingSettings(uiSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
    },
  });
};
