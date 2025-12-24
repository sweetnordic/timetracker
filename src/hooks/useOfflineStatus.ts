import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts';
import {
  registerServiceWorker,
  activateSWUpdate,
  scheduleCacheMaintenance,
  isOnline,
  getNetworkStatus,
  type ServiceWorkerStatus,
} from '../utils/serviceWorker';

interface OfflineStatusReturn {
  isOnline: boolean;
  serviceWorker: ServiceWorkerStatus;
  hasUpdateAvailable: boolean;
  installUpdate: () => Promise<void>;
  optimizeCache: () => void;
  networkInfo: {
    online: boolean;
    connection?: unknown;
  };
}

export const useOfflineStatus = (): OfflineStatusReturn => {
  const [isOnlineState, setIsOnlineState] = useState(isOnline());
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);

  const { showSuccess, showInfo, showWarning, showError } = useToast();

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker({
      onRegistered: (registration) => {
        console.log('[Offline Hook] Service Worker registered');
        setSwStatus((prev) => ({ ...prev, isRegistered: true, registration }));
        showSuccess('App is ready for offline use', 3000);
      },

      onUpdateFound: () => {
        console.log('[Offline Hook] App update found');
        showInfo('Downloading app update...', 3000);
      },

      onUpdateReady: () => {
        console.log('[Offline Hook] App update ready');
        setHasUpdateAvailable(true);
        showInfo('App update ready! Click to install.', 5000);
      },

      onOfflineReady: () => {
        console.log('[Offline Hook] App cached for offline use');
        showSuccess('App cached for offline use', 3000);
      },

      onError: (error) => {
        console.error('[Offline Hook] Service Worker error:', error);
        showError('Failed to enable offline features');
      },
    }).then((status) => {
      setSwStatus(status);
    });
  }, [showSuccess, showInfo, showWarning, showError]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline Hook] Back online');
      setIsOnlineState(true);
      showSuccess('Connection restored', 2000);
    };

    const handleOffline = () => {
      console.log('[Offline Hook] Gone offline');
      setIsOnlineState(false);
      showWarning('Working offline - all data stays local', 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showSuccess, showWarning]);

  // Listen for service worker cache events
  useEffect(() => {
    const handleCacheUpdate = () => {
      showInfo('App cache updated', 2000);
    };

    const handleCacheCleaned = (event: CustomEvent) => {
      const { cleanedCaches } = event.detail;
      if (cleanedCaches > 0) {
        showSuccess(`Cleaned ${cleanedCaches} old cache entries`, 3000);
      }
    };

    window.addEventListener('sw-cache-update', handleCacheUpdate);
    window.addEventListener(
      'sw-cache-cleaned',
      handleCacheCleaned as EventListener,
    );

    return () => {
      window.removeEventListener('sw-cache-update', handleCacheUpdate);
      window.removeEventListener(
        'sw-cache-cleaned',
        handleCacheCleaned as EventListener,
      );
    };
  }, [showSuccess, showInfo]);

  // Install service worker update
  const installUpdate = useCallback(async () => {
    try {
      await activateSWUpdate();
      setHasUpdateAvailable(false);
      showInfo('Installing update...', 2000);
    } catch (error) {
      console.error('[Offline Hook] Failed to install update:', error);
      showError('Failed to install update');
    }
  }, [showInfo, showError]);

  // Optimize cache
  const optimizeCache = useCallback(() => {
    scheduleCacheMaintenance();
    showInfo('Cache optimization scheduled', 2000);
  }, [showInfo]);

  return {
    isOnline: isOnlineState,
    serviceWorker: swStatus,
    hasUpdateAvailable,
    installUpdate,
    optimizeCache,
    networkInfo: getNetworkStatus(),
  };
};
