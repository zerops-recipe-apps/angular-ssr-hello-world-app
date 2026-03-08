import { bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { AppComponent } from './app/app.component';

// Exported bootstrap function used by CommonEngine in server.ts
// to render Angular components for non-root SSR routes.
const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
