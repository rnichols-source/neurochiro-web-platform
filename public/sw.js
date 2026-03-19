const CACHE_NAME = 'neurochiro-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through for now, can be updated for offline support
});

// Listener for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'NeuroChiro Alert';
  const options = {
    body: data.body || 'You have a new update from the platform.',
    icon: '/window.svg',
    badge: '/window.svg',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
