#!/usr/bin/env python3
"""Best Buy store availability poller. Uses official API; no fabricated quantities."""
import json, os, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WATCH = ROOT / "inventory-watchlist.json"
OUT = ROOT / "public" / "inventory-feed.json"

def run():
    watch = json.loads(WATCH.read_text())
    key = os.environ.get("BESTBUY_API_KEY", "").strip()
    if not key:
        print("BESTBUY_API_KEY not configured; keeping existing feed unchanged.")
        return
    previous = json.loads(OUT.read_text()) if OUT.exists() else {}
    reports = []
    errors = []
    for item in watch.get("bestbuy", []):
        sku = str(item.get("sku", "")).strip()
        zip_code = str(item.get("zip", "77058")).strip()
        if not sku.isdigit() or len(zip_code) != 5 or not zip_code.isdigit():
            errors.append("Invalid SKU or ZIP in watchlist")
            continue
        url = ("https://api.bestbuy.com/v1/products/" + sku + "/stores.json?" +
               urllib.parse.urlencode({"postalCode": zip_code, "apiKey": key, "format": "json"}))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CardHunterInventory/1.0"})
            with urllib.request.urlopen(req, timeout=20) as response:
                data = json.load(response)
            now = datetime.now(timezone.utc).isoformat()
            for store in data.get("stores", []):
                reports.append({
                    "retailer": "Best Buy", "sku": sku,
                    "product": item.get("product", "SKU " + sku),
                    "store": store.get("name") or "Best Buy store",
                    "storeId": str(store.get("storeId", "")),
                    "city": store.get("city", ""),
                    "postalCode": store.get("postalCode", ""),
                    "availability": "reported_available",
                    "quantity": None, "source": "Best Buy official Products/Stores API",
                    "checkedAt": now,
                    "channel": "store"
                })
        except Exception as exc:
            errors.append("Best Buy SKU " + sku + ": " + type(exc).__name__)
    if errors:
        print("; ".join(errors))
        # Do not replace a valid previous feed with incomplete results.
        return
    OUT.write_text(json.dumps({"schemaVersion": 1, "generatedAt": datetime.now(timezone.utc).isoformat(),
        "reports": reports, "source": "Best Buy official API", "watchedProducts": len(watch.get("bestbuy", []))}, indent=2) + "\n")
    print("Wrote", len(reports), "store availability records")

if __name__ == "__main__":
    run()
