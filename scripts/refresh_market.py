"""Cache TCGCSV prices server-side; no API credentials or customer-side feed requests."""
import concurrent.futures, datetime as dt, json, pathlib, re, threading, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'market-catalog.json'
BASE = 'https://tcgcsv.com'
UA = 'CardHunter/3.0 (github.com/Rhebert0505/Card-hunter)'
GAMES = {1: 'Magic', 3: 'Pokémon', 68: 'One Piece', 71: 'Lorcana'}
LOCK = threading.Lock()
NEXT = 0.0
SEALED = re.compile(r'\b(booster|elite trainer|collection|bundle|blister|tin|display|starter|deck|gift|trove|premium|box|pack)\b', re.I)
ACCESSORY = re.compile(r'\b(sleeves?|playmat|deck box|binder|divider|code card|online code|empty|storage)\b', re.I)

def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def get(path, raw=False):
    global NEXT
    for attempt in range(3):
        with LOCK:
            pause = max(0, NEXT - time.monotonic())
            time.sleep(pause)
            NEXT = time.monotonic() + .12
        try:
            req = urllib.request.Request(BASE + path, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as response:
                data = response.read().decode()
            if raw:
                return data.strip()
            body = json.loads(data)
            if not body.get('success'):
                raise ValueError('Feed returned success=false')
            return body['results']
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

def rows_for(game, group, products, prices, source_date):
    by_id = {}
    for price in prices:
        by_id.setdefault(price['productId'], []).append(price)
    sealed, cards = [], []
    for p in products:
        extra = {x['name'].lower(): x.get('value', '') for x in p.get('extendedData', [])}
        number = extra.get('number', '')
        name = p['name']
        is_sealed = not number and bool(SEALED.search(name)) and not ACCESSORY.search(name)
        is_card = bool(number or extra.get('cardtype') or extra.get('card type'))
        if not is_sealed and not is_card:
            continue
        for price in by_id.get(p['productId'], []):
            market = price.get('marketPrice')
            if not isinstance(market, (int, float)) or market <= 0:
                continue
            row = dict(id=f"{p['productId']}:{price['subTypeName']}", groupId=group['groupId'],
                       game=game, set=group['name'], name=name, number=number,
                       variant=price['subTypeName'], kind='sealed' if is_sealed else 'card',
                       market=market, url=p.get('url', ''), image=p.get('imageUrl', ''), date=source_date)
            (sealed if is_sealed else cards).append(row)
    # Top five distinct cards, retaining the priced variant for each leader.
    leaders, seen = [], set()
    for row in sorted(cards, key=lambda x: x['market'], reverse=True):
        product_id = row['id'].split(':')[0]
        if product_id not in seen:
            leaders.append(row)
            seen.add(product_id)
        if len(leaders) == 5:
            break
    return sealed + leaders

def refresh():
    prior = json.loads(OUT.read_text()) if OUT.exists() else {}
    started = now()
    try:
        stamp = get('/last-updated.txt', raw=True)
        source_date = dt.datetime.strptime(stamp, '%Y-%m-%dT%H:%M:%S%z').isoformat()
        if prior.get('sourceUpdatedAt') == source_date and prior.get('complete'):
            prior['lastCheckedAt'] = started
            OUT.write_text(json.dumps(prior, ensure_ascii=False, separators=(',', ':')) + '\n')
            print('Source unchanged; recorded a successful freshness check without redating prices.')
            return
        categories = {x['categoryId']: x['name'] for x in get('/tcgplayer/categories')}
        groups, coverage = [], {}
        for category, game in GAMES.items():
            if category not in categories:
                raise ValueError(f'Missing category {category}')
            found = get(f'/tcgplayer/{category}/groups')
            print(game, categories[category], len(found), 'sets', flush=True)
            coverage[game] = len(found)
            groups.extend((category, game, group) for group in found)
        def fetch_group(item):
            category, game, group = item
            path = f"/tcgplayer/{category}/{group['groupId']}"
            try:
                rows = rows_for(game, group, get(path + '/products'), get(path + '/prices'), source_date)
                return rows, None
            except Exception as exc:
                kept = [r for r in prior.get('products', []) if r['game'] == game and r['groupId'] == group['groupId']]
                return kept, f"{game}/{group['groupId']}: {type(exc).__name__}"
        rows, errors = [], []
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for count, (batch, error) in enumerate(pool.map(fetch_group, groups), 1):
                rows.extend(batch)
                if error:
                    errors.append(error)
                if count % 50 == 0:
                    print(f'{count}/{len(groups)} sets checked; {len(rows)} entries; {len(errors)} errors', flush=True)
        if not rows:
            raise ValueError('No priced products; refusing to overwrite prior data')
        result = dict(version=1, generatedAt=now(), sourceUpdatedAt=source_date, lastAttemptAt=started,
                      complete=not errors, coverage=coverage, errors=errors, source='TCGCSV / TCGplayer',
                      scope='Sealed products and five highest-priced distinct cards per set; four TCGs. Sports not covered.',
                      products=sorted(rows, key=lambda r: (r['game'], r['set'], r['name'], r['variant'])))
        OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
        print(f'Saved {len(rows)} products, {len(errors)} errors, source {source_date}', flush=True)
    except Exception as exc:
        # Retain prior prices and their actual dates, and disclose the failed attempt.
        prior.update(lastAttemptAt=started, refreshError=type(exc).__name__ + ': ' + str(exc), complete=False)
        OUT.write_text(json.dumps(prior, ensure_ascii=False, separators=(',', ':')) + '\n')
        raise

if __name__ == '__main__':
    refresh()
