import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { KeycloakService } from './services/keycloak.service';
import { httpTokenInterceptor } from './interceptors/http-token.interceptor';

/**
 * Configuration standalone de l'application Angular 21.
 * - provideZoneChangeDetection : assure le bon fonctionnement du change detection
 * - APP_INITIALIZER : initialise Keycloak au démarrage (login-required)
 * - HttpClient : injecte le token Bearer via l'intercepteur fonctionnel
 */
// Routes accessibles sans authentification Keycloak.
const PUBLIC_ROUTES = ['/forgot-password'];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: false }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpTokenInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const keycloakService = inject(KeycloakService);
        return () => {
          const path = window.location.pathname;
          if (PUBLIC_ROUTES.some(r => path.startsWith(r))) {
            return Promise.resolve(true);
          }
          return keycloakService.init();
        };
      },
      multi: true
    }
  ]
};
