# Routing App Coverage

## When it is required
Apple requires a Routing App Coverage file only if your app provides turn-by-turn navigation or routing features (for example, for transportation, delivery, rideshare, or navigation apps).

## If your app does NOT provide routing
You do not need to upload a Routing App Coverage file. Leave this section as "Not required" in App Store Connect.

Status for Tayp v1.0: Not required.

## If your app DOES provide routing
Provide a GeoJSON file that describes the supported routing regions. Apple accepts a GeoJSON Polygon or MultiPolygon.

High-level steps:
1) Create a GeoJSON file describing your routing coverage.
2) Save as RoutingAppCoverage.geojson.
3) Upload it in App Store Connect under App Information -> Routing App Coverage.

Placeholder (if needed later):
- File name: RoutingAppCoverage.geojson
- Coverage notes:
