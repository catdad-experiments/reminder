/* globals self, clients */

const VERSION = 'v1.0.0';
const WORKER = '👷';
// const KEY = 'reminder-v1';

// eslint-disable-next-line no-console
const log = (...args) => console.log(WORKER, VERSION, ...args);

const serveShareTarget = event => {
  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect(event.request.url));

  event.waitUntil(async function () {
    const data = await event.request.formData();
    const client = await self.clients.get(event.resultingClientId);
    const [title, text, url, file] = ['title', 'text', 'url', 'file'].map(n => data.get(n));
    client.postMessage({ title, text, url, file, action: 'receive-share' });
  }());
};

self.addEventListener('install', (event) => {
  log('install', event);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  log('activate', event);
  return self.clients.claim();
});

self.addEventListener('sync', function(event) {
  log('sync', event);
});

self.addEventListener('fetch', (event) => {
  log('fetch', event.request.method, event.request.url);
  const url = new URL(event.request.url);

  const isSameOrigin = url.origin === location.origin;
  const isShareTarget = isSameOrigin && url.searchParams.has('share-target');
  const isSharePost = isShareTarget && event.request.method === 'POST';

  if (isSharePost) {
    log('handling share target request');
    return void serveShareTarget(event);
  }

  event.respondWith(fetch(event.request));
});

self.addEventListener('notificationclick', (event) => {
  const { tag } = event.notification;

  event.notification.close();

  event.waitUntil(async function() {
    const allClients = await clients.matchAll({
      includeUncontrolled: true
    });

    let owner = allClients[0] || await clients.openWindow('./');

    if (allClients[0]) {
      owner.focus();
    }

    owner.postMessage({ action: 'notification-click', id: Number(tag) });
  }());
});
