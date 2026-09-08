# angular-ssr-hello-world-app

Angular 22 SSR app with Express server and PostgreSQL on Zerops nodejs@24, using `@angular/ssr` and a build-time environment generator.

## Zerops service facts

- HTTP port: dev `4000` (`npm start` / `ng serve`) / prod `4000` (Node runtime)
- Siblings: `db` (PostgreSQL) — env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Runtime base: dev `nodejs@24` / prod `nodejs@24`

## Zerops dev

`setup: dev` idles on `zsc noop --silent`; the agent starts the dev server.

- Dev command: `npm start`
- In-container rebuild without deploy: `npm run build`

**All platform operations (start/stop/status/logs of the dev server, deploy, env / scaling / storage / domains) go through the Zerops development workflow via `zcp` MCP tools. Don't shell out to `zcli`.**

## Notes

- Prod build uses `npm ci --include=dev` — Zerops sets `NODE_ENV=production`, which omits devDependencies (`@angular/cli`, TypeScript) unless explicitly included.
- Angular SSR is NOT self-contained — `node_modules` is deployed alongside `dist/` for Express/pg at runtime.
- Default Angular SSR port is `4000` (not 3000); `PORT: 4000` is set explicitly in envVariables.
- `scripts/generate-build-env.js` writes `src/environments/build-env.ts` at build time; esbuild inlines it into `server.mjs`.
- `server.ts` handles GET `/` directly (health + DB status); Angular `CommonEngine` handles all other routes.
- Static assets (favicon) live in `public/` and are copied to the build output by the Angular CLI.
