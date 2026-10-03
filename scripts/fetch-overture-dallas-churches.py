"""Download a free, research-only Dallas church candidate extract from Overture.

This script intentionally does not connect to Supabase. It queries the public
Overture Places release, keeps only records whose v2 taxonomy contains
``christian_place_of_worship``, and writes a small JSON input for the Node
classification step.

Run through the repository's PowerShell/npm wrapper so DuckDB is supplied in a
temporary environment instead of being installed into the FaithBid app.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import duckdb


DEFAULT_RELEASE = "2026-09-23.1"
DEFAULT_BBOX = (-97.05, 32.60, -96.45, 33.05)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--release", default=DEFAULT_RELEASE)
    parser.add_argument("--bbox", default=",".join(str(value) for value in DEFAULT_BBOX))
    parser.add_argument("--output", default="work/dallas-church-acquisition/overture-churches.json")
    return parser.parse_args()


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    values = tuple(float(item.strip()) for item in value.split(","))
    if len(values) != 4:
        raise ValueError("bbox must be west,south,east,north")
    west, south, east, north = values
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise ValueError("bbox coordinates are invalid")
    return values


def main() -> None:
    args = parse_args()
    west, south, east, north = parse_bbox(args.bbox)
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    parquet = (
        "s3://overturemaps-us-west-2/release/"
        f"{args.release}/theme=places/type=place/*.parquet"
    )
    connection = duckdb.connect()
    connection.execute("INSTALL httpfs")
    connection.execute("LOAD httpfs")
    connection.execute("SET s3_region='us-west-2'")

    rows = connection.execute(
        """
        select
          id,
          names.primary as name,
          names.common as alternate_names,
          operating_status,
          basic_category,
          taxonomy.primary as taxonomy_primary,
          taxonomy.hierarchy as taxonomy_hierarchy,
          confidence,
          websites,
          socials,
          emails,
          phones,
          addresses,
          bbox.xmin as longitude,
          bbox.ymin as latitude,
          sources
        from read_parquet(?)
        where bbox.xmax >= ? and bbox.xmin <= ?
          and bbox.ymax >= ? and bbox.ymin <= ?
          and list_contains(taxonomy.hierarchy, 'christian_place_of_worship')
        order by id
        """,
        [parquet, west, east, south, north],
    ).fetchall()
    columns = [description[0] for description in connection.description]
    records = [dict(zip(columns, row, strict=True)) for row in rows]

    document = {
        "source": "Overture Maps Places",
        "release": args.release,
        "schema_version": "2.0.0",
        "bbox": [west, south, east, north],
        "filter": "taxonomy.hierarchy contains christian_place_of_worship",
        "license": "CDLA Permissive 2.0",
        "allowed_purposes": ["research", "verification", "internal_analytics"],
        "records": records,
    }
    output.write_text(json.dumps(document, indent=2, default=str) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "records": len(records), "release": args.release}))


if __name__ == "__main__":
    main()
