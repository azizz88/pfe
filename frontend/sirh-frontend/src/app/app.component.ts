import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from './services/keycloak.service';

/**
 * Composant racine de l'application SIRH.
 * Affiche la barre de navigation avec les liens selon le rôle de l'utilisateur.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-container">
      <!-- Barre de navigation -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>🏢 SIRH</h2>
          <p class="user-info">{{ keycloakService.getFullName() }}</p>
          <span class="user-role">{{ keycloakService.isHrAdmin() ? 'RH Admin' : 'Employé' }}</span>
        </div>

        <!-- Menu Employé (visible pour tous) -->
        <div class="nav-section">
          <h3>📋 Espace Employé</h3>
          <a routerLink="/employee/dashboard" routerLinkActive="active">
            <span>🏠</span> Mon Dashboard
          </a>
          <a routerLink="/employee/directory" routerLinkActive="active">
            <span>📖</span> Annuaire
          </a>
          <a routerLink="/employee/applications" routerLinkActive="active">
            <span>📝</span> Mes Candidatures
          </a>
          <a routerLink="/employee/organigramme" routerLinkActive="active">
            <span>🏢</span> Organigramme
          </a>
        </div>

        <!-- Menu RH Admin (visible seulement pour HR_ADMIN) -->
        <div class="nav-section" *ngIf="keycloakService.isHrAdmin()">
          <h3>⚙️ Espace RH Admin</h3>
          <a routerLink="/admin/dashboard" routerLinkActive="active">
            <span>📊</span> Dashboard Stats
          </a>
          <a routerLink="/admin/employees" routerLinkActive="active">
            <span>👥</span> Gestion Employés
          </a>
          <a routerLink="/admin/departments" routerLinkActive="active">
            <span>🏗️</span> Départements
          </a>
          <a routerLink="/admin/contracts" routerLinkActive="active">
            <span>📄</span> Contrats
          </a>
          <a routerLink="/admin/recruitment" routerLinkActive="active">
            <span>🎯</span> Recrutement
          </a>
        </div>

        <!-- Bouton déconnexion -->
        <div class="nav-section logout-section">
          <button class="logout-btn" (click)="keycloakService.logout()">
            🚪 Déconnexion
          </button>
        </div>
      </nav>

      <!-- Contenu principal -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
      padding: 0;
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .sidebar-header h2 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
    }

    .user-info {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .user-role {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 12px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .nav-section {
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .nav-section h3 {
      padding: 0 20px;
      margin: 0 0 8px 0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.6;
    }

    .nav-section a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .nav-section a:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-section a.active {
      background: rgba(59, 130, 246, 0.3);
      color: white;
      border-right: 3px solid #3b82f6;
    }

    .logout-section {
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: none;
    }

    .logout-btn {
      width: 100%;
      padding: 14px 20px;
      background: transparent;
      color: #f87171;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      text-align: left;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: rgba(248, 113, 113, 0.1);
    }

    .main-content {
      flex: 1;
      background: #f1f5f9;
      padding: 24px;
      overflow-y: auto;
    }
  `]
})
export class AppComponent {
  constructor(public keycloakService: KeycloakService) {}
}
