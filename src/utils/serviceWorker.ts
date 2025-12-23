export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface ServiceWorkerCallbacks {
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onUpdateFound?: (registration: ServiceWorkerRegistration) => void;
  onUpdateReady?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private callbacks: ServiceWorkerCallbacks = {};
  private hasReloaded = false;
  private reloadTimeout: number | null = null;
  private readonly RELOAD_DEBOUNCE_MS = 200;
  private readonly SESSION_STORAGE_KEY = 'sw-reload-pending';

  public async register(callbacks: ServiceWorkerCallbacks = {}): Promise<ServiceWorkerStatus> {
    this.callbacks = callbacks;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Manager] Service Workers not supported');
      return {
        isSupported: false,
        isRegistered: false,
        isUpdateAvailable: false,
        registration: null,
      };
    }

    // Check if we're recovering from a reload
    const wasReloadPending = sessionStorage.getItem(this.SESSION_STORAGE_KEY) === 'true';
    if (wasReloadPending) {
      // Clear the flag - we've successfully reloaded
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
      this.hasReloaded = false; // Reset the flag for this session
      console.log('[SW Manager] Recovered from reload, resetting reload state');
    }

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Manager] Service Worker registered:', this.registration.scope);

      // Set up event listeners
      this.setupEventListeners();

      // Check for updates
      this.checkForUpdates();

      this.callbacks.onRegistered?.(this.registration);

      return {
        isSupported: true,
        isRegistered: true,
        isUpdateAvailable: this.updateAvailable,
        registration: this.registration,
      };
    } catch (error) {
      console.error('[SW Manager] Service Worker registration failed:', error);
      this.callbacks.onError?.(error as Error);

      return {
        isSupported: true,
        isRegistered: false,
        isUpdateAvailable: false,
        registration: null,
      };
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for new service worker installing
    this.registration.addEventListener('updatefound', () => {
      console.log('[SW Manager] New service worker found');
      this.callbacks.onUpdateFound?.(this.registration!);

      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('[SW Manager] New content available');
              this.updateAvailable = true;
              this.callbacks.onUpdateReady?.(this.registration!);
            } else {
              // Content cached for offline use
              console.log('[SW Manager] Content cached for offline use');
              this.callbacks.onOfflineReady?.();
            }
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });

    // Listen for controller changes (new SW takes control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.handleControllerChange();
    });
  }

  private handleControllerChange(): void {
    // Prevent multiple reloads in the same session
    if (this.hasReloaded) {
      console.log('[SW Manager] Already reloaded in this session, skipping');
      return;
    }

    // Check sessionStorage to prevent reload loops across page loads
    const reloadPending = sessionStorage.getItem(this.SESSION_STORAGE_KEY) === 'true';
    if (reloadPending) {
      console.log('[SW Manager] Reload already pending from previous page load, skipping');
      return;
    }

    // Check if there's a registration
    if (!this.registration) {
      console.log('[SW Manager] No registration, skipping reload');
      return;
    }

    // Check if we already have a controller (this means it's an update, not initial registration)
    // On initial registration, navigator.serviceWorker.controller is null
    const hasController = navigator.serviceWorker.controller !== null;

    // Only reload if:
    // 1. We have a controller (meaning this is an update, not initial registration)
    // 2. OR there's a waiting/installing worker (update scenario)
    const hasWaitingWorker = this.registration.waiting !== null;
    const hasInstallingWorker = this.registration.installing !== null;

    if (!hasController && !hasWaitingWorker && !hasInstallingWorker) {
      // This is likely initial registration - don't reload
      console.log('[SW Manager] Initial registration detected, no reload needed');
      return;
    }

    // Clear any existing timeout
    if (this.reloadTimeout !== null) {
      clearTimeout(this.reloadTimeout);
    }

    // Set flag and sessionStorage before reload to prevent loops
    this.hasReloaded = true;
    sessionStorage.setItem(this.SESSION_STORAGE_KEY, 'true');

    // Debounce reload to prevent rapid-fire reloads and ensure state is stable
    this.reloadTimeout = window.setTimeout(() => {
      console.log('[SW Manager] New service worker took control, reloading...');
      window.location.reload();
    }, this.RELOAD_DEBOUNCE_MS);
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('[SW Manager] Background sync completed:', data);
        // Dispatch custom event for app to listen to
        window.dispatchEvent(new CustomEvent('sw-sync-complete', { detail: data }));
        break;

      case 'CACHE_UPDATE':
        console.log('[SW Manager] Cache updated:', data);
        window.dispatchEvent(new CustomEvent('sw-cache-update', { detail: data }));
        break;

      default:
        console.log('[SW Manager] Unknown message from SW:', type, data);
    }
  }

  public async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[SW Manager] Checked for updates');
    } catch (error) {
      console.error('[SW Manager] Failed to check for updates:', error);
    }
  }

  public async activateUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      console.warn('[SW Manager] No waiting service worker found');
      return;
    }

    // Tell the waiting service worker to skip waiting and become active
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  public scheduleCacheMaintenance(): void {
    if (!this.registration) {
      console.warn('[SW Manager] No service worker registration found');
      return;
    }

    // Schedule cache maintenance for optimization
    // Type assertion for Background Sync API (not in all browsers)
    interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
      sync?: {
        register: (tag: string) => Promise<void>;
      };
    }
    const registrationWithSync = this.registration as ServiceWorkerRegistrationWithSync;

    if (registrationWithSync.sync) {
      registrationWithSync.sync.register('cache-maintenance').then(() => {
        console.log('[SW Manager] Cache maintenance scheduled');
      }).catch((error: Error) => {
        console.error('[SW Manager] Failed to schedule cache maintenance:', error);
      });
    }
  }

  public sendMessage(message: unknown): void {
    if (!this.registration || !this.registration.active) {
      console.warn('[SW Manager] No active service worker found');
      return;
    }

    this.registration.active.postMessage(message);
  }

  public cacheUrls(urls: string[]): void {
    this.sendMessage({
      type: 'CACHE_URLS',
      data: { urls }
    });
  }

  public getStatus(): ServiceWorkerStatus {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isUpdateAvailable: this.updateAvailable,
      registration: this.registration,
    };
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      // Clear reload flag and sessionStorage
      this.hasReloaded = false;
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY);

      if (this.reloadTimeout !== null) {
        clearTimeout(this.reloadTimeout);
        this.reloadTimeout = null;
      }

      const result = await this.registration.unregister();
      console.log('[SW Manager] Service Worker unregistered:', result);
      this.registration = null;
      this.updateAvailable = false;
      return result;
    } catch (error) {
      console.error('[SW Manager] Failed to unregister service worker:', error);
      return false;
    }
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Convenience functions
export const registerServiceWorker = (callbacks?: ServiceWorkerCallbacks) =>
  serviceWorkerManager.register(callbacks);

export const checkForSWUpdates = () =>
  serviceWorkerManager.checkForUpdates();

export const activateSWUpdate = () =>
  serviceWorkerManager.activateUpdate();

export const scheduleCacheMaintenance = () =>
  serviceWorkerManager.scheduleCacheMaintenance();

export const isOnline = () => navigator.onLine;

interface NetworkInformation {
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  mozConnection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  webkitConnection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

export const getNetworkStatus = () => {
  const nav = navigator as Navigator & NetworkInformation;
  return {
    online: navigator.onLine,
    connection: nav.connection || nav.mozConnection || nav.webkitConnection || undefined,
  };
};
