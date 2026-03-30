import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { KeycloakService } from './services/keycloak.service';
import { httpTokenInterceptor } from './interceptors/http-token.interceptor';

// ──────────────────────────────────────────────
// Configuration standalone (Angular 15+)
// Utilisez ce fichier si votre projet utilise
// le mode standalone (sans NgModule)
// ──────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Routage ──
    provideRouter(routes),

    // ── HTTP Client avec intercepteur fonctionnel ──
    provideHttpClient(
      withInterceptors([httpTokenInterceptor])
    ),

    // ── Initialisation Keycloak au démarrage ──
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const keycloakService = inject(KeycloakService);
        return () => keycloakService.init();
      },
      multi: true // Permet plusieurs APP_INITIALIZER
    }
  ]
};
