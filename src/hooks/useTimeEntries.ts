import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../database/db';
import type { DatabaseTimeEntry } from '../database/models';
import type { TimeEntry } from '../models';

export const TIME_ENTRIES_QUERY_KEY = 'timeEntries';
export const OPEN_TIME_ENTRIES_QUERY_KEY = 'openTimeEntries';

// Convert UI time entry to database format
const convertUIToDatabase = (entry: TimeEntry): DatabaseTimeEntry => ({
  id: entry.id,
  activity_id: entry.activityId,
  start_time: entry.startTime,
  end_time: entry.endTime,
  duration: entry.duration,
  notes: entry.notes,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
});

// Get all time entries - returns database models
export const useTimeEntries = () => {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY],
    queryFn: async () => {
      const uiEntries = await db.getTimeEntries();
      return uiEntries.map(convertUIToDatabase);
    },
    staleTime: 30 * 1000, // 30 seconds - shorter for time tracking
  });
};

// Get time entries by activity - returns database models
export const useTimeEntriesByActivity = (activityId: string) => {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, 'by-activity', activityId],
    queryFn: async () => {
      const uiEntries = await db.getTimeEntriesByActivity(activityId);
      return uiEntries.map(convertUIToDatabase);
    },
    staleTime: 30 * 1000,
    enabled: !!activityId,
  });
};

// Get open time entries - returns database models
export const useOpenTimeEntries = () => {
  return useQuery({
    queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY],
    queryFn: async () => {
      const uiEntries = await db.getOpenTimeEntries();
      return uiEntries.map(convertUIToDatabase);
    },
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

// Add time entry - accepts database model
export const useAddTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<DatabaseTimeEntry, 'id'>) => {
      // Convert database format to UI format for the database service
      const uiEntry = {
        activityId: entry.activity_id,
        startTime: entry.start_time,
        endTime: entry.end_time,
        duration: entry.duration,
        notes: entry.notes,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };
      return db.addTimeEntry(uiEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY] });
    },
  });
};

// Update time entry - accepts database model
export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: DatabaseTimeEntry) => {
      // Convert database format to UI format for the database service
      const uiEntry = {
        id: entry.id,
        activityId: entry.activity_id,
        startTime: entry.start_time,
        endTime: entry.end_time,
        duration: entry.duration,
        notes: entry.notes,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };
      return db.updateTimeEntry(uiEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [OPEN_TIME_ENTRIES_QUERY_KEY] });
    },
  });
};
