import { execFileSync } from 'node:child_process';

const DB_ID = 'museum_digital';
const READ_TEAM_PERM = 'read("team:museum-admins")';

function runCli(args, ignoreError = false) {
  const env = { ...process.env, PATH: `/home/aby/.local/bin:${process.env.PATH || ''}` };
  try {
    const out = execFileSync('appwrite', args, {
      cwd: '/home/aby/Antigravity_Project',
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(out);
  } catch (err) {
    if (ignoreError) return null;
    const msg = err?.stderr?.toString() || err?.message || String(err);
    throw new Error(`CLI failed (${args.slice(0, 3).join(' ')}): ${msg}`);
  }
}

async function waitForColumnsReady(tableId, expectedKeys) {
  for (let i = 0; i < 30; i++) {
    const tbl = runCli(['tablesdb', 'get-table', '--database-id', DB_ID, '--table-id', tableId, '--json']);
    const cols = tbl.columns || [];
    const ready = expectedKeys.every((k) => cols.find((c) => c.key === k && c.status === 'available'));
    if (ready) return;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Timeout waiting for columns on ${tableId}`);
}

const TABLES = [
  {
    id: 'visitor_sessions',
    name: 'Visitor Sessions',
    columns: [
      { kind: 'string', key: 'sessionId', size: 64, required: true },
      { kind: 'string', key: 'currentPath', size: 180, required: true },
      { kind: 'string', key: 'pageTitle', size: 160, required: false },
      { kind: 'string', key: 'referrerCategory', size: 24, required: true },
      { kind: 'string', key: 'deviceCategory', size: 16, required: true },
      { kind: 'datetime', key: 'lastSeenAt', required: true },
      { kind: 'string', key: 'startedDate', size: 10, required: true },
      { kind: 'integer', key: 'pageViewsCount', required: true, min: 0 },
    ],
    indexes: [
      { key: 'idx_vs_session', type: 'unique', columns: ['sessionId'], orders: ['ASC'] },
      { key: 'idx_vs_lastseen', type: 'key', columns: ['lastSeenAt'], orders: ['DESC'] },
      { key: 'idx_vs_date', type: 'key', columns: ['startedDate'], orders: ['DESC'] },
    ],
  },
  {
    id: 'visitor_daily_stats',
    name: 'Visitor Daily Stats',
    columns: [
      { kind: 'string', key: 'dateKey', size: 10, required: true },
      { kind: 'integer', key: 'uniqueVisitors', required: true, min: 0 },
      { kind: 'integer', key: 'pageViews', required: true, min: 0 },
      { kind: 'integer', key: 'mobileViews', required: false, min: 0, xdefault: 0 },
      { kind: 'integer', key: 'desktopViews', required: false, min: 0, xdefault: 0 },
    ],
    indexes: [
      { key: 'idx_vds_date', type: 'unique', columns: ['dateKey'], orders: ['DESC'] },
    ],
  },
  {
    id: 'visitor_page_stats',
    name: 'Visitor Page Stats',
    columns: [
      { kind: 'string', key: 'pageKey', size: 180, required: true },
      { kind: 'string', key: 'contentType', size: 24, required: true },
      { kind: 'string', key: 'slug', size: 128, required: false },
      { kind: 'string', key: 'titleHint', size: 160, required: false },
      { kind: 'integer', key: 'pageViews', required: true, min: 0 },
      { kind: 'datetime', key: 'lastViewedAt', required: true },
    ],
    indexes: [
      { key: 'idx_vps_pagekey', type: 'unique', columns: ['pageKey'], orders: ['ASC'] },
      { key: 'idx_vps_views', type: 'key', columns: ['pageViews'], orders: ['DESC'] },
    ],
  },
];

async function migrateUp() {
  for (const tbl of TABLES) {
    const existing = runCli(['tablesdb', 'get-table', '--database-id', DB_ID, '--table-id', tbl.id, '--json'], true);
    if (!existing) {
      runCli([
        'tablesdb', 'create-table',
        '--database-id', DB_ID,
        '--table-id', tbl.id,
        '--name', tbl.name,
        '--enabled',
        '--permissions', READ_TEAM_PERM,
        '--json',
      ]);
      console.log(`Created table: ${tbl.id}`);
    } else {
      console.log(`Table exists: ${tbl.id}`);
    }

    const current = runCli(['tablesdb', 'get-table', '--database-id', DB_ID, '--table-id', tbl.id, '--json']);
    const existingColKeys = new Set((current.columns || []).map((c) => c.key));

    for (const col of tbl.columns) {
      if (existingColKeys.has(col.key)) continue;
      if (col.kind === 'string') {
        const args = [
          'tablesdb', 'create-string-column',
          '--database-id', DB_ID, '--table-id', tbl.id,
          '--key', col.key, '--size', String(col.size),
          col.required ? '--required' : '--required=false',
          '--json',
        ];
        runCli(args);
      } else if (col.kind === 'integer') {
        const args = [
          'tablesdb', 'create-integer-column',
          '--database-id', DB_ID, '--table-id', tbl.id,
          '--key', col.key,
          col.required ? '--required' : '--required=false',
          '--json',
        ];
        if (typeof col.min === 'number') args.push('--min', String(col.min));
        if (!col.required && typeof col.xdefault === 'number') args.push('--xdefault', String(col.xdefault));
        runCli(args);
      } else if (col.kind === 'datetime') {
        runCli([
          'tablesdb', 'create-datetime-column',
          '--database-id', DB_ID, '--table-id', tbl.id,
          '--key', col.key,
          col.required ? '--required' : '--required=false',
          '--json',
        ]);
      }
      console.log(`  + column ${tbl.id}.${col.key}`);
    }

    await waitForColumnsReady(tbl.id, tbl.columns.map((c) => c.key));

    const refreshed = runCli(['tablesdb', 'get-table', '--database-id', DB_ID, '--table-id', tbl.id, '--json']);
    const existingIdxKeys = new Set((refreshed.indexes || []).map((ix) => ix.key));
    for (const idx of tbl.indexes) {
      if (existingIdxKeys.has(idx.key)) continue;
      const args = [
        'tablesdb', 'create-index',
        '--database-id', DB_ID, '--table-id', tbl.id,
        '--key', idx.key, '--type', idx.type,
        '--json',
      ];
      for (const c of idx.columns) args.push('--columns', c);
      for (const o of idx.orders || []) args.push('--orders', o);
      runCli(args);
      console.log(`  + index ${tbl.id}.${idx.key}`);
    }
  }
}

async function migrateDown() {
  for (const tbl of [...TABLES].reverse()) {
    const existing = runCli(['tablesdb', 'get-table', '--database-id', DB_ID, '--table-id', tbl.id, '--json'], true);
    if (existing) {
      runCli(['tablesdb', 'delete-table', '--database-id', DB_ID, '--table-id', tbl.id, '--json']);
      console.log(`Deleted table: ${tbl.id}`);
    }
  }
}

const cmd = process.argv[2] || 'up';
if (cmd === 'up') migrateUp();
else if (cmd === 'down') migrateDown();
else {
  console.error('Usage: node scripts/analytics_migration.mjs [up|down]');
  process.exit(1);
}
