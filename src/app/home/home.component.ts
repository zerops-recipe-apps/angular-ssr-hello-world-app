import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BUILD_ENV } from '../../environments/build-env';
import {
  dbBadgeClass,
  environmentBadgeClass,
  formatBuildTime,
} from '../../shared/status-page';

interface StatusResponse {
  greeting: string;
  dbStatus: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
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

          <h1>{{ status.greeting }}</h1>
          <p class="subtitle">
            Angular SSR with Express and PostgreSQL at runtime.
          </p>
        </header>

        <dl class="stats">
          <div class="stat">
            <dt>Framework</dt>
            <dd>Angular {{ version }}</dd>
          </div>
          <div class="stat">
            <dt>Environment</dt>
            <dd>
              <span class="badge" [class]="environmentClass">{{ environment }}</span>
            </dd>
          </div>
          <div class="stat">
            <dt>Build time</dt>
            <dd>{{ formattedBuildTime }}</dd>
          </div>
          <div class="stat">
            <dt>Database</dt>
            <dd>
              <span class="badge" [class]="dbStatusClass">{{ status.dbStatus }}</span>
            </dd>
          </div>
        </dl>
      </article>
    </main>
  `,
})
export class HomeComponent {
  private readonly http = inject(HttpClient);

  readonly version = BUILD_ENV.version;
  readonly buildTime = BUILD_ENV.buildTime;
  readonly environment = BUILD_ENV.environment;
  readonly formattedBuildTime = formatBuildTime(BUILD_ENV.buildTime);
  readonly environmentClass = environmentBadgeClass(BUILD_ENV.environment);

  status: StatusResponse = {
    greeting: 'Hello from Zerops!',
    dbStatus: 'Checking…',
  };

  get dbStatusClass(): string {
    return dbBadgeClass(this.status.dbStatus);
  }

  constructor() {
    this.http.get<StatusResponse>('/api/status').subscribe({
      next: ({ greeting, dbStatus }) => {
        this.status = { greeting, dbStatus };
      },
      error: () => {
        this.status = {
          greeting: 'Hello from Zerops!',
          dbStatus: 'Unavailable',
        };
      },
    });
  }
}
