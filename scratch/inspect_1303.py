import sys
sys.path.insert(0, r'c:\admin\stock_analysis\backend')
from app.db.session import SessionLocal
from app.db.models import MarketDailyPrice, MarketIntradayBar, StockMaster
from sqlalchemy import text

db = SessionLocal()
stock_id = '1303'

# 1. Stock master
stock = db.query(StockMaster).filter(StockMaster.stock_id == stock_id).first()
print("Stock:", stock.stock_id, stock.stock_name, stock.market, stock.industry)

# 2. Latest 5 daily prices
prices = (
    db.query(MarketDailyPrice)
    .filter(MarketDailyPrice.stock_id == stock_id)
    .order_by(MarketDailyPrice.trade_date.desc(), MarketDailyPrice.id.desc())
    .limit(5)
    .all()
)
print("Latest 5 daily prices:")
for p in prices:
    print(f"  {p.trade_date}: O={p.open_price}, H={p.high_price}, L={p.low_price}, C={p.close_price}, V={p.trade_volume}")

# 3. Latest 5 intraday bars
intraday = (
    db.query(MarketIntradayBar)
    .filter(MarketIntradayBar.stock_id == stock_id)
    .order_by(MarketIntradayBar.bar_time.desc())
    .limit(5)
    .all()
)
print(f"Latest 5 intraday bars (total count: {db.query(MarketIntradayBar).filter(MarketIntradayBar.stock_id == stock_id).count()}):")
for b in intraday:
    print(f"  {b.bar_time}: O={b.open_price}, H={b.high_price}, L={b.low_price}, C={b.close_price}, V={b.trade_volume}")

# 4. Check all stocks max daily price date
max_date = db.execute(text("SELECT MAX(trade_date), COUNT(*) FROM market_daily_price")).fetchall()
print("All market daily price max date:", max_date)
