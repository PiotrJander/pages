/* Wenecja w długim trwaniu — application
   Plain ES5-friendly script: Leaflet map, place pages, half-day routes, day filter,
   geolocation and read-aloud. Data: window.VB_PLACES, VB_ROUTES, VB_BASEMAP, VB_TIMES, VB_DAYS. */
(function () {
  'use strict';

  var PLACES = window.VB_PLACES || [];
  var ROUTES = window.VB_ROUTES || [];
  var TIMES = window.VB_TIMES || {};
  var DAYS = ['sat', 'sun', 'mon', 'tue'];
  var DAY_LABEL = window.VB_DAYS || { sat: 'Sob 17', sun: 'Nd 18', mon: 'Pon 19', tue: 'Wt 20' };
  var DAY_DATE = { sat: '2026-10-17', sun: '2026-10-18', mon: '2026-10-19', tue: '2026-10-20' };
  var DAY_LONG = { sat: 'sobota', sun: 'niedziela', mon: 'poniedziałek', tue: 'wtorek' };
  var KIND = {
    rdzen: { label: 'Oś miasta', plural: 'Oś miasta' },
    glebia: { label: 'Głębiej', plural: 'Głębiej' },
    slad: { label: 'Ślad literacki', plural: 'Ślady literackie' },
    biennale: { label: 'Biennale', plural: 'Biennale' },
    baza: { label: 'Przystań', plural: 'Przystanie' }
  };
  var AREAS = ['San Marco', 'San Polo', 'Dorsoduro', 'Castello', 'Cannaregio', 'Laguna', 'Lido'];
  var STATE_LABEL = { ok: 'ma sens', czesciowo: 'częściowo', nie: 'nie tego dnia' };
  var SLOT_GROUPS = [
    { key: 'rano', label: 'Poranki', test: function (s) { return /rano|świt/.test(s); } },
    { key: 'pop', label: 'Popołudnia i wieczory', test: function (s) { return /popołudnie|wiecz|zach/.test(s); } },
    { key: 'any', label: 'O dowolnej porze', test: function () { return true; } }
  ];

  var byId = {};
  PLACES.forEach(function (p) { byId[p.id] = p; });
  var routeById = {};
  ROUTES.forEach(function (r) { routeById[r.id] = r; });

  // ------------------------------------------------------------------ utils
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(k, v) {
    try { if (v === undefined) return window.localStorage.getItem('vb.' + k); window.localStorage.setItem('vb.' + k, v); } catch (e) { return null; }
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function isWide() { return window.matchMedia('(min-width: 900px)').matches; }
  function areaKey(a) {
    for (var i = 0; i < AREAS.length; i++) if (a.indexOf(AREAS[i]) === 0) return AREAS[i];
    if (/Laguna/.test(a)) return 'Laguna';
    if (/Santa Croce/.test(a)) return 'San Polo';
    return 'Laguna';
  }
  function fmtM(m) { if (m < 30) return 'tuż obok'; return m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(m / 10) * 10 + ' m'; }
  function hav(a, b) {
    var R = 6371000, toR = Math.PI / 180;
    var dLa = (b[0] - a[0]) * toR, dLo = (b[1] - a[1]) * toR;
    var s = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function romeDate() {
    try {
      var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });
      return f.format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  var TODAY = null;
  DAYS.forEach(function (d) { if (DAY_DATE[d] === romeDate()) TODAY = d; });

  var ICON = {
    back: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6"/></svg>',
    play: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4.5v11l9-5.5z"/></svg>',
    stop: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="1.5"/></svg>',
    pin: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10" cy="8.5" r="2.6"/><path d="M10 18s-5.5-5.2-5.5-9.5a5.5 5.5 0 0 1 11 0C15.5 12.8 10 18 10 18z"/></svg>',
    loc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7"/></svg>',
    fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    ext: '<svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4.5 2.5h-2v7h7v-2M7 2.5h2.5V5M9.3 2.7 5.5 6.5"/></svg>',
    chev: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5 9.5 7 4 11.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ------------------------------------------------------------------ state
  var S = {
    tab: 'miejsca',
    view: null,
    day: TODAY || store('day') || 'sat',
    filter: store('filter') || 'all',
    me: null,
    sheet: 'half'
  };
  if (DAYS.indexOf(S.day) < 0) S.day = 'sat';

  function hoursFor(p, day) {
    var h = p.info && p.info.hours;
    if (!h) return null;
    var v = h[day];
    return v ? { text: v, closed: false } : { text: 'zamknięte', closed: true };
  }

  // ------------------------------------------------------------------ map
  var map = L.map('map', {
    zoomControl: false, minZoom: 11, maxZoom: 19, zoomSnap: 0.25, zoomDelta: 0.5,
    maxBounds: [[45.33, 12.20], [45.56, 12.55]], maxBoundsViscosity: 0.8, attributionControl: true
  });
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Kataster 1808: <a href="https://github.com/epfl-timemachine/venice-1808-landregister" target="_blank" rel="noopener">EPFL Time Machine</a> (CC BY 4.0) · wyspy: GSHHG');
  var CITY = L.latLngBounds([45.4268, 12.3150], [45.4480, 12.3640]);

  var base = null;
  if (window.VB_BASEMAP && window.VBasemap) {
    base = new window.VBasemap(window.VB_BASEMAP, { minZoom: 11, maxZoom: 19 });
    base.addTo(map);
  }
  var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, opacity: 0.92,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  });
  var osmFailed = 0;
  osm.on('tileerror', function () {
    osmFailed++;
    if (osmFailed === 3) toast('Podkład OpenStreetMap nie ładuje się w tym widoku. Zadziała na stronie z GitHub Pages; tu zostaje mapa z 1808 roku.');
  });

  var LABELS = [
    ['Canal Grande', 45.4362, 12.3301, 'water'], ['Bacino di San Marco', 45.4313, 12.3425, 'water'],
    ['Canale della Giudecca', 45.4283, 12.3245, 'water minor'], ['Laguna', 45.4630, 12.3850, 'water big'],
    ['Mare Adriatico', 45.4030, 12.3990, 'water big'], ['Giudecca', 45.4252, 12.3240, 'land'],
    ['Lido', 45.4100, 12.3660, 'land'], ['Murano', 45.4570, 12.3520, 'land'], ['Burano', 45.4868, 12.4155, 'land'],
    ['Torcello', 45.5004, 12.4140, 'land'], ['San Marco', 45.4337, 12.3345, 'land minor'],
    ['Castello', 45.4372, 12.3470, 'land minor'], ['Cannaregio', 45.4432, 12.3355, 'land minor'],
    ['San Polo', 45.4378, 12.3300, 'land minor'], ['Santa Croce', 45.4400, 12.3235, 'land minor'],
    ['Dorsoduro', 45.4320, 12.3220, 'land minor'], ['Sant’Erasmo', 45.4680, 12.4090, 'land']
  ];
  LABELS.forEach(function (l) {
    L.marker([l[1], l[2]], {
      interactive: false, keyboard: false,
      icon: L.divIcon({ className: '', html: '<div class="maplabel ' + l[3] + '">' + esc(l[0]) + '</div>', iconSize: [0, 0] })
    }).addTo(map);
  });

  function zoomClasses() {
    var z = map.getZoom(), c = map.getContainer().classList;
    c.toggle('map-labels', z >= 16.5);
    c.toggle('zoom-low', z < 13.5);
    c.toggle('zoom-high', z >= 14.5);
  }
  map.on('zoomend', zoomClasses);

  // pins
  var markers = {};
  PLACES.forEach(function (p) {
    var icon = L.divIcon({
      className: '', iconSize: [24, 24], iconAnchor: [12, 12],
      html: '<div class="pin" data-id="' + p.id + '" style="width:24px;height:24px"><span class="glyph ' + p.kind + '"></span><span class="lbl">' + esc(p.name) + '</span></div>'
    });
    var m = L.marker([p.lat, p.lon], { icon: icon, title: p.name, riseOnHover: true, keyboard: true });
    m.bindPopup(function () { return popupHtml(p); }, { maxWidth: 260, autoPanPaddingTopLeft: [20, 70], autoPanPaddingBottomRight: [70, 20] });
    m.on('click', function () {
      if (!isWide() && S.sheet !== 'peek') setSheet('peek');
    });
    m.addTo(map);
    markers[p.id] = m;
  });

  function popupHtml(p) {
    var h = hoursFor(p, S.day);
    return '<div class="pop"><div class="k"><span class="glyph ' + p.kind + '"></span> ' + esc(KIND[p.kind].label) + ' · ' + esc(p.area) + '</div>' +
      '<div class="n">' + esc(p.name) + '</div><div class="s">' + esc(p.teaser) + '</div>' +
      (h ? '<div class="h' + (h.closed ? ' closed' : '') + '">' + esc(DAY_LONG[S.day]) + ': ' + esc(h.text) + '</div>' : '') +
      (p.kind === 'biennale' ? '' : '<button class="btn" data-open="' + p.id + '">Czytaj na miejscu</button>') + '</div>';
  }
  map.on('popupopen', function (e) {
    var b = e.popup.getElement().querySelector('[data-open]');
    if (b) b.addEventListener('click', function () { map.closePopup(); go('#m-' + b.getAttribute('data-open')); });
  });

  function pinEls() { return document.querySelectorAll('.pin'); }
  function setPinState(hlIds) {
    var set = hlIds ? new Set(hlIds) : null;
    pinEls().forEach(function (el) {
      var id = el.getAttribute('data-id');
      el.classList.toggle('dim', !!set && !set.has(id));
      el.classList.toggle('hl', !!set && set.has(id));
    });
  }

  var selId = null;
  function setSel(id) {
    if (selId && markers[selId]) { markers[selId].setZIndexOffset(0); var o = document.querySelector('.pin[data-id="' + selId + '"]'); if (o) o.classList.remove('sel'); }
    selId = id;
    if (id && markers[id]) { markers[id].setZIndexOffset(1000); var n = document.querySelector('.pin[data-id="' + id + '"]'); if (n) n.classList.add('sel'); }
  }

  // route drawing
  var routeLayer = L.layerGroup().addTo(map);
  var chevLayer = L.layerGroup().addTo(map);
  var current = null;

  function drawRoute(r) {
    routeLayer.clearLayers(); chevLayer.clearLayers();
    current = r;
    if (!r) { setPinState(null); return; }
    r.legs.forEach(function (lg) {
      var ll = lg.coords;
      if (lg.mode === 'walk') {
        L.polyline(ll, { className: 'route-line casing', weight: 8, opacity: 1, interactive: false }).addTo(routeLayer);
        L.polyline(ll, { className: 'route-line walk' + (lg.approx ? ' approx' : ''), weight: 4, opacity: 1, interactive: false, dashArray: lg.approx ? '6 7' : null }).addTo(routeLayer);
        L.polyline(ll, { className: 'route-line flow', weight: 2, opacity: 1, interactive: false }).addTo(routeLayer);
      } else {
        L.polyline(ll, { className: 'route-line boat', weight: 3, opacity: 1, dashArray: '2 7', interactive: false }).addTo(routeLayer);
      }
    });
    var seen = {};
    r.stops.forEach(function (s, i) {
      var key = s.ref;
      if (!seen[key]) seen[key] = { s: s, n: [] };
      seen[key].n.push(i + 1);
    });
    Object.keys(seen).forEach(function (k) {
      var o = seen[k], water = /^s_|^w_/.test(o.s.ref) && !o.s.place;
      var lab = o.n.join('·');
      var w = Math.max(24, 10 + lab.length * 7);
      L.marker([o.s.lat, o.s.lon], {
        icon: L.divIcon({ className: '', iconSize: [w, 24], iconAnchor: [w / 2, 12], html: '<div class="stopnum' + (water ? ' water' : '') + '" style="width:' + w + 'px;border-radius:12px">' + lab + '</div>' }),
        zIndexOffset: 1000, title: o.s.name
      }).on('click', function () {
        if (o.s.place) go('#m-' + o.s.ref); else map.flyTo([o.s.lat, o.s.lon], Math.max(map.getZoom(), 16));
      }).addTo(routeLayer);
    });
    setPinState(r.stops.filter(function (s) { return s.place; }).map(function (s) { return s.ref; }));
    drawChevrons();
  }

  function drawChevrons() {
    chevLayer.clearLayers();
    if (!current) return;
    var step = 110;
    current.legs.forEach(function (lg) {
      var pts = lg.coords.map(function (c) { return map.latLngToLayerPoint(c); });
      var acc = step * 0.5;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], d = a.distanceTo(b);
        while (acc <= d) {
          var t = acc / d, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
          var ll = map.layerPointToLatLng([x, y]);
          L.marker(ll, {
            interactive: false, keyboard: false,
            icon: L.divIcon({ className: '', iconSize: [14, 14], iconAnchor: [7, 7], html: '<div class="chev' + (lg.mode === 'boat' ? ' boat' : '') + '" style="transform:rotate(' + ang.toFixed(1) + 'deg)">' + ICON.chev + '</div>' })
          }).addTo(chevLayer);
          acc += step;
        }
        acc -= d;
      }
    });
  }
  map.on('zoomend', drawChevrons);

  function routeBounds(r) {
    var b = L.latLngBounds([]);
    r.legs.forEach(function (lg) { lg.coords.forEach(function (c) { b.extend(c); }); });
    return b;
  }
  function pad() {
    if (isWide()) return { paddingTopLeft: [40, 40], paddingBottomRight: [70, 40] };
    var vis = visibleSheet();
    return { paddingTopLeft: [24, 70], paddingBottomRight: [64, vis + 24] };
  }
  function fitRoute(r) { map.fitBounds(routeBounds(r), Object.assign({ maxZoom: 17 }, pad())); }
  // fly so that a point lands in the middle of the map area the sheet leaves visible
  function flyAbove(ll, z) {
    if (isWide()) { map.flyTo(ll, z, { duration: 0.6 }); return; }
    var vis = visibleSheet();
    var pt = map.project(ll, z);
    map.flyTo(map.unproject(L.point(pt.x, pt.y + vis / 2 - 10), z), z, { duration: 0.6 });
  }
  function showPlace(p, zoom) { flyAbove([p.lat, p.lon], zoom || Math.max(map.getZoom(), 16)); }

  // geolocation
  var meMarker = null, meCircle = null, watching = null, firstFix = true, listedAt = null;
  function locate() {
    var btn = $('#btn-loc');
    if (watching !== null) {
      navigator.geolocation.clearWatch(watching); watching = null; btn.setAttribute('aria-pressed', 'false');
      if (meMarker) { map.removeLayer(meMarker); map.removeLayer(meCircle); meMarker = null; }
      S.me = null; listedAt = null; render(); return;
    }
    if (!('geolocation' in navigator)) { toast('Ta przeglądarka nie udostępnia lokalizacji.'); return; }
    btn.setAttribute('aria-pressed', 'true'); firstFix = true;
    try {
      watching = navigator.geolocation.watchPosition(function (pos) {
        var ll = [pos.coords.latitude, pos.coords.longitude];
        S.me = ll;
        if (!meMarker) {
          meCircle = L.circle(ll, { radius: pos.coords.accuracy, weight: 1, color: '#2f7cf6', fillOpacity: 0.08, interactive: false }).addTo(map);
          meMarker = L.marker(ll, { icon: L.divIcon({ className: '', iconSize: [18, 18], html: '<div class="me"></div>' }), zIndexOffset: 2000, interactive: false }).addTo(map);
        } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(pos.coords.accuracy); }
        if (firstFix) {
          firstFix = false;
          if (L.latLngBounds([[45.33, 12.20], [45.56, 12.55]]).contains(ll)) flyAbove(ll, Math.max(map.getZoom(), 16));
          else toast('Jesteś poza laguną; pokażę cię na mapie, gdy będziesz w Wenecji.');
        }
        // re-sort the list by distance only after a real move, so it does not jitter
        if (!S.view && S.tab === 'miejsca' && (!listedAt || hav(listedAt, ll) > 40)) { listedAt = ll; render(); }
      }, function (err) {
        watching = null; btn.setAttribute('aria-pressed', 'false');
        toast(err && err.code === 1
          ? 'Brak zgody na lokalizację. W podglądzie artefaktu jest zablokowana; po opublikowaniu na GitHub Pages przeglądarka zapyta o zgodę.'
          : 'Nie udało się ustalić lokalizacji. Spróbuj na zewnątrz, z dala od wysokich murów.');
      }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
    } catch (e) {
      watching = null; btn.setAttribute('aria-pressed', 'false');
      toast('Lokalizacja jest zablokowana w tym widoku. Zadziała na stronie z GitHub Pages.');
    }
  }

  // ------------------------------------------------------------------ speech
  var speaking = null;
  function speak(text, btn) {
    if (!('speechSynthesis' in window)) { toast('Ta przeglądarka nie czyta na głos.'); return; }
    var synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); speaking = null; setSpeakBtn(btn, false); return; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL'; u.rate = 0.98;
    var voices = synth.getVoices ? synth.getVoices() : [];
    for (var i = 0; i < voices.length; i++) if (/^pl/i.test(voices[i].lang)) { u.voice = voices[i]; break; }
    u.onend = u.onerror = function () { speaking = null; setSpeakBtn(btn, false); };
    speaking = u; setSpeakBtn(btn, true); synth.cancel(); synth.speak(u);
  }
  function stopSpeech() { if (speaking && window.speechSynthesis) { window.speechSynthesis.cancel(); speaking = null; } }
  function setSpeakBtn(btn, on) { if (btn) btn.innerHTML = on ? ICON.stop + ' Zatrzymaj' : ICON.play + ' Słuchaj'; }

  // ------------------------------------------------------------------ toast
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 6500);
  }

  // ------------------------------------------------------------------ sheet (phones)
  var panel = $('#panel');
  function sheetH() { return panel.getBoundingClientRect().height; }
  function sheetY(state) {
    var h = sheetH();
    if (state === 'full') return 0;
    if (state === 'peek') return Math.max(0, h - 132);
    return Math.round(h * 0.46);
  }
  function visibleSheet() { return isWide() ? 0 : Math.max(0, sheetH() - currentY); }
  var currentY = 0;
  function setSheet(state) {
    S.sheet = state;
    if (isWide()) { panel.style.removeProperty('--sheet-y'); return; }
    currentY = sheetY(state);
    panel.style.setProperty('--sheet-y', currentY + 'px');
    document.documentElement.style.setProperty('--sheet-peek', (sheetH() - currentY) + 'px');
  }
  (function dragSheet() {
    var startY = 0, startT = 0, baseY = 0, dragging = false, moved = false;
    function down(e) {
      if (isWide()) return;
      if (e.target.closest('button:not(.grip), a, input')) return;
      dragging = true; moved = false; startY = e.clientY; startT = Date.now(); baseY = currentY;
      panel.classList.add('dragging');
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
    }
    function move(e) {
      if (!dragging) return;
      var dy = e.clientY - startY;
      if (Math.abs(dy) > 4) moved = true;
      currentY = Math.min(Math.max(0, baseY + dy), sheetH() - 70);
      panel.style.setProperty('--sheet-y', currentY + 'px');
    }
    function up(e) {
      if (!dragging) return;
      dragging = false; panel.classList.remove('dragging');
      var dy = e.clientY - startY, v = dy / Math.max(1, Date.now() - startT);
      if (!moved) { setSheet(S.sheet === 'peek' ? 'half' : S.sheet === 'half' ? 'full' : 'half'); return; }
      var states = ['full', 'half', 'peek'];
      var target;
      if (v > 0.6) target = S.sheet === 'full' ? 'half' : 'peek';
      else if (v < -0.6) target = S.sheet === 'peek' ? 'half' : 'full';
      else target = states.reduce(function (best, s) { return Math.abs(sheetY(s) - currentY) < Math.abs(sheetY(best) - currentY) ? s : best; }, 'half');
      setSheet(target);
    }
    [$('#grip'), $('#head')].forEach(function (el) {
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  })();
  window.addEventListener('resize', function () { setSheet(S.sheet); map.invalidateSize(); });

  // ------------------------------------------------------------------ rendering
  var body = $('#body');

  function timesHtml(t) {
    return '<span class="times" title="' + esc((t || []).map(function (k) { return TIMES[k]; }).join(', ')) + '">' +
      ['L', 'K', 'W'].map(function (k) { return '<i class="' + ((t || []).indexOf(k) >= 0 ? 'on' : '') + '"></i>'; }).join('') + '</span>';
  }

  function renderDays() {
    var el = $('#days');
    el.innerHTML = DAYS.map(function (d) {
      return '<button class="day" aria-pressed="' + (S.day === d) + '" data-day="' + d + '">' + esc(DAY_LABEL[d]) +
        (TODAY === d ? '<span class="today">dziś</span>' : '') + '</button>';
    }).join('');
  }

  function renderTabs() {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.setAttribute('aria-selected', String(!S.view && t.getAttribute('data-tab') === S.tab || (S.view && ((S.view.type === 'route' && t.getAttribute('data-tab') === 'trasy') || (S.view.type === 'place' && t.getAttribute('data-tab') === 'miejsca')))));
    });
  }

  function placeRow(p) {
    var h = hoursFor(p, S.day);
    var dist = S.me ? fmtM(hav(S.me, [p.lat, p.lon])) : '';
    return '<li><button class="item" data-place="' + p.id + '"><span class="g"><span class="glyph ' + p.kind + '"></span></span>' +
      '<span class="t"><span class="n">' + esc(p.name) + '</span><span class="s">' + esc(p.teaser) + '</span></span>' +
      '<span class="r' + (h && h.closed ? ' closed' : '') + '">' + (p.times && p.times.length ? timesHtml(p.times) + '<br>' : '') +
      (h ? esc(h.closed ? 'zamknięte' : h.text.split(' ')[0]) : '') + (dist ? '<br>' + esc(dist) : '') + '</span></button></li>';
  }

  function renderPlaces() {
    var filters = [['all', 'Wszystkie', ''], ['rdzen', KIND.rdzen.plural, 'rdzen'], ['glebia', KIND.glebia.plural, 'glebia'], ['slad', KIND.slad.plural, 'slad'], ['biennale', 'Biennale', 'biennale']];
    var html = '<div class="filters" role="group" aria-label="Rodzaj miejsc">' + filters.map(function (f) {
      return '<button class="chip" data-filter="' + f[0] + '" aria-pressed="' + (S.filter === f[0]) + '">' + (f[2] ? '<span class="glyph ' + f[2] + '"></span>' : '') + esc(f[1]) + '</button>';
    }).join('') + '</div>';
    var list = PLACES.filter(function (p) { return S.filter === 'all' ? true : p.kind === S.filter; });
    if (S.me) {
      list = list.slice().sort(function (a, b) { return hav(S.me, [a.lat, a.lon]) - hav(S.me, [b.lat, b.lon]); });
      html += '<div class="group-h">Najbliżej ciebie</div><ul class="list">' + list.map(placeRow).join('') + '</ul>';
    } else {
      AREAS.forEach(function (a) {
        var items = list.filter(function (p) { return areaKey(p.area) === a; });
        if (!items.length) return;
        html += '<div class="group-h">' + esc(a === 'San Polo' ? 'Rialto, San Polo i Santa Croce' : a === 'Laguna' ? 'Wyspy laguny' : a) + '</div><ul class="list">' + items.map(placeRow).join('') + '</ul>';
      });
    }
    body.innerHTML = html;
  }

  function validityChips(r, compact) {
    return '<div class="validity">' + DAYS.map(function (d) {
      var st = r.days[d][0];
      return '<span class="v ' + st + (S.day === d ? ' sel' : '') + '" title="' + esc(DAY_LONG[d] + ': ' + STATE_LABEL[st] + (r.days[d][1] ? ' — ' + r.days[d][1] : '')) + '">' +
        esc(DAY_LABEL[d].split(' ')[0]) + (r.suggest === d ? ' <span class="sug">★</span>' : '') + '<span class="sr"> ' + esc(STATE_LABEL[st]) + '</span></span>';
    }).join('') + (compact ? '' : '') + '</div>';
  }

  function renderRoutes() {
    var html = '<p class="small" style="margin:6px 0 12px">Trasy na pół dnia. ★ to dzień, który proponuję, ale każdą możesz przenieść: kolor kropki mówi, czy danego dnia ma sens. Wybrany dzień jest obwiedziony.</p>';
    var used = {};
    SLOT_GROUPS.forEach(function (g) {
      var items = ROUTES.filter(function (r) { return !used[r.id] && g.test(r.slot); });
      if (!items.length) return;
      items.forEach(function (r) { used[r.id] = 1; });
      html += '<div class="group-h">' + esc(g.label) + '</div>';
      html += items.map(function (r) {
        var st = r.days[S.day][0];
        return '<button class="rcard' + (st === 'nie' ? ' dim' : '') + '" data-route="' + r.id + '"><div class="top"><span class="n">' + esc(r.name) + '</span><span class="slot">' + esc(r.window) + '</span></div>' +
          '<div class="meta">' + esc(r.slot) + ' · ' + r.stops.length + ' przystanków' + (r.walk_m ? ' · pieszo ' + fmtM(r.walk_m) : '') + '</div>' + validityChips(r) + '</button>';
      }).join('');
    });
    body.innerHTML = html;
  }

  function readingHtml(r) {
    var title = r.u ? '<a href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.w) + ' ' + ICON.ext + '</a>' : esc(r.w);
    return '<li class="read"><div class="who">' + esc(r.a) + '</div><div class="what">' + title + (r.pd ? '<span class="pd">' + (r.pd === 'oa' ? 'wolny dostęp' : 'domena publiczna') + '</span>' : '') + '</div>' +
      '<div class="where">' + esc(r.p) + '</div>' + (r.n ? '<div class="why">' + esc(r.n) + '</div>' : '') + '</li>';
  }

  function renderPlace(p) {
    var h = p.info && p.info.hours;
    var html = '<button class="back" data-back>' + ICON.back + ' Miejsca</button>' +
      '<div class="d-kicker"><span class="glyph ' + p.kind + '"></span>' + esc(KIND[p.kind].label) + ' · ' + esc(p.area) + (p.year && p.year !== '—' ? ' · ' + esc(p.year) : '') + '</div>' +
      '<h2 class="d-title">' + esc(p.name) + '</h2>';
    if (p.times && p.times.length) {
      html += '<div class="tchips" aria-label="Czasy Braudela">' + ['L', 'K', 'W'].map(function (k) {
        var on = p.times.indexOf(k) >= 0;
        return '<span class="tchip' + (on ? ' on' : '') + (p.times[0] === k ? ' first' : '') + '">' + esc(TIMES[k]) + '</span>';
      }).join('') + '</div>';
    }
    html += '<p class="d-lead">' + esc(p.teaser) + '</p>';
    html += '<div class="actions"><button class="btn" data-fly="' + p.id + '">' + ICON.pin + ' Na mapie</button>' +
      (p.essay && p.essay.length && p.kind !== 'biennale' ? '<button class="btn" data-speak>' + ICON.play + ' Słuchaj</button>' : '') + '</div>';
    html += '<div class="essay">' + (p.essay || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>';
    if (p.read && p.read.length) html += '<div class="sec-h">Czytać na miejscu</div><ul class="reads">' + p.read.map(readingHtml).join('') + '</ul>';
    html += '<div class="sec-h">Praktycznie</div>';
    if (h) {
      html += '<table class="hours"><tbody>' + DAYS.map(function (d) {
        var v = h[d];
        return '<tr class="' + (S.day === d ? 'sel' : '') + '"><td>' + esc(DAY_LABEL[d]) + '</td><td class="' + (v ? '' : 'closed') + '">' + esc(v || 'zamknięte') + '</td></tr>';
      }).join('') + '</tbody></table>';
    }
    if (p.info && p.info.tip) html += '<p class="tip">' + esc(p.info.tip) + '</p>';
    if (p.routes && p.routes.length) {
      html += '<div class="sec-h">Na trasach</div><div class="onroutes">' + p.routes.map(function (rid) {
        var r = routeById[rid]; return r ? '<button class="chip" data-route="' + r.id + '">' + esc(r.name) + '</button>' : '';
      }).join('') + '</div>';
    }
    body.innerHTML = html;
    body.scrollTop = 0;
  }

  function legLabel(lg) {
    if (lg.mode === 'boat') return 'vaporetto' + (lg.line ? ' · linia ' + lg.line : '') + ' · ' + fmtM(lg.m);
    return 'pieszo ' + lg.min + ' min · ' + fmtM(lg.m) + (lg.approx ? ' · linia orientacyjna' : '');
  }

  function renderRoute(r) {
    var html = '<button class="back" data-back>' + ICON.back + ' Trasy</button>' +
      '<div class="d-kicker">' + esc(r.slot) + ' · ' + esc(r.window) + (r.walk_m ? ' · pieszo ' + fmtM(r.walk_m) : '') + '</div>' +
      '<h2 class="d-title">' + esc(r.name) + '</h2>';
    html += '<div class="vgrid">' + DAYS.map(function (d) {
      var st = r.days[d];
      return '<div class="vrow"><span class="v ' + st[0] + (S.day === d ? ' sel' : '') + '">' + esc(DAY_LABEL[d]) + (r.suggest === d ? ' <span class="sug">★</span>' : '') + '</span><span class="note">' + esc(STATE_LABEL[st[0]]) + (st[1] ? '. ' + esc(st[1]) : '') + '</span></div>';
    }).join('') + '</div>';
    html += '<div class="actions" style="margin-top:12px"><button class="btn" data-fit>' + ICON.fit + ' Cała trasa</button></div>';
    html += '<div class="essay">' + r.intro.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>';
    html += '<div class="sec-h">Przebieg</div><ol class="timeline">';
    r.stops.forEach(function (s, i) {
      var water = !s.place;
      var p = byId[s.ref];
      html += '<li class="tl-stop"><span class="tl-num' + (water ? ' water' : '') + '">' + (i + 1) + '</span><div class="tl-main">' +
        '<span class="tl-time">' + esc(s.t) + '</span><button data-stop="' + i + '">' + esc(p ? p.name : s.name) + '</button>' +
        (s.note ? '<div class="tl-note">' + esc(s.note) + '</div>' : '') + '</div></li>';
      if (i < r.legs.length) {
        var lg = r.legs[i];
        html += '<li class="tl-leg ' + lg.mode + '" aria-hidden="true"><span class="bar"></span><span class="lab">' + esc(legLabel(lg)) + '</span></li>';
      }
    });
    html += '</ol>';
    body.innerHTML = html;
    body.scrollTop = 0;
  }

  function renderAbout() {
    var shelf = {}, order = [];
    PLACES.forEach(function (p) {
      (p.read || []).forEach(function (r) {
        var k = r.a + '|' + r.w;
        if (!shelf[k]) { shelf[k] = { r: r, at: [] }; order.push(k); }
        if (shelf[k].at.indexOf(p.name) < 0) shelf[k].at.push(p.name);
      });
    });
    function pdRank(r) { return r.pd === true ? 2 : r.pd ? 1 : 0; }
    order.sort(function (a, b) { return (pdRank(shelf[b].r) - pdRank(shelf[a].r)) || shelf[a].r.a.localeCompare(shelf[b].r.a, 'pl'); });
    var html = '<div class="about">' +
      '<p>To przewodnik do chodzenia po Wenecji w towarzystwie pisarzy i historyka, a nie listy atrakcji. Każde miejsce ma krótki esej, który zestawia trzy czasy Fernanda Braudela z tym, co o miejscu napisali podróżnicy i eseiści, oraz lektury do przeczytania na miejscu.</p>' +
      '<div class="sec-h">Trzy czasy Braudela</div><ul class="legend">' +
      '<li><span class="times"><i class="on"></i><i></i><i></i></span><span><b>Długie trwanie</b>: geografia, woda, sól, drewno, choroby. Prawie się nie zmienia.</span></li>' +
      '<li><span class="times"><i></i><i class="on"></i><i></i></span><span><b>Koniunktura</b>: wieloletnie cykle handlu, cen, szlaków i kapitału.</span></li>' +
      '<li><span class="times"><i></i><i></i><i class="on"></i></span><span><b>Wydarzenie</b>: bitwy, spiski, daty. Piana na fali.</span></li></ul>' +
      '<div class="sec-h">Mapa</div><ul class="legend">' +
      '<li><span class="glyph rdzen"></span><span>Oś miasta: miejsca, bez których nie da się zrozumieć Wenecji.</span></li>' +
      '<li><span class="glyph glebia"></span><span>Głębiej: mniej oczywiste, często ważniejsze.</span></li>' +
      '<li><span class="glyph slad"></span><span>Ślad literacki: miejsce istotne dzięki autorowi.</span></li>' +
      '<li><span class="glyph biennale"></span><span>Biennale: tylko praktycznie, bez komentarza.</span></li>' +
      '<li><span class="glyph baza"></span><span>Przystań: twoja baza i węzły łodzi.</span></li></ul>' +
      '<p class="small" style="margin-top:12px">Podkład to kataster napoleoński z 1808 roku (EPFL Time Machine, CC BY 4.0): miasto jedenaście lat po upadku Republiki, z teatrem San Samuele i kościołami, których już nie ma. Wyspy poza centrum, w tym Lido, Burano i Torcello, mają przybliżone kontury z GSHHG. Trasy piesze wyznaczyłem po sieci ulic z 1808 roku, dodając to, co zbudowano później: most Accademia, Rio Terà Foscarini, Riva dei Sette Martiri i aleję ogrodów Biennale. Na Lido, Burano i Torcello linie są orientacyjne. Na stronie z GitHub Pages możesz włączyć dzisiejszą mapę OpenStreetMap przyciskiem OSM.</p>' +
      '<p class="small">Godziny otwarcia sprawdziłem w połowie października 2026 roku. Te oznaczone „zwykle” bywają zmienne; zajrzyj na stronę miejsca przed wyjściem.</p>' +
      '<div class="sec-h">Półka podróżna</div><ul class="reads">' + order.map(function (k) {
        var o = shelf[k];
        return readingHtml({ a: o.r.a, w: o.r.w, p: 'przy: ' + o.at.join(', '), n: '', u: o.r.u, pd: o.r.pd });
      }).join('') + '</ul></div>';
    body.innerHTML = html;
  }

  function render() {
    renderDays(); renderTabs();
    if (S.view && S.view.type === 'place' && byId[S.view.id]) renderPlace(byId[S.view.id]);
    else if (S.view && S.view.type === 'route' && routeById[S.view.id]) renderRoute(routeById[S.view.id]);
    else if (S.tab === 'trasy') renderRoutes();
    else if (S.tab === 'o') renderAbout();
    else renderPlaces();
  }

  // ------------------------------------------------------------------ navigation
  function go(hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  }
  function route() {
    var h = (location.hash || '').replace(/^#/, '');
    stopSpeech();
    if (h.indexOf('m-') === 0 && byId[h.slice(2)]) {
      var p = byId[h.slice(2)];
      S.view = { type: 'place', id: p.id }; S.tab = 'miejsca';
      if (!current || current.stops.every(function (s) { return s.ref !== p.id; })) drawRoute(null);
      if (!isWide() && S.sheet === 'peek') setSheet('half');
      render();
      setSel(p.id);
      showPlace(p);
      return;
    }
    if (h.indexOf('t-') === 0 && routeById[h.slice(2)]) {
      var r = routeById[h.slice(2)];
      S.view = { type: 'route', id: r.id }; S.tab = 'trasy';
      if (!isWide() && S.sheet === 'full') setSheet('half');
      setSel(null);
      drawRoute(r); render(); fitRoute(r);
      return;
    }
    S.view = null; setSel(null);
    S.tab = h === 'trasy' ? 'trasy' : h === 'o' ? 'o' : 'miejsca';
    store('tab', S.tab);
    if (S.tab !== 'trasy') drawRoute(null);
    render();
  }
  window.addEventListener('hashchange', route);

  // delegated clicks in the panel
  panel.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-tab')) { go('#' + t.getAttribute('data-tab')); return; }
    if (t.hasAttribute('data-day')) { S.day = t.getAttribute('data-day'); store('day', S.day); render(); return; }
    if (t.hasAttribute('data-filter')) { S.filter = t.getAttribute('data-filter'); store('filter', S.filter); render(); return; }
    if (t.hasAttribute('data-place')) { go('#m-' + t.getAttribute('data-place')); return; }
    if (t.hasAttribute('data-route')) { go('#t-' + t.getAttribute('data-route')); return; }
    if (t.hasAttribute('data-back')) { go(S.view && S.view.type === 'route' ? '#trasy' : (current ? '#t-' + current.id : '#miejsca')); return; }
    if (t.hasAttribute('data-fly')) { var p = byId[t.getAttribute('data-fly')]; if (!isWide()) setSheet('peek'); setTimeout(function () { showPlace(p, 17); markers[p.id].openPopup(); }, 250); return; }
    if (t.hasAttribute('data-fit') && current) { if (!isWide()) setSheet('peek'); setTimeout(function () { fitRoute(current); }, 250); return; }
    if (t.hasAttribute('data-speak') && S.view) {
      var pl = byId[S.view.id];
      speak([pl.name + '.', pl.teaser].concat(pl.essay || []).join(' '), t); return;
    }
    if (t.hasAttribute('data-stop') && current) {
      var s = current.stops[+t.getAttribute('data-stop')];
      if (s.place) go('#m-' + s.ref);
      else { if (!isWide()) setSheet('peek'); map.flyTo([s.lat, s.lon], Math.max(map.getZoom(), 16)); }
    }
  });

  // map controls
  $('#btn-loc').addEventListener('click', locate);
  $('#btn-fit').addEventListener('click', function () {
    if (current) fitRoute(current); else map.fitBounds(CITY, pad());
  });
  $('#btn-osm').addEventListener('click', function () {
    var on = map.hasLayer(osm);
    if (on) map.removeLayer(osm); else { osmFailed = 0; osm.addTo(map); }
    this.setAttribute('aria-pressed', String(!on));
    this.textContent = on ? '1808' : 'OSM';
    this.setAttribute('aria-label', on ? 'Włącz dzisiejszą mapę OpenStreetMap' : 'Wróć do mapy z 1808 roku');
  });
  $('#btn-zin').addEventListener('click', function () { map.zoomIn(); });
  $('#btn-zout').addEventListener('click', function () { map.zoomOut(); });

  // theme changes repaint the canvas basemap
  function repaint() { if (base) { base.refreshColors(); base.redraw(); } }
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint); } catch (e) { /* old Safari */ }
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ------------------------------------------------------------------ boot
  setSheet(isWide() ? 'half' : 'half');
  map.fitBounds(CITY, pad());
  zoomClasses();
  if (!location.hash) {
    var t = store('tab');
    if (t === 'trasy' || t === 'o') S.tab = t;
  }
  route();

  // offline cache when served from a real site (GitHub Pages); silently skipped elsewhere
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|anthropic/.test(location.hostname)) {
    try { navigator.serviceWorker.register('sw.js').catch(function () { /* not available */ }); } catch (e) { /* noop */ }
  }
})();
