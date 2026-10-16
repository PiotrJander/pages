"""Route geometry: walking legs routed on the 1808 street network, boat legs on open water.

Writes data/places.js and data/routes.js for the site.
"""
import json, math, pickle, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.graph import MCP_Geometric
from shapely.geometry import LineString, Polygon
from geo_common import to_m, to_deg, polys
from content_places import PLACES, T
from content_routes import ROUTES, STOPS, MANUAL, CORRIDORS, WATER_CORRIDORS, DAY_LABELS

OUTDIR = sys.argv[1]
G = pickle.load(open('geom.pkl', 'rb'))

PT = {p['id']: (p['lat'], p['lon'], p['name']) for p in PLACES}
PT.update({k: v for k, v in STOPS.items()})


def ll(ref):
    la, lo, _ = PT[ref]
    return la, lo


class Grid:
    def __init__(self, x0, y0, x1, y1, res):
        self.x0, self.y0, self.res = x0, y0, res
        self.w = int(math.ceil((x1 - x0) / res))
        self.h = int(math.ceil((y1 - y0) / res))

    def px(self, x, y):
        return ((x - self.x0) / self.res, (self.y0 + self.h * self.res - y) / self.res)

    def xy(self, c, r):
        return (self.x0 + (c + 0.5) * self.res, self.y0 + self.h * self.res - (r + 0.5) * self.res)

    def raster(self, geom):
        img = Image.new('L', (self.w, self.h), 0)
        d = ImageDraw.Draw(img)
        for p in polys(geom):
            d.polygon([self.px(x, y) for x, y in p.exterior.coords], fill=1)
            for h in p.interiors:
                d.polygon([self.px(x, y) for x, y in h.coords], fill=0)
        return np.array(img, dtype=bool), img, d


# ---- walking grid (1 m) over the historic centre
wx0, wy0 = to_m(12.3090, 45.4270)
wx1, wy1 = to_m(12.3630, 45.4500)
WG = Grid(wx0, wy0, wx1, wy1, 1.0)
walk_mask, img, draw = WG.raster(G['walk'])
for line in CORRIDORS:
    pts = [WG.px(*to_m(lo, la)) for la, lo in line]
    draw.line(pts, fill=1, width=7)
walk_mask = np.array(img, dtype=bool)
lab, n = ndimage.label(walk_mask, structure=np.ones((3, 3)))
sizes = ndimage.sum(walk_mask, lab, range(1, n + 1))
walk_mask = lab == (int(np.argmax(sizes)) + 1)
print('walk grid', WG.w, WG.h, 'components', n, 'kept', walk_mask.sum())
dist = ndimage.distance_transform_edt(walk_mask)
walk_cost = np.where(walk_mask, 1.0 + 2.5 / (1.0 + dist), np.inf)
_, walk_near = ndimage.distance_transform_edt(~walk_mask, return_indices=True)

# ---- water grid (8 m) over the lagoon
bx0, by0 = to_m(12.2950, 45.3950)
bx1, by1 = to_m(12.4450, 45.5080)
BG = Grid(bx0, by0, bx1, by1, 8.0)
land_mask, limg, ldraw = BG.raster(G['city'].union(G['isles']))
for line in WATER_CORRIDORS:
    ldraw.line([BG.px(*to_m(lo, la)) for la, lo in line], fill=0, width=3)
land_mask = np.array(limg, dtype=bool)
water = ~land_mask
lab, n = ndimage.label(water)
sizes = ndimage.sum(water, lab, range(1, n + 1))
water = lab == (int(np.argmax(sizes)) + 1)
land_mask = ~water
wdist = ndimage.distance_transform_edt(water)
boat_cost = np.where(water, 1.0 + 12.0 / (1.0 + wdist), np.inf)
_, water_near = ndimage.distance_transform_edt(land_mask, return_indices=True)
print('water grid', BG.w, BG.h)


def snap(grid, near, mask, la, lo, maxd):
    x, y = to_m(lo, la)
    c, r = grid.px(x, y)
    c, r = int(c), int(r)
    if not (0 <= c < grid.w and 0 <= r < grid.h):
        return None
    if mask[r, c]:
        return (r, c)
    rr, cc = near[0][r, c], near[1][r, c]
    if math.hypot(rr - r, cc - c) * grid.res > maxd:
        return None
    return (int(rr), int(cc))


def route(grid, cost, a, b, margin):
    r0, r1 = max(0, min(a[0], b[0]) - margin), min(grid.h, max(a[0], b[0]) + margin)
    c0, c1 = max(0, min(a[1], b[1]) - margin), min(grid.w, max(a[1], b[1]) + margin)
    sub = cost[r0:r1, c0:c1]
    m = MCP_Geometric(sub)
    m.find_costs([(a[0] - r0, a[1] - c0)], [(b[0] - r0, b[1] - c0)])
    try:
        path = m.traceback((b[0] - r0, b[1] - c0))
    except ValueError:
        return None
    pts = [grid.xy(c + c0, r + r0) for r, c in path]
    return pts


def to_ll(pts, tol):
    ls = LineString(pts).simplify(tol)
    out = []
    for x, y in ls.coords:
        lo, la = to_deg(x, y)
        out.append([round(la, 6), round(lo, 6)])
    return out, LineString(pts).length


def walk_leg(fa, fb):
    if (fa, fb) in MANUAL:
        coords = MANUAL[(fa, fb)]
        ls = LineString([to_m(lo, la) for la, lo in coords])
        return [[round(a, 6), round(b, 6)] for a, b in coords], ls.length, True
    la1, lo1 = ll(fa); la2, lo2 = ll(fb)
    a = snap(WG, walk_near, walk_mask, la1, lo1, 70)
    b = snap(WG, walk_near, walk_mask, la2, lo2, 70)
    if a and b:
        for margin in (350, 900, 2500):
            pts = route(WG, walk_cost, a, b, margin)
            if pts:
                start = to_m(lo1, la1); end = to_m(lo2, la2)
                coords, length = to_ll([start] + pts + [end], 1.2)
                return coords, length, False
    print('  ! straight walk', fa, fb)
    ls = LineString([to_m(lo1, la1), to_m(lo2, la2)])
    return [[la1, lo1], [la2, lo2]], ls.length, True


def boat_leg(fa, fb, via):
    seq = [fa] + list(via or []) + [fb]
    allpts = []
    for u, v in zip(seq, seq[1:]):
        la1, lo1 = ll(u); la2, lo2 = ll(v)
        a = snap(BG, water_near, water, la1, lo1, 600)
        b = snap(BG, water_near, water, la2, lo2, 600)
        pts = None
        if a and b:
            for margin in (120, 400, 1500):
                pts = route(BG, boat_cost, a, b, margin)
                if pts:
                    break
        if not pts:
            print('  ! straight boat', u, v)
            pts = [to_m(lo1, la1), to_m(lo2, la2)]
        else:
            pts = [to_m(lo1, la1)] + pts + [to_m(lo2, la2)]
        allpts += pts if not allpts else pts[1:]
    coords, length = to_ll(allpts, 6.0)
    return coords, length


routes_out = []
for r in ROUTES:
    print('route', r['id'])
    stops = []
    for s in r['stops']:
        la, lo, name = PT[s['ref']]
        stops.append(dict(ref=s['ref'], t=s.get('t', ''), note=s.get('note', ''), lat=la, lon=lo, name=name,
                          place=s['ref'] in {p['id'] for p in PLACES}))
    legs = []
    assert len(r['legs']) == len(r['stops']) - 1, r['id']
    for i, lg in enumerate(r['legs']):
        fa, fb = r['stops'][i]['ref'], r['stops'][i + 1]['ref']
        if lg['mode'] == 'walk':
            coords, m, approx = walk_leg(fa, fb)
            legs.append(dict(mode='walk', coords=coords, m=round(m), min=max(1, round(m / 70)), approx=approx))
        else:
            coords, m = boat_leg(fa, fb, lg.get('via'))
            legs.append(dict(mode='boat', line=lg.get('line', ''), coords=coords, m=round(m)))
    walk_m = sum(l['m'] for l in legs if l['mode'] == 'walk')
    rr = {k: r[k] for k in ('id', 'name', 'slot', 'window', 'suggest', 'days', 'intro')}
    rr.update(stops=stops, legs=legs, walk_m=walk_m)
    routes_out.append(rr)
    print('   walk m', walk_m)

# place → routes index
member = {}
for r in routes_out:
    for s in r['stops']:
        if s['place']:
            member.setdefault(s['ref'], [])
            if r['id'] not in member[s['ref']]:
                member[s['ref']].append(r['id'])
places_out = []
for p in PLACES:
    q = dict(p)
    q['routes'] = member.get(p['id'], [])
    places_out.append(q)

open(OUTDIR + '/places.js', 'w').write('/* Places: essays and readings. Generated from content_places.py. */\nwindow.VB_PLACES=' +
                                      json.dumps(places_out, ensure_ascii=False, separators=(',', ':')) + ';\nwindow.VB_TIMES=' +
                                      json.dumps(T, ensure_ascii=False) + ';\n')
open(OUTDIR + '/routes.js', 'w').write('/* Routes with geometry. Generated by build_routes.py. */\nwindow.VB_ROUTES=' +
                                      json.dumps(routes_out, ensure_ascii=False, separators=(',', ':')) + ';\nwindow.VB_DAYS=' +
                                      json.dumps(DAY_LABELS, ensure_ascii=False) + ';\n')
print('done')
