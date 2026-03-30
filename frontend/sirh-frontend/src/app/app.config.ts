import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { KeycloakService } from './services/keycloak.service';
import { httpTokenInterceptor } from './interceptors/http-token.interceptor';

/**
 * Configuration standalone de l'application Angular 17+.
 * - APP_INITIALIZER : initialise Keycloak au démarrage (login-required)
 * - HttpClient : injecte le token Bearer via l'intercepteur fonctionnel
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpTokenInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const keycloakService = inject(KeycloakService);
        return () => keycloakService.init();
      },
      multi: true
    }
  ]
};
