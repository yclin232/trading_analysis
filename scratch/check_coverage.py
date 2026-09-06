import sys
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.db.models import (
    StockMaster,
    MarketDailyPrice,
    InstitutionalTradeDaily,
    MarginTradingDaily,
    MonthlyRevenue,
    ShareholdingDistributionWeekly,
    FinancialMetricQuarterly,
    WatchlistGroup,
    WatchlistItem,
    PortfolioHolding,
)

db = SessionLocal()

# Collect all distinct stock symbols in watchlists and portfolio
symbols = set()
for item in db.query(WatchlistItem).all():
    symbols.add(item.stock_id)
for h in db.query(PortfolioHolding).all():
    symbols.add(h.symbol)

print(f"Total unique symbols to check: {len(symbols)} -> {sorted(symbols)}")

for s in sorted(symbols):
    stock = db.query(StockMaster).filter(StockMaster.stock_id == s).first()
    mkt = stock.market if stock else '?'
    name = stock.stock_name if stock else '?'
    daily_cnt = db.query(MarketDailyPrice).filter(MarketDailyPrice.stock_id == s).count()
    inst_cnt = db.query(InstitutionalTradeDaily).filter(InstitutionalTradeDaily.stock_id == s).count()
    margin_cnt = db.query(MarginTradingDaily).filter(MarginTradingDaily.stock_id == s).count()
    rev_cnt = db.query(MonthlyRevenue).filter(MonthlyRevenue.stock_id == s).count()
    share_cnt = db.query(ShareholdingDistributionWeekly).filter(ShareholdingDistributionWeekly.stock_id == s).count()
    print(f"Symbol {s:5} ({name}, {mkt}): DailyPrice={daily_cnt}, Inst={inst_cnt}, Margin={margin_cnt}, Rev={rev_cnt}, Shareholding={share_cnt}")
