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
      console.log('[SW Manager] New service worker took control');
      window.location.reload();
    });
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
    if ('sync' in this.registration) {
      (this.registration as any).sync.register('cache-maintenance').then(() => {
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

export const getNetworkStatus = () => ({
  online: navigator.onLine,
  connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
});
