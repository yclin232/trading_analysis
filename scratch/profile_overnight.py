import sys
sys.path.insert(0, r'c:\admin\stock_analysis\backend')
import time
from app.db.session import SessionLocal
from app.db.models import StockMaster
from app.market.overnight_impact import (
    _resolve_tw_mapping,
    _factor_weights_for_mapping,
    expected_us_daily_price_date,
    _factor_from_symbol,
    _basket_from_group,
    INDEX_FACTORS,
    scan_us_overnight_impact_gaps,
)
from app.market.adr_parity import build_adr_parity_report
from app.market.fx_flow_context import build_fx_flow_context
from app.market.cross_market.snapshot_store import read_cross_market_target_context

db = SessionLocal()
stock_id = '1303'
stock = db.query(StockMaster).filter(StockMaster.stock_id == stock_id).first()

t0 = time.time()
mapping = _resolve_tw_mapping(stock)
print(f"[{time.time()-t0:.3f}s] resolve mapping", flush=True)

t0 = time.time()
expected_trade_date = expected_us_daily_price_date()
print(f"[{time.time()-t0:.3f}s] expected_date: {expected_trade_date}", flush=True)

t0 = time.time()
factor_weights, basket_weights = _factor_weights_for_mapping(mapping)
print(f"Factor weights: {factor_weights}, Basket weights: {basket_weights}", flush=True)

for symbol, weight in factor_weights.items():
    st = time.time()
    spec = INDEX_FACTORS[symbol]
    _factor_from_symbol(
        db,
        symbol=symbol,
        label=spec["label"],
        role=spec["role"],
        weight=weight,
        score_cap=spec["score_cap"],
        source="us_daily_price",
        expected_trade_date=expected_trade_date,
    )
    print(f"  [{time.time()-st:.3f}s] factor {symbol}", flush=True)
print(f"[{time.time()-t0:.3f}s] factors total ({len(factor_weights)})", flush=True)

t0 = time.time()
basket_roles = {
    "ETF_科技": "technology_etf_basket",
    "半導體_GPU_ASIC": "semiconductor_basket",
    "半導體設備_量測": "semiconductor_equipment_basket",
    "晶圓製造_IDM": "foundry_basket",
    "記憶體_儲存": "memory_storage_basket",
}
for group_name, weight in basket_weights.items():
    st = time.time()
    _basket_from_group(
        db,
        group_name=group_name,
        role=basket_roles.get(group_name, "us_watchlist_basket"),
        weight=weight,
        expected_trade_date=expected_trade_date,
    )
    print(f"  [{time.time()-st:.3f}s] basket {group_name}", flush=True)
print(f"[{time.time()-t0:.3f}s] baskets total ({len(basket_weights)})", flush=True)

t0 = time.time()
adr_parity = build_adr_parity_report(
    db,
    stock_id,
    stock_name=stock.stock_name,
    expected_adr_trade_date=expected_trade_date,
)
print(f"[{time.time()-t0:.3f}s] adr_parity", flush=True)

t0 = time.time()
fx_flow_context = build_fx_flow_context(
    db,
    stock_id,
)
print(f"[{time.time()-t0:.3f}s] fx_flow_context", flush=True)

t0 = time.time()
cross_market_context = read_cross_market_target_context(
    db,
    stock_id,
    expected_adr_trade_date=expected_trade_date,
    adr_parity_payload=adr_parity,
    projection_mode="current",
)
print(f"[{time.time()-t0:.3f}s] cross_market_context", flush=True)

t0 = time.time()
cross_market_refresh_state = scan_us_overnight_impact_gaps(
    db,
    stock_id,
)
print(f"[{time.time()-t0:.3f}s] scan_us_overnight_impact_gaps", flush=True)
