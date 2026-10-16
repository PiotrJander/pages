/* Offline cache for the GitHub Pages build. Same-origin files are cached on install;
   Google Fonts are cached on first use; OpenStreetMap tiles are never cached. */
const CACHE = 'wenecja-v4';
const FILES = ["./", "index.html", "vendor/leaflet.js", "vendor/leaflet.css", "assets/app.css", "assets/app.js", "assets/basemap.js", "data/basemap.js", "data/places.js", "data/routes.js", "assets/icon.svg", "assets/icon-192.png", "manifest.webmanifest"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => /\.(js|css)$/.test(f) ? f + '?v=4' : f))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('tile.openstreetmap.org')) return;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./'))));
});
