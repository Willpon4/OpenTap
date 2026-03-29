"""
OpenTap — OpenStreetMap Fountain Importer

Pulls all drinking water points from OSM using the Overpass API
and upserts them into the OpenTap database.

Usage:
    # Import all US fountains (this is a big query, may take minutes)
    python -m scripts.import_osm --country US

    # Import for a specific bounding box (faster, use for testing)
    python -m scripts.import_osm --bbox "-74.05,40.68,-73.90,40.82"

    # Import for a named city (uses Nominatim to get bbox)
    python -m scripts.import_osm --city "Portland, Oregon"
"""

import argparse
import json
import sys
import time
import httpx
from datetime import datetime, timezone

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Nominatim for geocoding city names to bounding boxes
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def build_overpass_query(bbox: str) -> str:
    """Build Overpass QL query for drinking water nodes in a bounding box.

    bbox format: "south,west,north,east" (Overpass convention)
    """
    return f"""
[out:json][timeout:120];
(
  node["amenity"="drinking_water"]({bbox});
  node["man_made"="water_tap"]({bbox});
  node["drinking_water"="yes"]["amenity"="fountain"]({bbox});
);
out body;
"""


def get_city_bbox(city_name: str) -> str:
    """Use Nominatim to get a bounding box for a city name.

    Returns bbox in Overpass format: "south,west,north,east"
    """
    print(f"Looking up bounding box for: {city_name}")
    resp = httpx.get(
        NOMINATIM_URL,
        params={"q": city_name, "format": "json", "limit": 1},
        headers={"User-Agent": "OpenTap/0.1 (civic water access platform)"},
    )
    resp.raise_for_status()
    results = resp.json()
    if not results:
        print(f"Could not find city: {city_name}")
        sys.exit(1)

    bb = results[0]["boundingbox"]  # [south, north, west, east]
    bbox = f"{bb[0]},{bb[2]},{bb[1]},{bb[3]}"
    print(f"  Bounding box: {bbox}")
    print(f"  Display name: {results[0].get('display_name', 'N/A')}")
    return bbox


def convert_bbox_format(bbox_str: str) -> str:
    """Convert from lng,lat,lng,lat (common) to south,west,north,east (Overpass).

    Input:  "min_lng,min_lat,max_lng,max_lat"
    Output: "min_lat,min_lng,max_lat,max_lng"
    """
    parts = [float(x.strip()) for x in bbox_str.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must have 4 comma-separated values")
    min_lng, min_lat, max_lng, max_lat = parts
    return f"{min_lat},{min_lng},{max_lat},{max_lng}"


def fetch_fountains(bbox: str) -> list[dict]:
    """Fetch fountain data from the Overpass API."""
    query = build_overpass_query(bbox)
    print(f"Querying Overpass API...")
    start = time.time()

    resp = httpx.post(OVERPASS_URL, data={"data": query}, timeout=180)
    resp.raise_for_status()
    data = resp.json()

    elements = data.get("elements", [])
    elapsed = time.time() - start
    print(f"  Found {len(elements)} water points in {elapsed:.1f}s")
    return elements


def classify_fountain_type(tags: dict) -> str:
    """Determine fountain type from OSM tags."""
    if tags.get("man_made") == "water_tap":
        return "tap"
    if tags.get("bottle") == "yes" or "bottle" in tags.get("fountain", ""):
        return "bottle_filler"
    if tags.get("amenity") == "drinking_water":
        return "fountain"
    return "other"


def process_elements(elements: list[dict]) -> list[dict]:
    """Convert raw Overpass elements to OpenTap fountain records."""
    fountains = []
    for el in elements:
        if el.get("type") != "node":
            continue
        tags = el.get("tags", {})
        fountain = {
            "osm_id": el["id"],
            "latitude": el["lat"],
            "longitude": el["lon"],
            "type": classify_fountain_type(tags),
            "source": "osm",
            "status": "unknown",  # we don't know condition from OSM data alone
            "metadata": {
                "osm_tags": tags,
                "imported_at": datetime.now(timezone.utc).isoformat(),
            },
        }
        fountains.append(fountain)
    return fountains


def generate_sql(fountains: list[dict], output_file: str = None) -> str:
    """Generate SQL INSERT statements for the fountain data.

    Uses ON CONFLICT to upsert based on osm_id, so re-running is safe.
    """
    if not fountains:
        return "-- No fountains to import"

    lines = [
        "-- OpenTap OSM Fountain Import",
        f"-- Generated: {datetime.now(timezone.utc).isoformat()}",
        f"-- Count: {len(fountains)}",
        "",
        "BEGIN;",
        "",
    ]

    for f in fountains:
        meta = json.dumps(f["metadata"]).replace("'", "''")
        lines.append(
            f"INSERT INTO fountains (id, location, source, osm_id, type, status, metadata, created_at, updated_at) "
            f"VALUES ("
            f"gen_random_uuid(), "
            f"ST_SetSRID(ST_MakePoint({f['longitude']}, {f['latitude']}), 4326), "
            f"'{f['source']}', "
            f"{f['osm_id']}, "
            f"'{f['type']}', "
            f"'{f['status']}', "
            f"'{meta}'::jsonb, "
            f"NOW(), NOW()"
            f") ON CONFLICT (osm_id) DO UPDATE SET "
            f"location = EXCLUDED.location, "
            f"type = EXCLUDED.type, "
            f"metadata = EXCLUDED.metadata, "
            f"updated_at = NOW();"
        )

    lines.extend(["", "COMMIT;", ""])
    sql = "\n".join(lines)

    if output_file:
        with open(output_file, "w") as out:
            out.write(sql)
        print(f"SQL written to: {output_file}")

    return sql


def main():
    parser = argparse.ArgumentParser(description="Import OSM fountain data for OpenTap")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--bbox", help='Bounding box: "min_lng,min_lat,max_lng,max_lat"')
    group.add_argument("--city", help='City name: "Portland, Oregon"')
    group.add_argument("--country", help="Country code: US, GB, DE, etc.")
    parser.add_argument("--output", "-o", help="Output SQL file path", default="import_osm.sql")
    parser.add_argument("--json", help="Also output raw JSON", action="store_true")

    args = parser.parse_args()

    # Determine bounding box
    if args.city:
        bbox = get_city_bbox(args.city)
    elif args.bbox:
        bbox = convert_bbox_format(args.bbox)
    elif args.country:
        # Use Nominatim to get country bbox
        bbox = get_city_bbox(args.country)

    # Fetch and process
    elements = fetch_fountains(bbox)
    fountains = process_elements(elements)

    if not fountains:
        print("No fountains found in this area.")
        sys.exit(0)

    # Output
    print(f"\nProcessed {len(fountains)} fountains:")
    type_counts = {}
    for f in fountains:
        type_counts[f["type"]] = type_counts.get(f["type"], 0) + 1
    for ftype, count in sorted(type_counts.items()):
        print(f"  {ftype}: {count}")

    sql = generate_sql(fountains, args.output)

    if args.json:
        json_path = args.output.replace(".sql", ".json")
        with open(json_path, "w") as out:
            json.dump(fountains, out, indent=2, default=str)
        print(f"JSON written to: {json_path}")

    print(f"\nTo import into your database:")
    print(f"  psql opentap < {args.output}")


if __name__ == "__main__":
    main()
