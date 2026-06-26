import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { KeycloakService } from '../../../services/keycloak.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Composant "Mes Candidatures".
 * Permet à l'employé de voir les offres actives et son historique de candidatures.
 */
@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="applications page page--narrow fade-in">
      <header class="page-header">
        <div class="page-header__title">
          <h1>Offres d'emploi</h1>
          <p class="page-header__sub">Découvrez les opportunités disponibles au sein de l'entreprise</p>
        </div>
        <div class="page-header__actions" *ngIf="activeOffers.length > 0">
          <span class="badge badge--neutral">
            <app-icon name="job" [size]="14" /> {{ activeOffers.length }} offre(s) active(s)
          </span>
        </div>
      </header>

      <!-- Tabs -->
      <nav class="tabs">
        <button class="tab" [class.active]="activeTab === 'offers'" (click)="activeTab = 'offers'">
          <app-icon name="target" [size]="16" /> Offres actives
          <span class="tab__count" *ngIf="activeOffers.length > 0">{{ activeOffers.length }}</span>
        </button>
        <button class="tab" *ngIf="!isAdmin" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">
          <app-icon name="list" [size]="16" /> Mon historique
          <span class="tab__count" *ngIf="myApplications.length > 0">{{ myApplications.length }}</span>
        </button>
      </nav>

      <!-- Active offers -->
      <div class="offers-list" *ngIf="activeTab === 'offers'">
        <article class="card offer-card" *ngFor="let offer of activeOffers; let i = index"
                 [style.animation-delay]="i * 60 + 'ms'">
          <div class="card__body">
            <div class="offer-head">
              <h3 class="offer-title">{{ offer.title }}</h3>
              <span class="badge badge--success">Active</span>
            </div>

            <div class="offer-tags">
              <span class="chip" *ngIf="offer.department">
                <app-icon name="department" [size]="14" /> {{ offer.department }}
              </span>
              <span class="chip" *ngIf="offer.deadline">
                <app-icon name="calendar" [size]="14" /> {{ offer.deadline }}
              </span>
            </div>

            <p class="offer-desc" *ngIf="offer.description">{{ offer.description }}</p>

            <div class="offer-skills" *ngIf="offer.skills?.length">
              <span class="u-eyebrow skills-label">
                <app-icon name="target" [size]="13" /> Compétences requises
              </span>
              <div class="skills-chips">
                <div class="skill-chip" *ngFor="let skill of offer.skills">
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-level" [ngClass]="'lvl-' + getRequiredLevel(offer, skill.id)">
                    Niveau {{ getRequiredLevel(offer, skill.id) }} · {{ getLevelLabel(getRequiredLevel(offer, skill.id)) }}
                  </span>
                  <div class="level-dots">
                    <span class="dot" *ngFor="let d of [1,2,3,4,5]"
                          [class.filled]="d <= getRequiredLevel(offer, skill.id)"></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="offer-actions" *ngIf="!isAdmin">
              <button class="btn btn--accent" *ngIf="!hasApplied(offer.id)" (click)="applyToOffer(offer)">
                <app-icon name="send" [size]="16" /> Postuler maintenant
              </button>
              <button class="btn btn--secondary" *ngIf="hasApplied(offer.id)" disabled>
                <app-icon name="check" [size]="16" /> Candidature envoyée
              </button>
            </div>
          </div>
        </article>

        <div class="empty-state" *ngIf="activeOffers.length === 0">
          <div class="empty-state__icon"><app-icon name="inbox" [size]="28" /></div>
          <h3 class="empty-state__title">Aucune offre active pour le moment</h3>
          <p class="empty-state__text">Les nouvelles opportunités seront publiées ici.</p>
        </div>
      </div>

      <!-- Application history (employees only) -->
      <div class="history-list" *ngIf="!isAdmin && activeTab === 'history'">
        <article class="card history-card" *ngFor="let app of myApplications; let i = index"
                 [style.animation-delay]="i * 60 + 'ms'">
          <div class="card__body history-body">
            <div class="history-top">
              <h3 class="history-title">{{ app.jobOfferTitle }}</h3>
              <span class="badge" [ngClass]="getStatusClass(app.status)">{{ getStatusLabel(app.status) }}</span>
            </div>
            <div class="history-meta">
              <app-icon name="calendar" [size]="14" /> Soumis le {{ app.applicationDate }}
            </div>
            <p class="history-cover" *ngIf="app.coverLetter">{{ app.coverLetter }}</p>
          </div>
        </article>

        <div class="empty-state" *ngIf="myApplications.length === 0">
          <div class="empty-state__icon"><app-icon name="document" [size]="28" /></div>
          <h3 class="empty-state__title">Vous n'avez pas encore postulé</h3>
          <p class="empty-state__text">Consultez les offres actives pour découvrir les opportunités.</p>
        </div>
      </div>

      <!-- Apply modal -->
      <div class="modal-overlay" *ngIf="showApplyModal" (click)="showApplyModal = false">
        <div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Postuler à cette offre"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div class="modal__title-wrap">
              <h3 class="modal__title"><app-icon name="send" [size]="20" /> Postuler à cette offre</h3>
              <p class="modal__sub" *ngIf="selectedOffer?.title">{{ selectedOffer?.title }}</p>
            </div>
            <button class="icon-btn" type="button" (click)="showApplyModal = false" aria-label="Fermer">
              <app-icon name="close" [size]="18" />
            </button>
          </div>
          <div class="modal__body">
            <div class="field">
              <label class="label" for="cover-letter">Lettre de motivation</label>
              <textarea id="cover-letter" class="textarea" [(ngModel)]="coverLetter"
                        placeholder="Décrivez votre motivation pour ce poste..." rows="6"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" (click)="showApplyModal = false">Annuler</button>
            <button class="btn btn--accent" (click)="submitApplication()">
              <app-icon name="send" [size]="16" /> Envoyer ma candidature
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .applications { padding-bottom: var(--sp-6); }

    /* Listes */
    .offers-list, .history-list { display: flex; flex-direction: column; gap: var(--sp-4); }

    .offer-card, .history-card { animation: cardIn .3s ease both; }
    @keyframes cardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

    .offer-card .card__body { display: flex; flex-direction: column; gap: var(--sp-4); }

    .offer-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--sp-3);
    }
    .offer-title { font-size: var(--fs-16); margin: 0; }

    .offer-tags { display: flex; gap: var(--sp-2); flex-wrap: wrap; }

    .offer-desc {
      color: var(--c-ink-soft); font-size: var(--fs-14); line-height: 1.6; margin: 0;
      padding: var(--sp-3) var(--sp-4); background: var(--c-surface-2);
      border-radius: var(--r-md); border-left: 3px solid var(--c-accent);
    }

    /* Compétences */
    .offer-skills { display: flex; flex-direction: column; gap: var(--sp-3); }
    .skills-label { display: inline-flex; align-items: center; gap: 6px; }
    .skills-chips { display: flex; flex-wrap: wrap; gap: var(--sp-3); }
    .skill-chip {
      display: flex; flex-direction: column; gap: 6px;
      background: var(--c-surface-2); border: 1px solid var(--c-border);
      border-radius: var(--r-md); padding: var(--sp-3); min-width: 170px;
    }
    .skill-name { font-weight: 650; color: var(--c-ink); font-size: var(--fs-13); }
    .skill-level {
      font-size: var(--fs-11); font-weight: 600; padding: 2px 8px;
      border-radius: var(--r-xs); align-self: flex-start;
    }
    .skill-level.lvl-1 { background: var(--c-surface-3); color: var(--c-muted); }
    .skill-level.lvl-2 { background: var(--c-info-soft); color: var(--c-info-ink); }
    .skill-level.lvl-3 { background: var(--c-brand-soft); color: var(--c-brand-ink); }
    .skill-level.lvl-4 { background: var(--c-accent-soft); color: var(--c-accent-ink); }
    .skill-level.lvl-5 { background: var(--c-success-soft); color: var(--c-success-ink); }
    .level-dots { display: flex; gap: 4px; }
    .level-dots .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-border-strong); }
    .level-dots .dot.filled { background: var(--c-accent); }

    .offer-actions { display: flex; gap: var(--sp-2); flex-wrap: wrap; }

    /* Historique */
    .history-body { display: flex; flex-direction: column; gap: var(--sp-2); }
    .history-top {
      display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
    }
    .history-title { font-size: var(--fs-15); margin: 0; }
    .history-meta {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: var(--fs-13); color: var(--c-muted);
    }
    .history-cover {
      margin: 4px 0 0; padding: var(--sp-3) var(--sp-4); background: var(--c-surface-2);
      border-radius: var(--r-md); font-size: var(--fs-13); color: var(--c-ink-soft);
      line-height: 1.5; border-left: 3px solid var(--c-border-strong);
    }

    /* Variantes de statut renvoyées par getStatusClass() */
    .badge.pending   { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .badge.interview { background: var(--c-info-soft);    color: var(--c-info-ink); }
    .badge.accepted  { background: var(--c-success-soft); color: var(--c-success-ink); }
    .badge.rejected  { background: var(--c-danger-soft);  color: var(--c-danger-ink); }

    /* Onglet actif (le binding reste [class.active]) */
    .tab.active { color: var(--c-accent-ink); border-bottom-color: var(--c-accent); }
    .tab.active .tab__count { background: var(--c-accent-soft); color: var(--c-accent-ink); }

    /* Modale */
    .modal__title-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

    @media (max-width: 640px) {
      .offer-head, .history-top { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class MyApplicationsComponent implements OnInit {
  activeTab = 'offers';
  activeOffers: any[] = [];
  myApplications: any[] = [];
  showApplyModal = false;
  selectedOffer: any = null;
  coverLetter = '';
  isAdmin = false;
  appliedOfferIds = new Set<number>();

  constructor(
    private recruitmentApi: RecruitmentApiService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.keycloakService.isHrAdmin();
    this.loadActiveOffers();
    if (!this.isAdmin) {
      this.loadMyApplications();
    }
  }

  loadActiveOffers(): void {
    this.recruitmentApi.getActiveOffers().subscribe({
      next: (data) => this.activeOffers = data,
      error: (err) => console.error('Erreur chargement offres:', err)
    });
  }

  loadMyApplications(): void {
    const username = this.keycloakService.getUserName();
    this.recruitmentApi.getMyApplications(username).subscribe({
      next: (data) => {
        this.myApplications = data;
        this.appliedOfferIds = new Set(data.map((app: any) => app.jobOfferId));
      },
      error: (err) => console.error('Erreur chargement candidatures:', err)
    });
  }

  hasApplied(offerId: number): boolean {
    return this.appliedOfferIds.has(offerId);
  }

  applyToOffer(offer: any): void {
    this.selectedOffer = offer;
    this.coverLetter = '';
    this.showApplyModal = true;
  }

  submitApplication(): void {
    const application = {
      jobOfferId: this.selectedOffer.id,
      employeeMatricule: this.keycloakService.getUserName(),
      applicantName: this.keycloakService.getFullName(),
      coverLetter: this.coverLetter
    };

    this.recruitmentApi.submitApplication(application).subscribe({
      next: () => {
        this.showApplyModal = false;
        this.appliedOfferIds.add(this.selectedOffer.id);
        this.loadMyApplications();
        this.activeTab = 'history';
      },
      error: (err) => console.error('Erreur soumission:', err)
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'pending';
      case 'ENTRETIEN': return 'interview';
      case 'RETENU': return 'accepted';
      case 'REFUSE': return 'rejected';
      default: return 'pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'ENTRETIEN': return 'Entretien';
      case 'RETENU': return 'Retenu';
      case 'REFUSE': return 'Refusé';
      default: return status;
    }
  }

  getRequiredLevel(offer: any, skillId: number): number {
    const levels = offer?.skillLevels || {};
    return levels[skillId] ?? levels[String(skillId)] ?? 3;
  }

  getLevelLabel(level: number): string {
    const labels: { [k: number]: string } = {
      1: 'Débutant', 2: 'Notions', 3: 'Intermédiaire', 4: 'Avancé', 5: 'Expert'
    };
    return labels[level] || '—';
  }
}
