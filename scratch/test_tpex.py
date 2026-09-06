import sys
sys.path.insert(0, '.')
from datetime import date
from app.db.session import SessionLocal
from app.market.backfill import backfill_tpex_trading_stock

db = SessionLocal()
start_date = date(2026, 3, 1)
end_date = date(2026, 9, 3)
res = backfill_tpex_trading_stock(db=db, stock_id="4908", start_date=start_date, end_date=end_date)
print("TPEX Backfill result for 4908:")
print("Status:", res.get("status"))
print("Parsed:", res.get("parsed_count"))
print("Inserted:", res.get("inserted_count"))
print("Message:", res.get("message"))
if "months" in res:
    for m in res["months"]:
        print("Month:", m.get("month"), "Status:", m.get("status"), "Parsed:", m.get("parsed_count"), "Error:", m.get("error_message"))
