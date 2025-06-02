import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import { CATEGORIES_QUERY_KEY } from './useCategories';
import { ACTIVITIES_QUERY_KEY } from './useActivities';
import { TIME_ENTRIES_QUERY_KEY, OPEN_TIME_ENTRIES_QUERY_KEY } from './useTimeEntries';
import { GOALS_QUERY_KEY } from './useGoals';

// Clear all data
export const useClearAllData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => db.clearAllData(),
    onSuccess: () => {
      // Invalidate all queries after clearing data
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
    },
  });
};

// Initialize database
export const useInitializeDatabase = () => {
  return useMutation({
    mutationFn: () => db.init(),
  });
};
