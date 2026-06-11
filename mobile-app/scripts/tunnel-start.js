#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * tunnel-start.js
 *
 * 1. Opens a localtunnel to localhost:8080
 * 2. Writes EXPO_PUBLIC_API_URL into mobile-app/.env with the tunnel URL
 * 3. Spawns `expo start` (pass extra flags after --: `node tunnel-start.js -- --clear`)
 *
 * Usage:
 *   npm run tunnel          → expo start
 *   npm run tunnel -- --clear  → expo start --clear
 */

const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const BACKEND_PORT = 8080;
const ENV_FILE = path.resolve(__dirname, '..', '.env');

// Extra args forwarded to expo start (everything after --)
const extraArgs = process.argv.slice(2);

async function main() {
  console.log(`\n🚇  Opening localtunnel → localhost:${BACKEND_PORT} …`);

  let tunnel;
  try {
    tunnel = await localtunnel({ port: BACKEND_PORT });
  } catch (err) {
    console.error('❌  Failed to open tunnel:', err.message);
    process.exit(1);
  }

  const tunnelUrl = tunnel.url;
  console.log(`✅  Tunnel active: ${tunnelUrl}`);

  // ── Patch .env ────────────────────────────────────────────────────────────
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  }

  const apiUrlLine = `EXPO_PUBLIC_API_URL=${tunnelUrl}/api/v1`;

  if (/^EXPO_PUBLIC_API_URL=.*/m.test(envContent)) {
    envContent = envContent.replace(/^EXPO_PUBLIC_API_URL=.*/m, apiUrlLine);
  } else {
    envContent += `\n${apiUrlLine}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  console.log(`📝  .env updated → ${apiUrlLine}`);

  // ── Start Expo ────────────────────────────────────────────────────────────
  console.log(`\n🚀  Starting Expo …\n`);
  const expo = spawn(
    'npx',
    ['expo', 'start', '--tunnel', ...extraArgs],
    {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        EXPO_PUBLIC_API_URL: `${tunnelUrl}/api/v1`,
      },
    }
  );

  // ── Tunnel event handlers ─────────────────────────────────────────────────
  tunnel.on('close', () => {
    console.warn('\n⚠️   Tunnel closed. Requests from the device will fail until restarted.');
  });

  tunnel.on('error', (err) => {
    console.error('\n❌  Tunnel error:', err.message);
  });

  // ── Cleanup on exit ───────────────────────────────────────────────────────
  const shutdown = () => {
    console.log('\n🛑  Closing tunnel …');
    tunnel.close();
    expo.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  expo.on('close', (code) => {
    console.log(`\nExpo exited (code ${code}). Closing tunnel …`);
    tunnel.close();
    process.exit(code ?? 0);
  });
}

main();
