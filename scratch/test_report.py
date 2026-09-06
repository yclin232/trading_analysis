import sys, json
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.market.technical_report import build_stock_technical_report

db = SessionLocal()
report = build_stock_technical_report(db=db, stock_id="1303")
print("Report headline:", report.get("title"), report.get("summary"))
print("Current state:", json.dumps(report.get("data", {}).get("current_state", {}), ensure_ascii=False, indent=2))
