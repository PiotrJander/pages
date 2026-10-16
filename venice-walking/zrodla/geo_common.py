"""Shared geometry helpers for the Venice guide build."""
import json, math, os
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union, transform
import shapely

# input data folder: venice1808.geojson + gshhs_lagoon.geojson (see README)
DL = os.environ.get('WENECJA_DANE', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dane')) + '/'

LON0, LAT0 = 12.33, 45.435
KX = 111320 * math.cos(math.radians(LAT0))  # metres per degree lon
KY = 111132.0                               # metres per degree lat


def to_m(x, y, z=None):
    return ((x - LON0) * KX, (y - LAT0) * KY)


def to_deg(x, y, z=None):
    return (x / KX + LON0, y / KY + LAT0)


def gm(g):
    return transform(to_m, g)


def gd(g):
    return transform(to_deg, g)


def load_1808():
    fs = json.load(open(DL + 'venice1808.geojson'))['features']
    out = []
    for f in fs:
        t = f['properties'].get('geometry_type')
        g = shape(f['geometry'])
        if not g.is_valid:
            g = g.buffer(0)
        out.append((t, g))
    return out


def load_gshhs():
    fs = json.load(open(DL + 'gshhs_lagoon.geojson'))['features']
    return [shape(f['geometry']) for f in fs]


def polys(g):
    if g.is_empty:
        return []
    if isinstance(g, Polygon):
        return [g]
    if isinstance(g, MultiPolygon):
        return list(g.geoms)
    return [p for p in getattr(g, 'geoms', []) if isinstance(p, Polygon)]
