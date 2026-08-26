// Temporary SW — unregister all service workers and clear all caches
// This fixes the blank screen caused by stale cached JS from old SW versions
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        // Unregister this SW so it doesn't interfere anymore
        return self.registration.unregister();
      })
  );
});

// Pass all requests through to network — no caching at all
self.addEventListener('fetch', (e) => {
  // Don't intercept any requests — let the browser handle everything normally
  return;
});

self.addEventListener('push', (event) => {
  let data = { title: 'UClass', body: 'You have a new update.', url: '/', tag: 'uclass' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag || 'uclass',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (typeof client.navigate === 'function') {
            return client.focus().then(() => client.navigate(targetUrl));
          }
          client.postMessage({ type: 'OPEN_URL', url: targetPath });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
