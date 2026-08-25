const CACHE_NAME = "nyumba-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/listing-placeholder.svg",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // For listing API routes: network-first, fallback to cache (offline support)
  if (url.pathname.startsWith("/api/listings/") && !url.pathname.includes("/lead") && !url.pathname.includes("/viewing")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful listing responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Skip other API routes — always go to network
  if (url.pathname.startsWith("/api/")) return;

  // Skip auth routes
  if (url.pathname.startsWith("/auth/")) return;

  // For navigation requests: network first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline")))
    );
    return;
  }

  // For static assets: cache first, fallback to network
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ============ PUSH NOTIFICATIONS ============

// Handle incoming push events
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // If it's plain text, wrap it
    payload = {
      title: "Nyumba Nearby",
      body: event.data.text(),
    };
  }

  const { title, body, icon, badge, url, tag, data } = payload;

  const notificationOptions = {
    body: body || "",
    icon: icon || "/icons/icon-192.png",
    badge: badge || "/icons/icon-192.png",
    tag: tag || "nyumba-notification",
    data: { url: url || "/", ...(data || {}) },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [],
  };

  // Add contextual actions based on notification type
  if (data?.type === "NEW_MESSAGE" || data?.type === "CHAT") {
    notificationOptions.actions = [
      { action: "open_chat", title: "💬 Reply" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (data?.type === "VIEWING") {
    notificationOptions.actions = [
      { action: "open_viewing", title: "📅 View Details" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (data?.type === "NEW_LISTING") {
    notificationOptions.actions = [
      { action: "open_listing", title: "🏠 View Listing" },
      { action: "dismiss", title: "Dismiss" },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(title || "Nyumba Nearby", notificationOptions)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { action } = event;
  const data = event.notification.data || {};

  // Dismiss action — just close
  if (action === "dismiss") return;

  // Determine URL to open
  let targetUrl = "/";
  if (action === "open_chat" && data.url) {
    targetUrl = data.url;
  } else if (action === "open_viewing" && data.url) {
    targetUrl = data.url;
  } else if (action === "open_listing" && data.url) {
    targetUrl = data.url;
  } else if (data.url) {
    targetUrl = data.url;
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener("notificationclose", (event) => {
  // Could send analytics about dismissed notifications
  const data = event.notification.data || {};
  if (data.type) {
    // Track dismissals
    console.log("Notification dismissed:", data.type);
  }
});

// Handle push subscription change (re-subscribe)
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    // Re-subscribe with the same VAPID key
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Notify the server about the new subscription
      return fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: subscription.toJSON().keys?.p256dh,
          auth: subscription.toJSON().keys?.auth,
        }),
      });
    })
  );
});
