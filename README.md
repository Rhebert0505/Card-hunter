# Card Hunter

Card Hunter deploys only to the existing `summer-glitter-5d84` Worker:
https://summer-glitter-5d84.roberthebert.workers.dev/

## Check a Find
Search by product, set, packaging or card number, then deliberately select the exact catalogue product and variant. Enter the quantity of identical items and their total asking price. The app calculates a price per item and compares it with that product's market reference. Its 90% planning target is a heuristic, not expected profit or a guarantee. Pack, box, language, edition and card condition must match. A price older than 48 hours, an unavailable price or no exact selection produces **Needs research**.

Optional photos are device-only notes, not automatic identification. Finds and photos save in this browser's localStorage, not a user account, and can be lost when browser data is cleared. Rechecking a saved find uses the latest catalogue reference.

## Daily prices
`scripts/refresh_market.py` caches TCGCSV's TCGplayer product and price data server-side. Covers all available groups in the four selected TCG categories: Pokémon, One Piece, Lorcana and Magic. Includes identifiable sealed products and the five highest-priced distinct cards per set (priced variants retained). This is not a catalogue of every single card, sports cards, accessories, or all languages. No stock availability is inferred from prices. The original `products.json` remains an unverified historic tracker snapshot; the UI now uses the dated market catalogue instead.

The source publishes roughly daily around 20:00 UTC. `refresh-data.yml` is scheduled daily at **21:17 UTC** (3:17 PM CST / 4:17 PM CDT) and can also be run manually. GitHub schedules can be delayed; source age is displayed in the app. The script requests only when the feed timestamp changes, rate-limits requests, uses a custom user agent, joins prices by product ID and variant, and retains previous per-product dates on partial failures. Complete failures retain previous prices and record an error notice. Prices can mix raw conditions and exclude tax, shipping and selling fees. Source documentation: https://tcgcsv.com/docs

The refresh workflow commits the generated `public/market-catalog.json` and explicitly deploys it. This is required because a commit made with GITHUB_TOKEN does not start another push workflow. The separate existing `deploy.yml` deploys source commits to main automatically. Both share a concurrency group and verify the exact Worker target before deploying. They use the existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets; no secret is in source. Neither workflow targets TIFMAS.

The daily Google Sheet research task is independent; this app has its own real scheduled data pipeline and does not read the Sheet.

## Checks
`node --test tests/find.test.cjs`
`python -m unittest discover -s tests`
`node --check public/app.js`

Preview: `python -m http.server 8000 --directory public`
