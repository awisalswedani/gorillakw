// Simple service worker for offline support
const CACHE_NAME = 'seller-app-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/awis.png',
  '/bag-dark.png',
  '/bag-light.png',
  '/payment-logos.png',
  '/whatsapp-icon.png',
  '/Instagram_icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Filter out any invalid URLs
        const validAssets = STATIC_ASSETS.filter(url => {
          try {
            new URL(url, self.location.origin);
            return true;
          } catch {
            return false;
          }
        });
        return cache.addAll(validAssets);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP(S) requests (chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip caching for API requests - let our application cache handle those
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((fetchResponse) => {
            // Only cache successful responses from same origin
            if (fetchResponse.status === 200 && fetchResponse.url.startsWith(self.location.origin)) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                })
                .catch((error) => {
                  console.log('Cache put failed:', error);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
}); 