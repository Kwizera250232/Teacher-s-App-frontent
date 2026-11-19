// UClass offline service worker
// - App shell + static assets cached so the app opens without internet
// - API calls are NEVER cached (auth/data must be fresh)
// - Quiz answers queue in the page (localStorage) and sync on reconnect
const CACHE = 'ucl-shell-v1';
const INDEX_KEY = '/index.html';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept API or cross-origin requests (studentapi, R2, etc.)
  if (url.pathname.startsWith('/api')) return;
  if (url.hostname !== self.location.host) return;

  // SPA navigations: network-first, cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(INDEX_KEY, copy));
          }
          return res;
        })
        .catch(() => caches.match(INDEX_KEY).then((m) => m || Response.error()))
    );
    return;
  }

  // Static assets (hashed bundles, icons, images): cache-first
  if (
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpe?g|svg|ico|woff2?|webp|gif|json)$/i.test(url.pathname)
  ) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
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
      requireInteraction: !!data.call,
      renotify: !!data.call,
      vibrate: data.call ? [400, 200, 400, 200, 400, 400, 400, 200, 400] : undefined,
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
