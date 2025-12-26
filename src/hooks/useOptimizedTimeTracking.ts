import { useState, useCallback, useRef } from 'react';
import {
  useAddTimeEntry,
  useUpdateTimeEntry,
  useOpenTimeEntries,
} from './useTimeEntries';
import { useSettings } from './useSettings';
import { useNotifications } from './useNotifications';
import { useToast } from '../contexts';
import type { Activity, TimeEntry } from '../models';

interface UseTimeTrackingReturn {
  isTracking: boolean;
  currentActivity: Activity | null;
  elapsedTime: number;
  startTracking: (activity: Activity) => Promise<void>;
  stopTracking: () => Promise<void>;
  extendTracking: () => void;
  formatTime: (seconds: number) => string;
  formatDuration: (seconds: number) => string;
}

export const useOptimizedTimeTracking = (): UseTimeTrackingReturn => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const intervalRef = useRef<number | null>(null);

  // Hooks
  const { settings: trackingSettings } = useSettings();
  const { data: dbOpenEntries = [] } = useOpenTimeEntries();
  const addTimeEntry = useAddTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const { showSuccess, showError, showInfo } = useToast();
  const { addInfoNotification, addErrorNotification } = useNotifications();

  // Memoized utility functions
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  // Stop tracking function
  const stopTracking = useCallback(async () => {
    if (!isTracking || !currentActivity || !startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const roundedDuration = Math.ceil(duration / 900) * 900; // Round up to nearest 15 minutes

    try {
      const openEntry = dbOpenEntries.find(
        (entry: TimeEntry) =>
          entry.activityId === currentActivity.id && entry.endTime === null,
      );

      if (openEntry) {
        await updateTimeEntry.mutateAsync({
          id: openEntry.id,
          activityId: currentActivity.id!,
          startTime: startTime,
          endTime: now,
          duration: roundedDuration,
          notes: '',
          createdAt: startTime,
          updatedAt: now,
        });
      }

      // Reset tracking state
      setIsTracking(false);
      setCurrentActivity(null);
      setStartTime(null);
      setElapsedTime(0);

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const title = 'Time Tracking Completed';
      const message = `Stopped tracking: ${currentActivity.name} (${formatDuration(roundedDuration)})`;

      if (trackingSettings.notificationsEnabled) {
        addInfoNotification(title, message, currentActivity.id);
      }
      showSuccess(message, 4000);
    } catch (error) {
      console.error('Error stopping time tracking:', error);

      const title = 'Time Tracking Error';
      const message = 'Failed to stop time tracking';

      if (trackingSettings.notificationsEnabled) {
        addErrorNotification(title, message, currentActivity?.id);
      }
      showError(message);
    }
  }, [
    isTracking,
    currentActivity,
    startTime,
    dbOpenEntries,
    updateTimeEntry,
    trackingSettings,
    addInfoNotification,
    addErrorNotification,
    showSuccess,
    showError,
    formatDuration,
  ]);

  // Start tracking function
  const startTracking = useCallback(
    async (activity: Activity) => {
      if (isTracking) return;

      setCurrentActivity(activity);
      setIsTracking(true);
      const now = new Date();
      setStartTime(now);

      try {
        await addTimeEntry.mutateAsync({
          activityId: activity.id!,
          startTime: now,
          endTime: null,
          duration: null,
          notes: '',
          createdAt: now,
          updatedAt: now,
        });

        const title = 'Time Tracking Started';
        const message = `Started tracking: ${activity.name}`;

        if (trackingSettings.notificationsEnabled) {
          addInfoNotification(title, message, activity.id);
        }
        showInfo(message, 3000);
      } catch (error) {
        console.error('Error starting time tracking:', error);

        const title = 'Time Tracking Error';
        const message = 'Failed to start time tracking';

        if (trackingSettings.notificationsEnabled) {
          addErrorNotification(title, message, activity.id);
        }
        showError(message);

        // Reset state on error
        setIsTracking(false);
        setCurrentActivity(null);
        setStartTime(null);
      }
    },
    [
      isTracking,
      addTimeEntry,
      trackingSettings,
      addInfoNotification,
      addErrorNotification,
      showInfo,
      showError,
    ],
  );

  // Extend tracking function
  const extendTracking = useCallback(() => {
    showInfo('Time tracking extended', 3000);
  }, [showInfo]);

  return {
    isTracking,
    currentActivity,
    elapsedTime,
    startTracking,
    stopTracking,
    extendTracking,
    formatTime,
    formatDuration,
  };
};
