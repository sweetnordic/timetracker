import { useEffect } from 'react';
import { useOpenTimeEntries, useUpdateTimeEntry } from './useTimeEntries';
import { useSettings } from './useSettings';

/**
 * Hook to automatically stop time tracking when the application is closed or hidden.
 * This ensures that any open time entries are properly closed with the correct duration.
 * Respects user settings for stopTrackingOnClose and stopTrackingOnTabSwitch.
 */
export const useAutoStopTracking = () => {
  const { data: openEntries = [] } = useOpenTimeEntries();
  const updateTimeEntry = useUpdateTimeEntry();
  const { settings } = useSettings();

  useEffect(() => {
    const stopAllTracking = async () => {
      if (openEntries.length === 0) return;

      // Close all open time entries
      for (const entry of openEntries) {
        if (entry.endTime === null) {
          const now = new Date();
          const startTime = new Date(entry.startTime);
          const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

          // Round up to nearest 15 minutes (900 seconds)
          const roundedDuration = Math.ceil(duration / 900) * 900;

          try {
            await updateTimeEntry.mutateAsync({
              id: entry.id!,
              activityId: entry.activityId,
              startTime: startTime,
              endTime: now,
              duration: roundedDuration,
              notes: entry.notes || '',
              createdAt: entry.createdAt,
              updatedAt: now,
            });
          } catch (error) {
            console.error('Error auto-stopping time entry:', error);
            // Continue with other entries even if one fails
          }
        }
      }
    };

    // Handle page unload (browser close, tab close, navigation)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only stop if setting is enabled
      if (settings.stopTrackingOnClose && openEntries.length > 0) {
        // For beforeunload, we can't use async operations reliably
        // So we'll use the visibilitychange handler instead
        event.preventDefault();
        event.returnValue = ''; // Modern browsers ignore the message but require returnValue
      }
    };

    // Handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      // Only stop if setting is enabled and page becomes hidden
      if (
        settings.stopTrackingOnTabSwitch &&
        document.visibilityState === 'hidden' &&
        openEntries.length > 0
      ) {
        // Close entries when page becomes hidden
        stopAllTracking().catch(console.error);
      }
    };

    // Handle pagehide (more reliable than beforeunload for mobile)
    const handlePageHide = () => {
      // Only stop if setting is enabled
      if (settings.stopTrackingOnClose && openEntries.length > 0) {
        // Use sendBeacon for reliable data sending
        stopAllTracking().catch(console.error);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [openEntries, updateTimeEntry, settings.stopTrackingOnClose, settings.stopTrackingOnTabSwitch]);
};

