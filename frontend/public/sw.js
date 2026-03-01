/**
 * CivicLens AI — Service Worker for Push Notifications
 * Handles incoming push events and displays browser notifications.
 */

/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  let data = { title: 'CivicLens AI', body: 'New notification', url: '/app/alerts' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Push data parse error:', e);
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/civiclens-icon.png',
    badge: data.badge || '/civiclens-badge.png',
    tag: data.scheme_id ? `scheme-${data.scheme_id}` : 'civiclens-notif',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/app/alerts',
      scheme_id: data.scheme_id,
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CivicLens AI', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/app/alerts';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
