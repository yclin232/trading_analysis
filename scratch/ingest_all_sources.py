from __future__ import annotations

import sys
import os
import traceback
from pathlib import Path
from datetime import datetime, timezone

backend_path = Path("c:/admin/stock_analysis/backend").resolve()
sys.path.insert(0, str(backend_path))

from app.db.session import SessionLocal
from app.db.models import SourceRegistry, MarketDailyPrice, StockMaster
from app.pipelines.fetch_pipeline import refresh_source
from app.sources import service as source_service

def ingest_all_sources():
    sys.stdout.reconfigure(line_buffering=True)
    db = SessionLocal()
    try:
        sources = db.query(SourceRegistry).filter(SourceRegistry.enabled.is_(True)).order_by(SourceRegistry.priority).all()
        print(f"Total enabled sources to ingest: {len(sources)}\n", flush=True)
        
        results = []
        for s in sources:
            print(f"[{s.id}] Ingesting '{s.source_name}' (Category: {s.category}, Parser: {s.parser_type})...", flush=True)
            print(f"     Endpoint: {s.endpoint_url}", flush=True)
            try:
                res = refresh_source(db, s.id)
                fetch_status = res.get("fetch_status")
                parse_status = res.get("parse_status")
                parsed_count = res.get("parsed_count")
                error_message = res.get("error_message")
                
                print(f"     Result: fetch={fetch_status}, parse={parse_status}, parsed_count={parsed_count}, error={error_message}", flush=True)
                results.append({
                    "id": s.id,
                    "name": s.source_name,
                    "fetch_status": fetch_status,
                    "parse_status": parse_status,
                    "parsed_count": parsed_count,
                    "error_message": error_message,
                    "success": fetch_status == "success" and parse_status == "success"
                })
            except Exception as exc:
                print(f"     EXCEPTION: {exc}", flush=True)
                traceback.print_exc()
                results.append({
                    "id": s.id,
                    "name": s.source_name,
                    "fetch_status": "exception",
                    "parse_status": "exception",
                    "parsed_count": 0,
                    "error_message": str(exc),
                    "success": False
                })
            print("-" * 70, flush=True)
            
        print("\n" + "=" * 70, flush=True)
        print("INGESTION SUMMARY", flush=True)
        print("=" * 70, flush=True)
        for r in results:
            status_tag = "OK" if r["success"] else "FAIL"
            print(f"[{status_tag}] Source {r['id']} ({r['name']}): count={r['parsed_count']}, error={r['error_message']}", flush=True)
            
    finally:
        db.close()

if __name__ == "__main__":
    ingest_all_sources()
