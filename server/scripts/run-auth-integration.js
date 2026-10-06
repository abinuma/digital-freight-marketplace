import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

if (!process.env.AUTH_INTEGRATION_DATABASE_URL) {
  console.error('Set AUTH_INTEGRATION_DATABASE_URL in server/.env to a dedicated test database before running this suite.');
  process.exit(1);
}

process.env.AUTH_INTEGRATION_TESTS = '1';
const vitestPath = resolve('node_modules/vitest/vitest.mjs');
const result = spawnSync(process.execPath, [vitestPath, 'run', 'tests/integration/auth.integration.test.js'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
