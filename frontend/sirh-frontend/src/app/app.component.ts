import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from './services/keycloak.service';

// Routes publiques (pas de sidebar, pas de Keycloak init).
const PUBLIC_ROUTE_PREFIXES = ['/forgot-password'];

/**
 * Composant racine de l'application SIRH.
 * Affiche la barre de navigation avec les liens selon le rôle de l'utilisateur.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <ng-container *ngIf="!isPublicRoute; else publicLayout">
    <div class="app-container">
      <!-- Barre de navigation -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>🏢 SIRH</h2>
          <p class="user-info">{{ keycloakService.getFullName() }}</p>
          <span class="user-role">{{ roleLabel }}</span>
        </div>

        <!-- ============================================ -->
        <!-- SIDEBAR MANAGER (visible si MANAGER, non-admin) -->
        <!-- ============================================ -->
        <ng-container *ngIf="keycloakService.isManager() && !keycloakService.isHrAdmin()">
          <div class="nav-section">
            <h3>🎙️ Espace Manager</h3>
            <a routerLink="/manager/dashboard" routerLinkActive="active">
              <span>🏠</span> Mon Dashboard
            </a>
            <a routerLink="/manager/profile" routerLinkActive="active">
              <span>👤</span> Mon Profil
            </a>
            <a routerLink="/manager/interviews" routerLinkActive="active">
              <span>📅</span> Mes Entretiens
            </a>
            <a routerLink="/manager/formation" routerLinkActive="active">
              <span>🎓</span> Formations
            </a>
            <a routerLink="/manager/organigramme" routerLinkActive="active">
              <span>🌳</span> Organigramme
            </a>
          </div>
        </ng-container>

        <!-- ============================================ -->
        <!-- SIDEBAR EMPLOYÉ (visible uniquement pour EMPLOYEE non-manager) -->
        <!-- ============================================ -->
        <ng-container *ngIf="!keycloakService.isHrAdmin() && !keycloakService.isManager()">
          <div class="nav-section">
            <h3>📋 Espace Employé</h3>
            <a routerLink="/employee/dashboard" routerLinkActive="active">
              <span>🏠</span> Mon Dashboard
            </a>
            <a routerLink="/employee/profile" routerLinkActive="active">
              <span>👤</span> Mon Profil
            </a>
            <a routerLink="/employee/directory" routerLinkActive="active">
              <span>📖</span> Annuaire
            </a>
            <a routerLink="/employee/applications" routerLinkActive="active">
              <span>💼</span> Offres d'emploi
            </a>
            <a routerLink="/employee/formation" routerLinkActive="active">
              <span>🎓</span> Ma Formation
            </a>
          </div>
        </ng-container>

        <!-- ============================================ -->
        <!-- SIDEBAR RH ADMIN (visible uniquement pour HR_ADMIN) -->
        <!-- ============================================ -->
        <ng-container *ngIf="keycloakService.isHrAdmin()">
          <div class="nav-section">
            <h3>🏢 Administration RH</h3>
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
            <a routerLink="/admin/organigramme" routerLinkActive="active">
              <span>🌳</span> Organigramme
            </a>
          </div>

          <div class="nav-section">
            <h3>🎯 Recrutement</h3>
            <a routerLink="/admin/recruitment" routerLinkActive="active">
              <span>🎯</span> Offres & candidatures
            </a>
            <a routerLink="/admin/external-candidates" routerLinkActive="active">
              <span>🌐</span> Candidats externes
            </a>
            <a routerLink="/admin/skills" routerLinkActive="active">
              <span>🎓</span> Compétences
            </a>
            <a routerLink="/admin/training-providers" routerLinkActive="active">
              <span>🏫</span> Organismes de formation
            </a>
          </div>
        </ng-container>

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
    </ng-container>

    <!-- Layout pour les pages publiques (forgot-password, etc.) -->
    <ng-template #publicLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .sidebar {
      width: 270px;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: white;
      padding: 0;
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 28px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
    }

    .sidebar-header h2 {
      margin: 0 0 10px 0;
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .user-info {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.85;
      font-weight: 500;
    }

    .user-role {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 14px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25));
      border: 1px solid rgba(96, 165, 250, 0.2);
      border-radius: 20px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
    }

    .nav-section {
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .nav-section h3 {
      padding: 0 24px;
      margin: 0 0 10px 0;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.4;
      font-weight: 600;
    }

    .nav-section a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 24px;
      color: rgba(255, 255, 255, 0.65);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      position: relative;
    }

    .nav-section a:hover {
      background: rgba(255, 255, 255, 0.06);
      color: white;
      border-left-color: rgba(96, 165, 250, 0.4);
    }

    .nav-section a.active {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent);
      color: white;
      border-left-color: #60a5fa;
      font-weight: 600;
    }

    .nav-section a span {
      font-size: 1.05rem;
      width: 22px;
      text-align: center;
    }

    .logout-section {
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom: none;
      padding: 8px 0;
    }

    .logout-btn {
      width: 100%;
      padding: 14px 24px;
      background: transparent;
      color: rgba(248, 113, 113, 0.8);
      border: none;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 500;
      text-align: left;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: rgba(248, 113, 113, 0.08);
      color: #f87171;
    }

    .main-content {
      flex: 1;
      background: #f1f5f9;
      padding: 28px 32px;
      overflow-y: auto;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
  constructor(public keycloakService: KeycloakService, private router: Router) {}

  get isPublicRoute(): boolean {
    return PUBLIC_ROUTE_PREFIXES.some(prefix => this.router.url.startsWith(prefix));
  }

  get roleLabel(): string {
    if (this.keycloakService.isHrAdmin()) return 'RH Admin';
    if (this.keycloakService.isManager()) return 'Manager';
    return 'Employé';
  }
}
