# Angular SSR Hello World Recipe App

<!-- #ZEROPS_EXTRACT_START:intro# -->
A server-side rendered [Angular](https://angular.dev) application using `@angular/ssr` and Express, connected to a PostgreSQL database. Demonstrates idempotent migrations, dynamic health check data queried from the database, and Angular's SSR pipeline on a Node.js runtime.
Used within [Angular SSR Hello World recipe](https://app.zerops.io/recipes/angular-ssr-hello-world) for [Zerops](https://zerops.io) platform.
<!-- #ZEROPS_EXTRACT_END:intro# -->

⬇️ **Full recipe page and deploy with one-click**

[![Deploy on Zerops](https://github.com/zeropsio/recipe-shared-assets/blob/main/deploy-button/light/deploy-button.svg)](https://app.zerops.io/recipes/angular-ssr-hello-world?environment=small-production)

![angular cover](https://github.com/zeropsio/recipe-shared-assets/blob/main/covers/svg/cover-angular.svg)

## Integration Guide

### 1. Adding `zerops.yaml`
The main application configuration file you place at the root of your repository. It tells Zerops how to build, deploy, and run your application.

```yaml
# Zerops build/deploy pipeline for Angular SSR.
# Two setups: 'prod' for optimized SSR deployments,
# 'dev' for interactive SSH development.
zerops:
  - setup: prod
    build:
      base: nodejs@22

      buildCommands:
        # npm ci installs exact versions from package-lock.json —
        # deterministic builds, no unexpected dep upgrades.
        - npm ci
        # Generate src/environments/build-env.ts with the actual Angular
        # version and build timestamp — esbuild inlines this into server.mjs
        # at build time so no extra file is needed at runtime.
        - node scripts/generate-build-env.js
        # Angular CLI compiles client + server bundles via esbuild.
        # Output: dist/angular-ssr-hello-world/{browser,server}/
        - npx ng build

      deployFiles:
        # Angular SSR (Express) is NOT self-contained — the server bundle
        # expects node_modules to be present at runtime for Express, pg,
        # and other dependencies. Deploy alongside the compiled output.
        - dist/angular-ssr-hello-world
        - node_modules
        - package.json
        - migrate.js

      cache:
        # .angular/cache stores incremental compilation state —
        # dramatically speeds up subsequent builds.
        - node_modules
        - .angular/cache

    # Readiness check: Zerops verifies each new container passes
    # before the project balancer routes traffic to it.
    # Angular SSR defaults to port 4000 (not 3000).
    deploy:
      readinessCheck:
        httpGet:
          port: 4000
          path: /

    run:
      base: nodejs@22

      # Migration runs once per deploy version across all containers.
      # initCommands — not buildCommands — so schema and code change
      # atomically; a failed deploy cannot leave a migrated DB with
      # old application code.
      # zsc execOnce prevents concurrent execution when minContainers > 1.
      initCommands:
        - zsc execOnce ${appVersionId} -- node migrate.js

      ports:
        - port: 4000
          httpSupport: true

      envVariables:
        NODE_ENV: production
        PORT: 4000
        # DB_NAME matches the hostname of the db service.
        DB_NAME: db
        # Referencing pattern: ${hostname_key} resolves at runtime
        # using Zerops-generated variables for the 'db' service.
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}

      start: node dist/angular-ssr-hello-world/server/server.mjs

  - setup: dev
    build:
      base: nodejs@22
      # Ubuntu gives a richer toolset (git, editors, debuggers)
      # for interactive development via SSH.
      os: ubuntu

      buildCommands:
        # npm install (not npm ci) — tolerates missing lock file
        # in fresh developer checkouts.
        - npm install

      # Deploy full source tree so the developer has everything
      # available after SSH-ing in.
      deployFiles: ./

      cache:
        - node_modules

    run:
      base: nodejs@22
      os: ubuntu

      # Migration still runs in dev so the database is ready
      # immediately when the developer SSH-s in.
      initCommands:
        - zsc execOnce ${appVersionId} -- node migrate.js

      ports:
        - port: 4000
          httpSupport: true

      envVariables:
        NODE_ENV: development
        PORT: 4000
        DB_NAME: db
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}

      # zsc noop keeps the container running without starting a server.
      # The developer SSH-s in and runs 'ng serve' or 'npm run build &&
      # node dist/.../server.mjs' manually.
      start: zsc noop --silent
```
