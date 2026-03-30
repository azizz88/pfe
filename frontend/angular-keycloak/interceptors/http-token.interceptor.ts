import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from '../services/keycloak.service';

/**
 * Intercepteur HTTP fonctionnel (Angular 15+).
 * Ajoute automatiquement le token Bearer JWT à chaque requête
 * sortante vers l'API Gateway.
 */
export const httpTokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Injection du service Keycloak
  const keycloakService = inject(KeycloakService);

  // Récupération du token JWT
  const token = keycloakService.getToken();

  // Si un token est disponible, on clone la requête en ajoutant l'en-tête Authorization
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  // Si pas de token, on laisse passer la requête sans modification
  return next(req);
};
