/* jshint esversion: 6, browser: true, devel: true */
/* globals self */

const worker = '👷';
console.log(worker, 'loaded');

self.addEventListener('install', (event) => {
  console.log(worker, 'install', event);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(worker, 'activate', event);
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  console.log(worker, 'fetch', event);
  event.respondWith(fetch(event.request));
});

self.addEventListener('sync', function(event) {
  console.log(worker, 'sync', event);
});
