import sys
sys.path.insert(0, '.')
from datetime import date
from app.db.session import SessionLocal
from app.db.models import (
    StockMaster,
    MarketDailyPrice,
    WatchlistGroup,
    WatchlistItem,
    PortfolioHolding,
)
from app.watchlists.backfill_service import _backfill_stock_by_market, _get_stock_market
from app.market.technical_report import build_stock_technical_report

db = SessionLocal()

# Collect all unique symbols from watchlists and portfolio
symbols = set()
for item in db.query(WatchlistItem).all():
    symbols.add(item.stock_id)
for h in db.query(PortfolioHolding).all():
    symbols.add(h.symbol)

start_date = date(2026, 1, 1)
end_date = date(2026, 9, 3)

print(f"Starting comprehensive backfill for {len(symbols)} symbols from {start_date} to {end_date}...")

for idx, symbol in enumerate(sorted(symbols), 1):
    market = _get_stock_market(db, symbol)
    stock = db.query(StockMaster).filter(StockMaster.stock_id == symbol).first()
    stock_name = stock.stock_name if stock else "Unknown"
    
    print(f"[{idx}/{len(symbols)}] Backfilling {symbol} ({stock_name}, market={market})...")
    res = _backfill_stock_by_market(
        db=db,
        stock_id=symbol,
        market=market,
        start_date=start_date,
        end_date=end_date,
        twse_source_id=None,
        tpex_source_id=None,
        sleep_seconds=0.5,
        skip_existing_months=True,
    )
    status = res.get("status")
    inserted = res.get("inserted_count", 0)
    parsed = res.get("parsed_count", 0)
    print(f" -> Result: status={status}, parsed={parsed}, inserted={inserted}")

print("\n--- Verifying Technical Analysis Reports for all stocks ---")
for symbol in sorted(symbols):
    stock = db.query(StockMaster).filter(StockMaster.stock_id == symbol).first()
    stock_name = stock.stock_name if stock else "Unknown"
    price_count = db.query(MarketDailyPrice).filter(MarketDailyPrice.stock_id == symbol).count()
    try:
        report = build_stock_technical_report(db=db, stock_id=symbol)
        state = report.get("data", {}).get("current_state", {})
        headline = state.get("headline", {}).get("label") or report.get("title")
        summary = state.get("summary") or report.get("summary")
        pos_label = state.get("position", {}).get("label")
        order_label = state.get("position", {}).get("order_label")
        print(f"Stock {symbol:5} ({stock_name}): Prices={price_count} rows | Status={headline} | Summary={summary} | Order={order_label}")
    except Exception as e:
        print(f"Stock {symbol:5} ({stock_name}): Prices={price_count} rows | Error: {e}")

print("\nBackfill and verification completed successfully!")
