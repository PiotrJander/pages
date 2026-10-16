/* Vector basemap drawn client-side into Leaflet canvas tiles.
   Data: window.VB_BASEMAP — delta-encoded integer rings (1e-6 deg) per layer.
   Layers, bottom to top: isles (GSHHG islands), city (1808 land), courts, blocks. */
(function () {
  'use strict';

  var BUCKET_Z = 15;            // spatial index granularity (Web Mercator tile zoom)
  var BUCKET_N = Math.pow(2, BUCKET_Z);

  function mx(lon) { return (lon + 180) / 360; }
  function my(lat) {
    var s = Math.sin(lat * Math.PI / 180);
    return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  }

  // Decode a layer into polygons: {rings: [Float64Array(x0,y0,x1,y1,...)], bb: [minx,miny,maxx,maxy]}
  function decode(layer, scale) {
    var out = [];
    for (var i = 0; i < layer.length; i++) {
      var poly = layer[i], rings = [], bb = [Infinity, Infinity, -Infinity, -Infinity];
      for (var r = 0; r < poly.length; r++) {
        var enc = poly[r], n = enc.length / 2, arr = new Float64Array(enc.length);
        var x = 0, y = 0;
        for (var k = 0; k < n; k++) {
          x += enc[2 * k]; y += enc[2 * k + 1];
          var X = mx(x / scale), Y = my(y / scale);
          arr[2 * k] = X; arr[2 * k + 1] = Y;
          if (r === 0) {
            if (X < bb[0]) bb[0] = X; if (X > bb[2]) bb[2] = X;
            if (Y < bb[1]) bb[1] = Y; if (Y > bb[3]) bb[3] = Y;
          }
        }
        rings.push(arr);
      }
      out.push({ rings: rings, bb: bb });
    }
    return out;
  }

  function index(polys) {
    var buckets = new Map();
    for (var i = 0; i < polys.length; i++) {
      var bb = polys[i].bb;
      var x0 = Math.floor(bb[0] * BUCKET_N), x1 = Math.floor(bb[2] * BUCKET_N);
      var y0 = Math.floor(bb[1] * BUCKET_N), y1 = Math.floor(bb[3] * BUCKET_N);
      for (var bx = x0; bx <= x1; bx++) for (var by = y0; by <= y1; by++) {
        var key = bx * 1e6 + by, list = buckets.get(key);
        if (!list) { list = []; buckets.set(key, list); }
        list.push(i);
      }
    }
    return buckets;
  }

  function prepare(data) {
    var L = {};
    ['isles', 'city', 'courts', 'blocks'].forEach(function (k) {
      var polys = decode(data.layers[k], data.scale);
      L[k] = { polys: polys, idx: index(polys) };
    });
    return L;
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  var VBasemap = L.GridLayer.extend({
    options: { tileSize: 256, updateWhenZooming: false, keepBuffer: 3, className: 'vb-basemap' },

    initialize: function (data, opts) {
      L.setOptions(this, opts);
      this._layers = prepare(data);
      this.refreshColors();
    },

    refreshColors: function () {
      this._c = {
        water: cssVar('--lagoon', '#b2c6be'), isle: cssVar('--isle', '#d8dacf'), land: cssVar('--land', '#eff0ea'),
        court: cssVar('--court', '#c9d0c9'), block: cssVar('--block', '#343c39')
      };
    },

    createTile: function (coords) {
      var size = this.getTileSize(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      // 1px bleed past the right and bottom edges hides hairline seams at fractional zoom
      var tile = document.createElement('canvas');
      tile.width = Math.ceil((size.x + 1) * dpr); tile.height = Math.ceil((size.y + 1) * dpr);
      var ctx = tile.getContext('2d');
      ctx.scale(dpr, dpr);
      this._draw(ctx, coords, size.x);
      return tile;
    },

    _draw: function (ctx, c, ts) {
      var z = c.z, n = Math.pow(2, z);
      var k = n * ts, ox = c.x * ts, oy = c.y * ts, e = 1 / k;
      var tx0 = c.x / n, ty0 = c.y / n, tx1 = (c.x + 1) / n + e, ty1 = (c.y + 1) / n + e;
      ctx.fillStyle = this._c.water; ctx.fillRect(0, 0, ts + 1, ts + 1);
      var self = this;
      function layer(name, color) {
        var Ly = self._layers[name], seen = new Set();
        var bx0 = Math.floor(tx0 * BUCKET_N), bx1 = Math.floor(tx1 * BUCKET_N - 1e-9);
        var by0 = Math.floor(ty0 * BUCKET_N), by1 = Math.floor(ty1 * BUCKET_N - 1e-9);
        var span = (bx1 - bx0 + 1) * (by1 - by0 + 1);
        var cand = [];
        if (span > 400) {
          for (var i = 0; i < Ly.polys.length; i++) cand.push(i);
        } else {
          for (var bx = bx0; bx <= bx1; bx++) for (var by = by0; by <= by1; by++) {
            var list = Ly.idx.get(bx * 1e6 + by);
            if (list) for (var j = 0; j < list.length; j++) if (!seen.has(list[j])) { seen.add(list[j]); cand.push(list[j]); }
          }
        }
        ctx.beginPath();
        for (var q = 0; q < cand.length; q++) {
          var p = Ly.polys[cand[q]], bb = p.bb;
          if (bb[2] < tx0 || bb[0] > tx1 || bb[3] < ty0 || bb[1] > ty1) continue;
          // skip sub-pixel polygons at low zoom
          if ((bb[2] - bb[0]) * k < 0.6 && (bb[3] - bb[1]) * k < 0.6) continue;
          for (var r = 0; r < p.rings.length; r++) {
            var a = p.rings[r];
            ctx.moveTo(a[0] * k - ox, a[1] * k - oy);
            for (var m = 2; m < a.length; m += 2) ctx.lineTo(a[m] * k - ox, a[m + 1] * k - oy);
            ctx.closePath();
          }
        }
        ctx.fillStyle = color; ctx.fill('evenodd');
      }
      layer('isles', this._c.isle);
      layer('city', this._c.land);
      if (z >= 15) layer('courts', this._c.court);
      if (z >= 13) layer('blocks', this._c.block);
    }
  });

  window.VBasemap = VBasemap;
})();
