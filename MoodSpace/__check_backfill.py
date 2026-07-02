import subprocess, json
result = subprocess.run([
    'node', '-e',
    'import { query } from "./backend/src/db/pool.js"; '
    'const r = await query("select count(*)::int as total, count(*) filter (where text_embedding is null)::int as null_count, count(*) filter (where text_embedding is not null)::int as filled_count from posts where status = \'published\'"); '
    'console.log(JSON.stringify(r.rows[0]))'
], capture_output=True, text=True, cwd='D:/Kelas-XI/MoodSpace')
print(result.stdout)
if result.stderr:
    print('STDERR:', result.stderr[:200])
