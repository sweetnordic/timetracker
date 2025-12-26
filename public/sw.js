const CACHE_NAME = 'timetracker-v2.0.0';
const STATIC_CACHE_NAME = 'timetracker-static-v2.0.0';
const DYNAMIC_CACHE_NAME = 'timetracker-dynamic-v1';

// Determine base path from service worker location
// e.g., if SW is at /timetracker/sw.js, base path is /timetracker/
// if SW is at /sw.js, base path is /
function getBasePath() {
  const swPath = self.location.pathname;
  // Remove /sw.js from the path to get base path
  const basePath = swPath.replace(/\/sw\.js$/, '');
  // Normalize to ensure it ends with / (or is just /)
  return basePath === ''
    ? '/'
    : basePath.endsWith('/')
      ? basePath
      : basePath + '/';
}

const BASE_PATH = getBasePath();

// Helper function to resolve paths with base path
function resolvePath(path) {
  // If path is already absolute and starts with base path, return as is
  if (path.startsWith(BASE_PATH)) {
    return path;
  }
  // If path starts with /, remove it and prepend base path
  if (path.startsWith('/')) {
    return BASE_PATH + path.substring(1);
  }
  // Relative path, prepend base path
  return BASE_PATH + path;
}

// Assets to cache immediately
const STATIC_ASSETS = [
  resolvePath('/'),
  resolvePath('/index.html'),
  resolvePath('/favicon.ico'),
  resolvePath('/favicon.svg'),
  resolvePath('/web-app-manifest-192x192.png'),
  resolvePath('/web-app-manifest-512x512.png'),
  // Core app files will be added dynamically
];

// Routes that should work offline
const OFFLINE_PAGES = [
  resolvePath('/'),
  resolvePath('/#/tracker'),
  resolvePath('/#/manager'),
  resolvePath('/#/analytics'),
  resolvePath('/#/help'),
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          // Log individual cache failures but continue
          console.warn('[SW] Some static assets failed to cache:', error);
          // Return empty array to continue the chain
          return [];
        });
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        // Skip waiting to activate immediately
        // The client-side code will handle reload logic to prevent loops
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
        // Even if caching fails, skip waiting so the SW can activate
        // This prevents the SW from being stuck in installing state
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        // Claim clients, but don't force it if it fails
        return self.clients.claim().catch((error) => {
          console.warn('[SW] Failed to claim clients:', error);
          // Continue activation even if claim fails
          return Promise.resolve();
        });
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
        // Don't throw - allow activation to complete even if cache cleanup fails
        return Promise.resolve();
      }),
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isAppRoute(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new resource:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return getOfflineFallback(request);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Updated cache:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving stale content:', request.url);
      return cachedResponse;
    }

    return getOfflineFallback(request);
  }
}

async function getOfflineFallback(request) {
  if (isAppRoute(request)) {
    // Return the main app for SPA routes
    const cache = await caches.open(STATIC_CACHE_NAME);
    const fallback = await cache.match(resolvePath('/index.html'));
    if (fallback) {
      return fallback;
    }
  }

  // Return a basic offline page
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Offline - Time Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
            color: #333;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { margin: 0.5rem 0; }
          p { margin: 0.5rem 0; color: #666; }
          button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
            font-size: 1rem;
          }
          button:hover { background: #0b3565; }
        </style>
      </head>
      <body>
        <div class="icon">⏱️</div>
        <h1>You're Offline</h1>
        <p>Time Tracker is not available right now</p>
        <p>Your data is safely stored locally</p>
        <button onclick="window.location.reload()">Try Again</button>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    },
  );
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/);
}

function isAppRoute(request) {
  const url = new URL(request.url);
  const rootPath = resolvePath('/');
  const indexPath = resolvePath('/index.html');
  // Normalize base path without trailing slash for comparison
  const basePathNoSlash = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');

  // Check if pathname is within base path
  const isBasePath =
    url.pathname === rootPath ||
    url.pathname === indexPath ||
    url.pathname === basePathNoSlash ||
    url.pathname === basePathNoSlash + '/' ||
    url.pathname === basePathNoSlash + '/index.html';

  if (!isBasePath) {
    return false;
  }

  // If it's the base path, check if it matches any offline page
  return OFFLINE_PAGES.some((page) => {
    // For root page
    if (page === rootPath) {
      return true;
    }
    // For hash routes, extract the hash part and check
    // page format is like "/timetracker/#/tracker" or "/#/tracker"
    const hashIndex = page.indexOf('#');
    if (hashIndex !== -1) {
      const pageHash = page.substring(hashIndex);
      return url.hash.startsWith(pageHash);
    }
    return false;
  });
}

// Cache maintenance and optimization
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'cache-maintenance') {
    event.waitUntil(performCacheMaintenance());
  }
});

async function performCacheMaintenance() {
  try {
    console.log('[SW] Performing cache maintenance...');

    // Clean up old cache entries
    const caches = await self.caches.keys();
    const oldCaches = caches.filter(
      (cache) =>
        !cache.includes(STATIC_CACHE_NAME) &&
        !cache.includes(DYNAMIC_CACHE_NAME),
    );

    for (const oldCache of oldCaches) {
      await self.caches.delete(oldCache);
      console.log('[SW] Deleted old cache:', oldCache);
    }

    // Notify the main app about cache cleanup
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'CACHE_CLEANED',
        data: { cleanedCaches: oldCaches.length },
      });
    });
  } catch (error) {
    console.error('[SW] Cache maintenance failed:', error);
  }
}

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (data && data.urls) {
        cacheUrls(data.urls);
      }
      break;

    case 'SCHEDULE_SYNC':
      if (
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration.prototype
      ) {
        self.registration.sync.register('time-tracking-sync');
      }
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    await cache.addAll(urls);
    console.log('[SW] Cached additional URLs:', urls);
  } catch (error) {
    console.error('[SW] Failed to cache URLs:', error);
  }
}

console.log('[SW] Service Worker script loaded');
