# angular-ssr-hello-world-app

Angular 19 SSR app with Express server and PostgreSQL on Zerops nodejs@22, using `@angular/ssr` and a build-time environment generator.

## Zerops service facts

- HTTP port: `4000`
- Siblings: `db` (PostgreSQL) — env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Runtime base: `nodejs@22`

## Zerops dev

`setup: dev` idles on `zsc noop --silent`; the agent starts the dev server.

- Dev command: `npm start`
- In-container rebuild without deploy: `npx ng build`

**All platform operations (start/stop/status/logs of the dev server, deploy, env / scaling / storage / domains) go through the Zerops development workflow via `zcp` MCP tools. Don't shell out to `zcli`.**

## Notes

- Angular SSR is NOT self-contained — `node_modules` is deployed alongside `dist/` for Express/pg at runtime.
- Default Angular SSR port is `4000` (not 3000); `PORT: 4000` is set explicitly in envVariables.
- `scripts/generate-build-env.js` writes `src/environments/build-env.ts` at build time; esbuild inlines it into `server.mjs`.
- `server.ts` handles GET `/` directly (health + DB status); Angular `CommonEngine` handles all other routes.
