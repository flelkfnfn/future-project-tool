self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    try {
      const data = event.data ? event.data.json() : {};
      const title = data.title || '새 메시지';
      const body = data.body || '';
      const url = data.url || '/';
      const icon = data.icon || '/favicon.ico';

      // If any client window is visible (focused tab), skip showing a notification
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of clientList) {
        try {
          if (c.visibilityState === 'visible') {
            return; // Do not show notification when app is in focus
          }
        } catch {}
      }

      await self.registration.showNotification(title, {
        body,
        icon,
        data: { url },
        badge: data.badge,
      });
    } catch (e) {
      // noop
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          const t = new URL(targetUrl, url.origin);
          if (url.origin === t.origin) {
            await client.focus();
            if (typeof client.navigate === 'function') {
              try { await client.navigate(t.href); } catch {}
            }
            return;
          }
        } catch {}
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});
