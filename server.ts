import 'zone.js/node';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { Pool } from 'pg';

import { BUILD_ENV } from './src/environments/build-env';
import {
  dbBadgeClass,
  environmentBadgeClass,
  formatBuildTime,
} from './src/shared/status-page';

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

function getEnvironment(): string {
  return process.env['NODE_ENV'] || 'development';
}

async function getHealthData(): Promise<{
  greeting: string;
  dbStatus: string;
  httpStatus: number;
}> {
  let dbStatus = 'Connected';
  let greeting = 'Hello from Zerops!';
  let httpStatus = 200;

  try {
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

  return { greeting, dbStatus, httpStatus };
}

function renderStatusHtml(
  greeting: string,
  dbStatus: string,
  httpStatus: number
): string {
  const env = getEnvironment();
  const envClass = environmentBadgeClass(env);
  const dbClass = dbBadgeClass(dbStatus);
  const buildTime = formatBuildTime(BUILD_ENV.buildTime);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Angular SSR &middot; Zerops Hello World</title>
  <link rel="stylesheet" href="status-page.css" />
</head>
<body>
  <main class="page">
    <div class="glow glow-angular" aria-hidden="true"></div>
    <div class="glow glow-zerops" aria-hidden="true"></div>

    <article class="card">
      <header class="brand">
        <div class="logo-strip">
          <img src="angular-logo.webp" alt="Angular" class="logo logo-angular" />
          <span class="sep" aria-hidden="true"></span>
          <img src="zerops-logo.webp" alt="Zerops" class="logo logo-zerops" />
        </div>

        <h1>${escapeHtml(greeting)}</h1>
        <p class="subtitle">Angular SSR with Express and PostgreSQL at runtime.</p>
      </header>

      <dl class="stats">
        <div class="stat">
          <dt>Framework</dt>
          <dd>Angular ${escapeHtml(BUILD_ENV.version)}</dd>
        </div>
        <div class="stat">
          <dt>Environment</dt>
          <dd><span class="badge ${envClass}">${escapeHtml(env)}</span></dd>
        </div>
        <div class="stat">
          <dt>Build time</dt>
          <dd>${escapeHtml(buildTime)}</dd>
        </div>
        <div class="stat">
          <dt>Database</dt>
          <dd><span class="badge ${dbClass}">${escapeHtml(dbStatus)}</span></dd>
        </div>
      </dl>
    </article>
  </main>
</body>
</html>`;
}

function createApp(): express.Express {
  const server = express();
  const angularApp = new AngularNodeAppEngine();

  server.get('/api/status', async (_req, res) => {
    const { greeting, dbStatus, httpStatus } = await getHealthData();
    res.status(httpStatus).json({
      greeting,
      dbStatus,
      environment: getEnvironment(),
    });
  });

  // Health check at GET / — intercepts before Angular's catch-all handler.
  // Returns HTTP 200 on success, 503 on DB failure.
  server.get('/', async (_req, res) => {
    const { greeting, dbStatus, httpStatus } = await getHealthData();
    res.status(httpStatus).type('html').send(renderStatusHtml(greeting, dbStatus, httpStatus));
  });

  server.use('*', (req, res, next) => {
    angularApp
      .handle(req)
      .then((response) => {
        if (response) {
          void writeResponseToNodeResponse(response, res);
          return;
        }
        next();
      })
      .catch(next);
  });

  return server;
}

const app = createApp();

/** Request handler used by the Angular CLI dev server and SSR build. */
export const reqHandler = createNodeRequestHandler(app);

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}
