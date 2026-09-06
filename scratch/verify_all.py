import sys
sys.path.insert(0, r'c:\admin\stock_analysis\backend')
from app.db.session import SessionLocal
from app.market.intraday import get_intraday_trend
from app.market.overnight_impact import build_us_overnight_impact_report
from app.market.next_session_plan import build_tw_stock_next_session_plan
import time

db = SessionLocal()
stock_id = '1303'

print("=== 1. Testing Overnight Impact ===")
t0 = time.time()
report = build_us_overnight_impact_report(db, stock_id, suppress_stale_signal=True)
print(f"Time: {time.time()-t0:.3f}s")
print(f"Stance: {report.get('stance')}, Score: {report.get('score')}, Title: {report.get('title')}")
print(f"Factors count: {len(report.get('factors') or [])}")

print("\n=== 2. Testing Intraday Trend ===")
t0 = time.time()
trend = get_intraday_trend(db, stock_id)
print(f"Time: {time.time()-t0:.3f}s")
print(f"Points count: {len(trend.get('points') or [])}")
if trend.get('points'):
    print(f"First point: {trend['points'][0]}")
    print(f"Last point: {trend['points'][-1]}")

print("\n=== 3. Testing Next Session Plan ===")
t0 = time.time()
plan = build_tw_stock_next_session_plan(db=db, stock_id=stock_id)
print(f"Time: {time.time()-t0:.3f}s")
print(f"Status: {plan.get('status')}")
print(f"Target Session State: {plan.get('target_session_state')}")
print(f"Warnings: {plan.get('warnings')}")
print(f"Levels: {plan.get('levels')}")
