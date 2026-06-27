import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { KeycloakService } from './services/keycloak.service';
import { IconComponent } from './shared/icon/icon.component';

// Routes publiques (pas de sidebar, pas de Keycloak init).
const PUBLIC_ROUTE_PREFIXES = ['/forgot-password'];

interface NavItem { label: string; icon: string; link: string; }
interface NavSection { title: string; items: NavItem[]; }

/**
 * Composant racine de l'application SIRH.
 * Coque applicative : barre latérale de navigation contextuelle au rôle
 * (RH / Manager / Employé) + zone de contenu.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    @if (!isPublicRoute) {
      <div class="shell" [class]="roleClass">
        <!-- Barre supérieure mobile -->
        <header class="topbar">
          <button class="topbar__menu" type="button" (click)="toggleMobile()"
                  [attr.aria-expanded]="mobileOpen()" aria-label="Ouvrir le menu de navigation">
            <app-icon [name]="mobileOpen() ? 'close' : 'menu'" [size]="20" />
          </button>
          <span class="topbar__brand">SIRH</span>
        </header>

        @if (mobileOpen()) {
          <div class="scrim" (click)="closeMobile()" aria-hidden="true"></div>
        }

        <!-- Navigation latérale -->
        <nav class="sidebar" [class.is-open]="mobileOpen()" aria-label="Navigation principale">
          <div class="brand">
            <span class="brand__mark" aria-hidden="true">
              <app-icon name="team" [size]="20" />
            </span>
            <span class="brand__text">
              <span class="brand__name">SIRH</span>
              <span class="brand__tag">Ressources Humaines</span>
            </span>
          </div>

          <div class="nav">
            @for (section of navSections; track section.title) {
              <div class="nav__section">
                <p class="nav__heading">{{ section.title }}</p>
                @for (item of section.items; track item.link) {
                  <a [routerLink]="item.link" routerLinkActive="is-active" (click)="closeMobile()">
                    <app-icon [name]="item.icon" [size]="18" />
                    <span>{{ item.label }}</span>
                  </a>
                }
              </div>
            }
          </div>

          <div class="nav__foot">
            <div class="usercard">
              <span class="avatar avatar--round" aria-hidden="true">{{ initials }}</span>
              <span class="usercard__id">
                <span class="usercard__name">{{ keycloakService.getFullName() || keycloakService.getUserName() }}</span>
                <span class="usercard__role">{{ roleLabel }}</span>
              </span>
            </div>
            <button class="logout" type="button" (click)="keycloakService.logout()">
              <app-icon name="logout" [size]="18" />
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; }

    /* ---- Sidebar ---- */
    .sidebar {
      width: 256px; flex: none;
      background: var(--c-nav-bg);
      color: var(--c-nav-text);
      display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh;
      border-right: 1px solid rgba(0,0,0,.2);
    }

    .brand {
      display: flex; align-items: center; gap: 11px;
      padding: 20px 20px 18px;
      border-bottom: 1px solid var(--c-nav-border);
    }
    .brand__mark {
      width: 38px; height: 38px; border-radius: 9px; flex: none;
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--c-accent); color: #fff;
    }
    .brand__text { display: flex; flex-direction: column; line-height: 1.15; }
    .brand__name { font-size: 1.15rem; font-weight: 700; color: #fff; letter-spacing: .02em; }
    .brand__tag { font-size: .68rem; color: var(--c-nav-text-dim); letter-spacing: .04em; }

    .nav { flex: 1; overflow-y: auto; padding: 14px 12px; }
    .nav__section { padding: 6px 0 12px; }
    .nav__section + .nav__section { border-top: 1px solid var(--c-nav-border); padding-top: 12px; }
    .nav__heading {
      font-size: .66rem; font-weight: 650; text-transform: uppercase; letter-spacing: .11em;
      color: var(--c-nav-text-dim); padding: 0 10px; margin-bottom: 6px;
    }
    .nav a {
      display: flex; align-items: center; gap: 11px;
      padding: 9px 10px; border-radius: 7px;
      color: var(--c-nav-text); font-size: .875rem; font-weight: 500;
      text-decoration: none; position: relative;
      transition: background .15s ease, color .15s ease;
    }
    .nav a:hover { background: rgba(255,255,255,.06); color: #fff; }
    .nav a.is-active { background: var(--c-nav-bg-2); color: #fff; font-weight: 600; }
    .nav a.is-active::before {
      content: ""; position: absolute; left: -12px; top: 7px; bottom: 7px; width: 3px;
      border-radius: 0 3px 3px 0; background: var(--c-accent);
    }
    .nav a app-icon { color: var(--c-nav-text-dim); transition: color .15s ease; }
    .nav a:hover app-icon, .nav a.is-active app-icon { color: #fff; }

    .nav__foot { border-top: 1px solid var(--c-nav-border); padding: 12px; }
    .usercard { display: flex; align-items: center; gap: 10px; padding: 6px 8px 12px; }
    .usercard .avatar { background: rgba(255,255,255,.1); color: #fff; }
    .usercard__id { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .usercard__name { font-size: .85rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .usercard__role { font-size: .72rem; color: var(--c-nav-text-dim); }
    .logout {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 7px; border: 1px solid var(--c-nav-border);
      background: transparent; color: var(--c-nav-text); cursor: pointer;
      font-size: .85rem; font-weight: 500; transition: background .15s ease, color .15s ease, border-color .15s ease;
    }
    .logout:hover { background: rgba(210,69,69,.14); border-color: rgba(210,69,69,.3); color: #f0a3a3; }
    .logout:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,.18); }

    /* ---- Contenu ---- */
    .content { flex: 1; min-width: 0; padding: 28px 32px 48px; }

    /* ---- Topbar (mobile) ---- */
    .topbar { display: none; }
    .scrim { display: none; }

    @media (max-width: 960px) {
      .topbar {
        display: flex; align-items: center; gap: 12px;
        position: sticky; top: 0; z-index: 40;
        height: 56px; padding: 0 16px;
        background: var(--c-nav-bg); color: #fff;
        border-bottom: 1px solid rgba(0,0,0,.2);
      }
      .topbar__menu {
        display: inline-flex; align-items: center; justify-content: center;
        width: 38px; height: 38px; border-radius: 7px;
        border: 1px solid var(--c-nav-border); background: transparent; color: #fff; cursor: pointer;
      }
      .topbar__brand { font-size: 1.05rem; font-weight: 700; letter-spacing: .02em; }

      .shell { flex-direction: column; }
      .sidebar {
        position: fixed; top: 0; left: 0; z-index: 60; height: 100vh;
        transform: translateX(-100%); transition: transform .2s ease;
        box-shadow: var(--sh-lg);
      }
      .sidebar.is-open { transform: translateX(0); }
      .scrim { display: block; position: fixed; inset: 0; z-index: 50; background: rgba(10,16,28,.5); }
      .content { padding: 20px 18px 40px; }
    }
  `]
})
export class AppComponent {
  readonly mobileOpen = signal(false);

  constructor(public keycloakService: KeycloakService, private router: Router) {
    // Ferme le menu mobile à chaque navigation.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.mobileOpen.set(false));
  }

  get isPublicRoute(): boolean {
    return PUBLIC_ROUTE_PREFIXES.some(prefix => this.router.url.startsWith(prefix));
  }

  get roleClass(): string {
    if (this.keycloakService.isHrAdmin()) return 'role-admin';
    if (this.keycloakService.isManager()) return 'role-manager';
    return 'role-employee';
  }

  get roleLabel(): string {
    if (this.keycloakService.isHrAdmin()) return 'Administration RH';
    if (this.keycloakService.isManager()) return 'Manager';
    return 'Employé';
  }

  get initials(): string {
    const name = this.keycloakService.getFullName() || this.keycloakService.getUserName() || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '–';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get navSections(): NavSection[] {
    const kc = this.keycloakService;

    if (kc.isHrAdmin()) {
      return [
        {
          title: 'Administration RH',
          items: [
            { label: 'Tableau de bord', icon: 'dashboard',  link: '/admin/dashboard' },
            { label: 'Employés',        icon: 'employees',  link: '/admin/employees' },
            { label: 'Départements',    icon: 'department', link: '/admin/departments' },
            { label: 'Contrats',        icon: 'contract',   link: '/admin/contracts' },
            { label: 'Organigramme',    icon: 'org-chart',  link: '/admin/organigramme' },
          ],
        },
        {
          title: 'Recrutement & talents',
          items: [
            { label: 'Offres & candidatures', icon: 'recruitment',       link: '/admin/recruitment' },
            { label: 'Candidats externes',    icon: 'external',          link: '/admin/external-candidates' },
            { label: 'Compétences',           icon: 'skills',            link: '/admin/skills' },
            { label: 'Organismes de formation', icon: 'training-provider', link: '/admin/training-providers' },
          ],
        },
      ];
    }

    if (kc.isManager()) {
      return [
        {
          title: 'Espace manager',
          items: [
            { label: 'Tableau de bord', icon: 'dashboard',  link: '/manager/dashboard' },
            { label: 'Mon profil',      icon: 'profile',    link: '/manager/profile' },
            { label: 'Entretiens',      icon: 'interview',  link: '/manager/interviews' },
            { label: 'Formations',      icon: 'formation',  link: '/manager/formation' },
            { label: 'Organigramme',    icon: 'org-chart',  link: '/manager/organigramme' },
          ],
        },
      ];
    }

    return [
      {
        title: 'Espace employé',
        items: [
          { label: 'Tableau de bord', icon: 'dashboard', link: '/employee/dashboard' },
          { label: 'Mon profil',      icon: 'profile',   link: '/employee/profile' },
          { label: 'Annuaire',        icon: 'directory', link: '/employee/directory' },
          { label: "Offres d'emploi", icon: 'job',       link: '/employee/applications' },
          { label: 'Ma formation',    icon: 'formation', link: '/employee/formation' },
        ],
      },
    ];
  }

  toggleMobile() { this.mobileOpen.update(v => !v); }
  closeMobile() { this.mobileOpen.set(false); }
}
