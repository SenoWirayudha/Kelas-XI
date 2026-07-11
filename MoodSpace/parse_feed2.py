import sys, json

d = json.load(sys.stdin)
items = d.get('items', [])
print(f'Total items: {len(items)}')
print(f'Query: {d.get("query")}')
print(f'Generated queries ({len(d.get("generatedQueries",[]))}):')
for q in d['generatedQueries']:
    print(f'  - {q}')
print(f'recentTags: {d.get("recentTags",[])}')
print(f'recentQueries: {d.get("recentQueries")}')
print(f'fallbackUsed: {d.get("fallbackUsed")}')
print(f'movieQuery: {d.get("movieQuery")}')
print()

if not items:
    print('NO ITEMS RETURNED')
    sys.exit(0)

tmdb_ents = {}
non_tmdb = 0
for i in items:
    pid = i.get('provider', i.get('source', '?'))
    ekey = None
    if pid == 'tmdb' and i.get('id'):
        parts = i['id'].split(':')
        if len(parts) >= 2:
            ekey = parts[0] + ':' + parts[1]
    clip = i.get('clipScore', '?')
    title = str(i.get('title', i.get('alt_description', '?')))[:55]
    print(f'  [{pid:>10}] clip={str(clip)[:6]:>6} title={title}')
    if ekey:
        tmdb_ents[ekey] = tmdb_ents.get(ekey, 0) + 1
    else:
        non_tmdb += 1

print()
if tmdb_ents:
    print(f'TMDB entities ({sum(tmdb_ents.values())} items):')
    for k, v in sorted(tmdb_ents.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}')
if non_tmdb:
    print(f'Non-TMDB (design/pool) items: {non_tmdb}')
print(f'\nTotal: {len(items)}')
