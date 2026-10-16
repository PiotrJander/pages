"""Assemble the static site: index.html (GitHub Pages) and artifact.html (claude.ai Artifact page)."""
import os, sys, shutil, hashlib
from PIL import Image, ImageDraw

SITE = sys.argv[1]
VERSION = sys.argv[2] if len(sys.argv) > 2 else '1'

TITLE = 'Wenecja w długim trwaniu'
DESC = 'Literacko-historyczny przewodnik po Wenecji: mapa z katastru 1808, eseje w duchu Braudela i podróżników, trasy na pół dnia.'
FONTS = 'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@400;500;600&family=Cardo:ital,wght@0,400;0,700;1,400&display=swap'

ICON_LOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7"/></svg>'
ICON_FIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
ICON_MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/></svg>'

BODY = f'''<div class="app">
  <div id="map" role="application" aria-label="Mapa Wenecji i laguny"></div>
  <div class="mapctl">
    <button class="mapbtn" id="btn-loc" aria-pressed="false" aria-label="Pokaż moją lokalizację">{ICON_LOC}</button>
    <button class="mapbtn txt" id="btn-osm" aria-pressed="false" aria-label="Włącz dzisiejszą mapę OpenStreetMap">OSM</button>
    <button class="mapbtn" id="btn-fit" aria-label="Pokaż całe miasto albo całą trasę">{ICON_FIT}</button>
    <button class="mapbtn" id="btn-zin" aria-label="Przybliż">{ICON_PLUS}</button>
    <button class="mapbtn" id="btn-zout" aria-label="Oddal">{ICON_MINUS}</button>
  </div>
  <div id="toast" class="toast" role="status" hidden></div>
  <section class="panel" id="panel" aria-label="Przewodnik">
    <button class="grip" id="grip" aria-label="Rozwiń albo zwiń panel"><span></span></button>
    <header class="head" id="head">
      <div class="brand">
        <h1><i>Wenecja</i> w długim trwaniu</h1>
        <span class="sub">przewodnik literacko-historyczny</span>
      </div>
      <nav class="tabs" role="tablist" aria-label="Widoki">
        <button class="tab" role="tab" data-tab="miejsca">Miejsca</button>
        <button class="tab" role="tab" data-tab="trasy">Trasy</button>
        <button class="tab" role="tab" data-tab="o">O przewodniku</button>
      </nav>
      <div class="days" id="days" role="group" aria-label="Dzień zwiedzania"></div>
    </header>
    <div class="body" id="body"></div>
  </section>
</div>'''

def scripts(q):
    return '\n'.join(f'<script src="{p}{q}"></script>' for p in [
        'vendor/leaflet.js', 'data/basemap.js', 'data/places.js', 'data/routes.js', 'assets/basemap.js', 'assets/app.js'])


def styles(q):
    return f'''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="vendor/leaflet.css{q}">
<link rel="stylesheet" href="assets/app.css{q}">'''


QV = f'?v={VERSION}'

full = f'''<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#eef1ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121817" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
{styles(QV)}
</head>
<body>
{BODY}
{scripts(QV)}
</body>
</html>
'''

artifact = f'''<title>{TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
{styles('')}
{BODY}
{scripts('')}
'''

open(os.path.join(SITE, 'index.html'), 'w').write(full)
if os.environ.get('WENECJA_ARTIFACT'):  # content-only page for a claude.ai Artifact
    open(os.path.join(SITE, 'artifact.html'), 'w').write(artifact)

# vendor
os.makedirs(os.path.join(SITE, 'vendor'), exist_ok=True)
# Leaflet 1.9.4 dist folder (npm pack leaflet@1.9.4, or node_modules/leaflet/dist)
NPM = os.environ.get('LEAFLET_DIST', 'node_modules/leaflet/dist') + '/'
if os.path.exists(NPM + 'leaflet.js'):  # otherwise keep the vendored copy already in the site
    shutil.copy(NPM + 'leaflet.js', os.path.join(SITE, 'vendor/leaflet.js'))
    shutil.copy(NPM + 'leaflet.css', os.path.join(SITE, 'vendor/leaflet.css'))

# icons: a lagoon tile with the city's fish-shaped outline suggested by three strokes and a gold diamond
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2b3e9e"/><path d="M12 38c6-4 12-4 18 0s12 4 18 0" fill="none" stroke="#eef1ec" stroke-width="3" stroke-linecap="round"/><path d="M12 47c6-4 12-4 18 0s12 4 18 0" fill="none" stroke="#eef1ec" stroke-width="3" stroke-linecap="round" opacity=".6"/><rect x="26" y="12" width="12" height="12" rx="1.5" transform="rotate(45 32 18)" fill="#d8b35e"/></svg>'''
open(os.path.join(SITE, 'assets/icon.svg'), 'w').write(svg)
for size in (192, 512):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = size / 64
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(14 * s), fill='#2b3e9e')
    for y, alpha in ((38, 255), (47, 150)):
        pts = []
        for i in range(0, 37):
            x = 12 + i
            import math
            yy = y - 2.6 * math.sin((x - 12) / 36 * 2 * math.pi)
            pts.append((x * s, yy * s))
        d.line(pts, fill=(238, 241, 236, alpha), width=max(2, int(3 * s)), joint='curve')
    c = (32 * s, 18 * s); r = 8.4 * s
    d.polygon([(c[0], c[1] - r), (c[0] + r, c[1]), (c[0], c[1] + r), (c[0] - r, c[1])], fill='#d8b35e')
    im.save(os.path.join(SITE, f'assets/icon-{size}.png'))

manifest = '''{
  "name": "Wenecja w długim trwaniu",
  "short_name": "Wenecja",
  "description": "Literacko-historyczny przewodnik po Wenecji",
  "lang": "pl",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#eef1ec",
  "theme_color": "#2b3e9e",
  "icons": [
    {"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "assets/icon.svg", "sizes": "any", "type": "image/svg+xml"}
  ]
}
'''
open(os.path.join(SITE, 'manifest.webmanifest'), 'w').write(manifest)

files = ['./', 'index.html', 'vendor/leaflet.js', 'vendor/leaflet.css', 'assets/app.css', 'assets/app.js', 'assets/basemap.js',
         'data/basemap.js', 'data/places.js', 'data/routes.js', 'assets/icon.svg', 'assets/icon-192.png', 'manifest.webmanifest']
sw = '''/* Offline cache for the GitHub Pages build. Same-origin files are cached on install;
   Google Fonts are cached on first use; OpenStreetMap tiles are never cached. */
const CACHE = 'wenecja-v%s';
const FILES = %s;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => /\\.(js|css)$/.test(f) ? f + '?v=%s' : f))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('tile.openstreetmap.org')) return;
  const isFont = /fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./'))));
});
''' % (VERSION, repr(files).replace("'", '"'), VERSION)
open(os.path.join(SITE, 'sw.js'), 'w').write(sw)
print('site assembled, version', VERSION)
