import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakService } from '../services/keycloak.service';

/**
 * Intercepteur HTTP basé sur une classe (compatible Angular < 15).
 * Ajoute automatiquement le token Bearer JWT à chaque requête
 * sortante vers l'API Gateway.
 */
@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Récupération du token JWT
    const token = this.keycloakService.getToken();

    // Si un token est disponible, on clone la requête en ajoutant l'en-tête Authorization
    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(clonedRequest);
    }

    // Si pas de token, on laisse passer la requête sans modification
    return next.handle(req);
  }
}
