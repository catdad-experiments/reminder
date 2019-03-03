/* jshint esversion: 6, browser: true, devel: true */
/* globals self */

console.log('👷', 'loaded');

self.addEventListener('install', (event) => {
  console.log('👷', 'install', event);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('👷', 'activate', event);
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  console.log('👷', 'fetch', event);
  event.respondWith(fetch(event.request));
});
