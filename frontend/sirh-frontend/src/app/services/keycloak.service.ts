import { Injectable, NgZone } from '@angular/core';
import Keycloak from 'keycloak-js';

/**
 * Service d'authentification Keycloak.
 * Gère l'initialisation, les rôles, le profil utilisateur et le token JWT.
 */
@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private _keycloak: Keycloak | undefined;

  constructor(private ngZone: NgZone) {}

  /** Getter pour l'instance Keycloak */
  get keycloak(): Keycloak {
    if (!this._keycloak) {
      this._keycloak = new Keycloak({
        url: 'http://localhost:8180',
        realm: 'aziz',
        clientId: 'angular-client'
      });
    }
    return this._keycloak;
  }

  /**
   * Initialise Keycloak avec login-required.
   * La résolution de la Promise est ramenée dans NgZone pour que
   * le change detection Angular fonctionne correctement après le bootstrap.
   */
  init(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false
      }).then(authenticated => {
        this.ngZone.run(() => resolve(authenticated));
      }).catch(err => {
        this.ngZone.run(() => reject(err));
      });
    });
  }

  /** Nom d'utilisateur Keycloak */
  getUserName(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] || '';
  }

  /** Nom complet (prénom + nom) */
  getFullName(): string {
    return this.keycloak.tokenParsed?.['name'] || '';
  }

  /** Email de l'utilisateur */
  getEmail(): string {
    return this.keycloak.tokenParsed?.['email'] || '';
  }

  /** Vérifie si l'utilisateur possède un rôle spécifique */
  hasRole(role: string): boolean {
    const roles = this.keycloak.tokenParsed?.['realm_access']?.['roles'] || [];
    return roles.includes(role);
  }

  /** Vérifie si l'utilisateur est HR_ADMIN */
  isHrAdmin(): boolean {
    return this.hasRole('HR_ADMIN');
  }

  /** Vérifie si l'utilisateur est EMPLOYEE */
  isEmployee(): boolean {
    return this.hasRole('EMPLOYEE');
  }

  /** Récupère le token JWT */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /** Déconnexion */
  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
