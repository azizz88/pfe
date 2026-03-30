import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { KeycloakService } from '../services/keycloak.service';

/**
 * Guard fonctionnel pour protéger les routes HR_ADMIN.
 * Redirige vers l'espace employé si l'utilisateur n'est pas admin.
 */
export const hrAdminGuard: CanActivateFn = () => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  if (keycloakService.isHrAdmin()) {
    return true;
  }

  // Redirige vers le dashboard employé si pas admin
  router.navigate(['/employee/dashboard']);
  return false;
};

/**
 * Guard fonctionnel pour protéger les routes EMPLOYEE.
 * Vérifie que l'utilisateur a au moins un des rôles (EMPLOYEE ou HR_ADMIN).
 */
export const employeeGuard: CanActivateFn = () => {
  const keycloakService = inject(KeycloakService);

  if (keycloakService.isEmployee() || keycloakService.isHrAdmin()) {
    return true;
  }

  return false;
};
