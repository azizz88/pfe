import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  // Instance de Keycloak
  private _keycloak: Keycloak | undefined;

  /**
   * Getter pour accéder à l'instance Keycloak.
   * Initialise une nouvelle instance si elle n'existe pas encore.
   */
  get keycloak(): Keycloak {
    if (!this._keycloak) {
      this._keycloak = new Keycloak({
        url: 'http://localhost:8180',   // URL du serveur Keycloak (port 8180)
        realm: 'aziz',                  // Nom du realm
        clientId: 'angular-client'      // ID du client Angular
      });
    }
    return this._keycloak;
  }

  /**
   * Initialise Keycloak avec l'option 'login-required'.
   * Force l'authentification au démarrage de l'application.
   * @returns Promise<boolean> - true si l'initialisation réussit
   */
  async init(): Promise<boolean> {
    const authenticated = await this.keycloak.init({
      onLoad: 'login-required' // Redirige vers la page de login si non authentifié
    });
    return authenticated;
  }

  /**
   * Récupère le nom complet de l'utilisateur depuis le token décodé.
   * @returns Le nom de l'utilisateur ou une chaîne vide si non disponible
   */
  getUserName(): string {
    // Le token parsé contient les claims du JWT
    return this.keycloak.tokenParsed?.['preferred_username'] || '';
  }

  /**
   * Récupère le nom complet (prénom + nom) de l'utilisateur.
   * @returns Le nom complet ou une chaîne vide
   */
  getFullName(): string {
    return this.keycloak.tokenParsed?.['name'] || '';
  }

  /**
   * Vérifie si l'utilisateur possède un rôle spécifique.
   * Recherche dans les rôles du realm Keycloak.
   * @param role - Le rôle à vérifier (ex: 'HR_ADMIN', 'EMPLOYEE')
   * @returns true si l'utilisateur possède le rôle
   */
  hasRole(role: string): boolean {
    const roles = this.keycloak.tokenParsed?.['realm_access']?.['roles'] || [];
    return roles.includes(role);
  }

  /**
   * Vérifie si l'utilisateur est un administrateur RH.
   * @returns true si l'utilisateur possède le rôle HR_ADMIN
   */
  isHrAdmin(): boolean {
    return this.hasRole('HR_ADMIN');
  }

  /**
   * Vérifie si l'utilisateur est un employé.
   * @returns true si l'utilisateur possède le rôle EMPLOYEE
   */
  isEmployee(): boolean {
    return this.hasRole('EMPLOYEE');
  }

  /**
   * Récupère le token d'accès JWT pour les requêtes API.
   * @returns Le token JWT ou undefined
   */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /**
   * Déconnecte l'utilisateur et le redirige vers la page de login.
   */
  logout(): void {
    this.keycloak.logout({
      redirectUri: window.location.origin // Redirige vers la racine après déconnexion
    });
  }
}
