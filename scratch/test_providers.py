import sys
sys.path.insert(0, r'c:\admin\stock_analysis\backend')
import requests
import json

headers = {"User-Agent": "Mozilla/5.0"}
url = "https://query1.finance.yahoo.com/v8/finance/chart/1303.TW?interval=1m&range=1d"
try:
    resp = requests.get(url, headers=headers, timeout=10)
    data = resp.json()
    result = data["chart"]["result"][0]
    meta = result["meta"]
    print("Yahoo Meta:", meta.get("regularMarketTime"), meta.get("regularMarketPrice"), meta.get("exchangeTimezoneName"))
    import datetime
    t = datetime.datetime.fromtimestamp(meta.get("regularMarketTime"), datetime.timezone.utc)
    print("Market time UTC:", t)
except Exception as e:
    print("Yahoo error:", e)

url_nstock = "https://shop.nstock.tw/api/v2/minute-stock-data/data?stock_id=1303"
try:
    resp2 = requests.get(url_nstock, headers=headers, timeout=10)
    data2 = resp2.json()
    print("NStock status:", resp2.status_code, "len:", len(str(data2)))
    if isinstance(data2, list) and data2:
        print("NStock latest item:", data2[-1])
    elif isinstance(data2, dict):
        print("NStock keys:", list(data2.keys()))
except Exception as e:
    print("NStock error:", e)
