"""Compose the stylised basemap: 1808 cadastre for the city, GSHHS for the lagoon islands.

Output: a compact JS file with integer, delta-encoded polygon rings per layer.
"""
import json, pickle, sys
from shapely.geometry import Polygon, MultiPolygon, box
from shapely.ops import unary_union
from shapely.affinity import translate
import shapely
from geo_common import *

OUT = sys.argv[1]

items = load_1808()
city_parts = [gm(g) for t, g in items if t not in (None, 'water')]
blocks_parts = [gm(g) for t, g in items if t in ('building', 'sottoportico')]
court_parts = [gm(g) for t, g in items if t == 'courtyard']
walk_parts = [gm(g) for t, g in items if t in ('street', 'sottoportico')]

city = unary_union([p.buffer(0.05) for p in city_parts]).buffer(-0.05)
blocks = unary_union([p.buffer(0.05) for p in blocks_parts]).buffer(-0.05)
courts = unary_union(court_parts)
walk = unary_union(walk_parts)
print('city polys', len(polys(city)), 'blocks', len(polys(blocks)), 'courts', len(polys(courts)))

# close canals so the coarse GSHHS blob under the city can be removed
city_closed = city.buffer(90, quad_segs=4).buffer(-80, quad_segs=4)

isles = []
for g in load_gshhs():
    for p in polys(g):
        c = p.centroid
        # GSHHS is offset around the Lido; correct with San Lazzaro degli Armeni as control point
        if c.y < 45.425 and c.x > 12.348:
            p = translate(p, xoff=0.0031, yoff=-0.0009)
        isles.append(gm(p))
isles = unary_union(isles).difference(city_closed)
isles = isles.buffer(0)
print('isles', len(polys(isles)))

pickle.dump({'city': city, 'blocks': blocks, 'walk': walk, 'isles': isles}, open('geom.pkl', 'wb'))

# GSHHS coastlines come as a staircase at lagoon scale; round them for drawing only
# (routing keeps the original shapes in geom.pkl). Closing fills the inner steps,
# Chaikin corner-cutting softens the outer ones without deleting small islands.
import numpy as np
from scipy.ndimage import gaussian_filter1d

def gsmooth(coords, step=12.0, sigma_m=70.0):
    ring = shapely.segmentize(shapely.LinearRing(coords), step)
    xy = np.asarray(ring.coords)[:-1]
    n = len(xy)
    sig = min(sigma_m / step, n / 10.0)
    if sig < 0.8:
        return list(map(tuple, xy)) + [tuple(xy[0])]
    sx = gaussian_filter1d(xy[:, 0], sig, mode='wrap')
    sy = gaussian_filter1d(xy[:, 1], sig, mode='wrap')
    out = list(zip(sx, sy))
    return out + [out[0]]

def smooth(g):
    res = []
    for p in polys(g.buffer(25, quad_segs=4).buffer(-25, quad_segs=4)):
        if p.area < 400:
            continue
        sh = Polygon(gsmooth(p.exterior.coords), [gsmooth(r.coords) for r in p.interiors if Polygon(r).area > 3000])
        if sh.is_valid and sh.area > 300:
            res.append(sh)
        else:
            res.append(sh.buffer(0))
    return unary_union(res).difference(city_closed)

isles_draw = smooth(isles)
print('isles smoothed', len(polys(isles_draw)))

SCALE = 1e6


def enc_ring(coords):
    out = []
    px = py = 0
    first = True
    for x, y in coords:
        lon, lat = to_deg(x, y)
        ix, iy = int(round(lon * SCALE)), int(round(lat * SCALE))
        if first:
            out += [ix, iy]
            first = False
        else:
            out += [ix - px, iy - py]
        px, py = ix, iy
    return out


def enc_layer(g, tol, min_area=0.0):
    res = []
    for p in polys(g.simplify(tol, preserve_topology=True)):
        if p.area < min_area:
            continue
        rings = [enc_ring(list(p.exterior.coords)[:-1])]
        for h in p.interiors:
            if Polygon(h).area < min_area:
                continue
            rings.append(enc_ring(list(h.coords)[:-1]))
        res.append(rings)
    return res


layers = {
    'isles': enc_layer(isles_draw, 3.0, 30),
    'city': enc_layer(city, 0.45, 1),
    'blocks': enc_layer(blocks, 0.4, 2),
    'courts': enc_layer(courts, 0.4, 4),
}
for k, v in layers.items():
    print(k, len(v), sum(len(r) for poly in v for r in poly) // 2, 'pts')

data = {'scale': SCALE, 'layers': layers}
s = json.dumps(data, separators=(',', ':'))
open(OUT, 'w').write('/* Basemap: Venice 1808 Napoleonic cadastre (EPFL Time Machine, CC BY 4.0) + GSHHG islands. Generated. */\nwindow.VB_BASEMAP=' + s + ';\n')
print('bytes', len(s))
