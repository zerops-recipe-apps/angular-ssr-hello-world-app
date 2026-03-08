import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { Pool } from 'pg';

import bootstrap from './src/main.server';
// Build-time constants inlined by esbuild from scripts/generate-build-env.js output.
import { BUILD_ENV } from './src/environments/build-env';

// Singleton connection pool — created once at server startup,
// shared across requests. Connects using Zerops env vars.
const pool = new Pool({
  host: process.env['DB_HOST'],
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  user: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Health check at GET / — intercepts before Angular's wildcard handler.
  // Returns HTTP 200 on success, 503 on DB failure — both render the UI
  // so the subdomain URL is immediately useful as a visual status page.
  server.get('/', async (_req, res) => {
    let dbStatus = 'Connected';
    let greeting = 'Hello from Zerops!';
    let httpStatus = 200;

    try {
      // Query the greetings table seeded by migrate.js at deploy time.
      // Proves DB connectivity AND that idempotent migrations ran correctly.
      const result = await pool.query<{ message: string }>(
        'SELECT message FROM greetings LIMIT 1'
      );
      if (result.rows.length > 0) {
        greeting = result.rows[0].message;
      }
    } catch (err) {
      dbStatus = `ERROR: ${(err as Error).message}`;
      httpStatus = 503;
    }

    const isOk = httpStatus === 200;
    const env = process.env['NODE_ENV'] ?? 'unknown';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Angular SSR &middot; Zerops Hello World</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f1117;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1a1d2e;
      border: 1px solid #2d3748;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    .logos {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .sep { color: #4a5568; font-size: 1.4rem; font-weight: 300; }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f7fafc;
      margin-bottom: 0.4rem;
      line-height: 1.3;
    }
    .subtitle {
      color: #718096;
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }
    .rows {
      border: 1px solid #2d3748;
      border-radius: 8px;
      overflow: hidden;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.1rem;
      border-bottom: 1px solid #2d3748;
    }
    .row:last-child { border-bottom: none; }
    .label {
      color: #718096;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .value {
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    }
    .ok  { color: #68d391; }
    .err { color: #fc8181; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logos">
      <!-- Angular logo (shield/A mark) -->
      <svg width="112" height="28" viewBox="0 0 112 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Angular">
        <path d="M13 1L1 5.5L3 20L13 25L23 20L25 5.5L13 1Z" fill="#DD0031"/>
        <path d="M13 1V25L23 20L25 5.5L13 1Z" fill="#C3002F"/>
        <path d="M13 5L7 20H9.5L11 16H15L16.5 20H19L13 5ZM13 9.5L14.5 14H11.5L13 9.5Z" fill="white"/>
        <text x="31" y="20" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="15" font-weight="700" fill="#e2e8f0">Angular</text>
      </svg>
      <span class="sep">&times;</span>
      <!-- Zerops logo (diamond shape) -->
      <svg width="90" height="28" viewBox="0 0 90 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Zerops">
        <polygon points="11,2 20,14 11,26 2,14" fill="#6C63FF"/>
        <text x="26" y="20" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="15" font-weight="700" fill="#e2e8f0">Zerops</text>
      </svg>
    </div>

    <h1>${escapeHtml(greeting)}</h1>
    <p class="subtitle">Angular running on Zerops SSR &ndash; Node.js at runtime.</p>

    <div class="rows">
      <div class="row">
        <span class="label">Framework</span>
        <span class="value">Angular ${escapeHtml(BUILD_ENV.version)}</span>
      </div>
      <div class="row">
        <span class="label">Environment</span>
        <span class="value">${escapeHtml(env)}</span>
      </div>
      <div class="row">
        <span class="label">Build time</span>
        <span class="value">${escapeHtml(BUILD_ENV.buildTime)}</span>
      </div>
      <div class="row">
        <span class="label">Database</span>
        <span class="value ${isOk ? 'ok' : 'err'}">${escapeHtml(dbStatus)}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.status(httpStatus).type('html').send(html);
  });

  // Serve static files from /browser (Angular client bundle)
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // All other routes use the Angular CommonEngine for SSR
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers['host']}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
