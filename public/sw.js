// KalExamHai Service Worker for Background PWA & Lock-Screen Push Notifications
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

// Handle Background Push Notification (Fires even when browser / app is completely closed)
self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "KalExamHai Exam Alert",
        body: event.data.text(),
      };
    }
  }

  const title = data.title || "KalExamHai — Exam Alert";
  const options = {
    body: data.body || "New high-yield question paper alert for Mumbai University!",
    icon: "/keh-logo.svg",
    badge: "/keh-logo.svg",
    vibrate: [200, 100, 200],
    tag: data.tag || "keh-exam-alert",
    renotify: true,
    data: {
      url: data.url || "/student",
    },
    actions: [
      {
        action: "open",
        title: "Open App 🚀",
      },
      {
        action: "close",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle User Clicking Notification on Lockscreen / Status Bar
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/student";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
