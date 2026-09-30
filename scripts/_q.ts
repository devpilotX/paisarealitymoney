import { buildScriptPool } from './lib/script-pool';
(async () => { const pool = buildScriptPool(); try { for (const sql of process.argv.slice(2)) { const r = await pool.query(sql); console.table(r.rows); } } finally { await pool.end(); } })().catch((e) => { console.error(e.message); process.exit(1); });
