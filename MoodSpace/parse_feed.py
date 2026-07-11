import sys, json

d = json.load(sys.stdin)
items = d.get('items', [])
print(f'Total items: {len(items)}')
# Show entity distribution
tmdb_entities = {}
for i in items:
    if i.get('provider') == 'tmdb' and i.get('id'):
        parts = i['id'].split(':')
        if len(parts) >= 2:
            key = parts[0] + ':' + parts[1]
            tmdb_entities[key] = tmdb_entities.get(key, 0) + 1
    print(f'  prov={i.get("provider","?")} id={str(i.get("id","?"))[:55]} title={i.get("title","?")[:42]}')
if tmdb_entities:
    print(f'\nTMDB entity distribution:')
    for k, v in sorted(tmdb_entities.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}')
