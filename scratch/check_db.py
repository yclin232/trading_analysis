import sys
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.db.models import WatchlistGroup, WatchlistItem, StockMaster, MarketDailyPrice

db = SessionLocal()
print("Watchlist Groups:")
for g in db.query(WatchlistGroup).all():
    print(f"ID={g.id}, name={g.group_name}")

print("\nWatchlist Items:")
for item in db.query(WatchlistItem).all():
    stock = db.query(StockMaster).filter(StockMaster.stock_id == item.stock_id).first()
    price_count = db.query(MarketDailyPrice).filter(MarketDailyPrice.stock_id == item.stock_id).count()
    print(f"Group={item.group_id}, Stock={item.stock_id} ({stock.stock_name if stock else '?'}, {stock.market if stock else '?'}), DailyPrices={price_count}")
