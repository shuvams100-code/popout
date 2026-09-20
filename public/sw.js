/* Popout service worker: shows push notifications and focuses the right page on tap. */
self.addEventListener("push", (event) => {
  let data = { title: "Popout", body: "", url: "/" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/192",
      badge: "/icons/badge",
      data: { url: data.url },
      tag: data.url,
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url === url && "focus" in c);
      if (open) return open.focus();
      const any = list.find((c) => "navigate" in c);
      if (any) return any.navigate(url).then((c) => c && c.focus());
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
