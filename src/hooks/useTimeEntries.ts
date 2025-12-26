import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { TimeEntry } from '../models';

export const TIME_ENTRIES_QUERY_KEY = 'timeEntries';
export const OPEN_TIME_ENTRIES_QUERY_KEY = 'openTimeEntries';

// Get all time entries - returns UI models directly
export const useTimeEntries = () => {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY],
    queryFn: () => db.getTimeEntries(),
    staleTime: 30 * 1000, // 30 seconds - shorter for time tracking
  });
};

// Get time entries by activity - returns UI models directly
export const useTimeEntriesByActivity = (activityId: string) => {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, 'by-activity', activityId],
    queryFn: () => db.getTimeEntriesByActivity(activityId),
    staleTime: 30 * 1000,
    enabled: !!activityId,
  });
};

// Get open time entries - returns UI models directly
export const useOpenTimeEntries = () => {
  return useQuery({
    queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY],
    queryFn: () => db.getOpenTimeEntries(),
    staleTime: 5 * 1000, // 5 seconds - very fresh for active tracking
    refetchInterval: 5 * 1000, // Auto-refresh every 5 seconds
  });
};

// Get total duration by activity
export const useTotalDurationByActivity = (activityId: string) => {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, 'total-duration', activityId],
    queryFn: () => db.getTotalDurationByActivity(activityId),
    staleTime: 30 * 1000,
    enabled: !!activityId,
  });
};

// Add time entry - accepts UI model directly
export const useAddTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: Omit<TimeEntry, 'id'>) => db.addTimeEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY],
      });
    },
  });
};

// Update time entry - accepts UI model directly
export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: TimeEntry) => db.updateTimeEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY],
      });
    },
  });
};

// Delete time entry
export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => db.deleteTimeEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY],
      });
    },
  });
};
