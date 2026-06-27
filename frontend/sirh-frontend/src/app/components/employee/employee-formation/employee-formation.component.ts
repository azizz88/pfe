import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TrainingService,
  TrainingProposal,
  ProposalStatus,
  DeliveryMode
} from '../../../services/training.service';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-employee-formation',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="formation-page page fade-in">
      <header class="page-header">
        <div class="page-header__title">
          <h1>Mes formations</h1>
          <p class="page-header__sub">Propositions de formation reçues de votre manager.</p>
        </div>
      </header>

      <div class="loading-row" *ngIf="loading">
        <span class="spinner"></span> Chargement…
      </div>

      <div class="empty-state" *ngIf="!loading && proposals.length === 0">
        <div class="empty-state__icon"><app-icon name="inbox" [size]="28" /></div>
        <h3 class="empty-state__title">Aucune formation proposée</h3>
        <p class="empty-state__text">Vous serez notifié dès que votre manager vous proposera une formation.</p>
      </div>

      <!-- Section actions à prendre (PROPOSED) -->
      <section *ngIf="pendingProposals.length > 0" class="section">
        <h2 class="section-title"><app-icon name="notification" [size]="15" /> Action requise</h2>
        <div class="cards-grid">
          <article class="card pending" *ngFor="let p of pendingProposals">
            <div class="card__body">
              <div class="card-head">
                <h3 class="provider-name">{{ p.provider?.name }}</h3>
                <span class="badge badge--warning"><app-icon name="pending" [size]="13" /> Décision attendue</span>
              </div>

              <p class="provider-desc" *ngIf="p.provider?.description">{{ p.provider.description }}</p>

              <div class="meta-row">
                <span *ngIf="p.provider?.conventionStatus" class="badge" [ngClass]="conventionClass(p.provider.conventionStatus)">
                  {{ conventionLabel(p.provider.conventionStatus) }}
                </span>
                <span class="badge badge--success" *ngIf="p.provider?.qualiopiCertified">
                  <app-icon name="check" [size]="13" /> Qualiopi
                </span>
                <span *ngIf="p.provider?.deliveryMode" class="chip">{{ modeLabel(p.provider.deliveryMode) }}</span>
                <span *ngIf="p.provider?.avgDurationDays != null" class="chip">{{ p.provider.avgDurationDays }} jours</span>
                <a *ngIf="p.provider?.website" [href]="p.provider.website" target="_blank" class="provider-link">
                  <app-icon name="external" [size]="14" /> Voir l'organisme
                </a>
              </div>

              <div class="ai-block" *ngIf="p.aiJustification">
                <app-icon name="ai" [size]="16" class="ai-ic" />
                <p class="ai-justif">{{ p.aiJustification }}</p>
              </div>

              <p class="manager-from" *ngIf="p.managerName">Proposée par <strong>{{ p.managerName }}</strong></p>
            </div>

            <div class="card__footer actions">
              <button class="btn btn--accent" (click)="accept(p)" [disabled]="acting">
                <app-icon name="check" [size]="16" /> Accepter cette formation
              </button>
              <button class="btn btn--secondary" (click)="refuse(p)" [disabled]="acting">Refuser</button>
            </div>
          </article>
        </div>
      </section>

      <!-- Section formations en cours / passées -->
      <section *ngIf="otherProposals.length > 0" class="section">
        <h2 class="section-title"><app-icon name="directory" [size]="15" /> Mon historique</h2>
        <div class="cards-grid">
          <article class="card" *ngFor="let p of otherProposals">
            <div class="card__body">
              <div class="card-head">
                <h3 class="provider-name">{{ p.provider?.name }}</h3>
                <span class="badge" [ngClass]="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
              </div>

              <div class="meta-row">
                <span *ngIf="p.provider?.deliveryMode" class="chip">{{ modeLabel(p.provider.deliveryMode) }}</span>
                <span *ngIf="p.provider?.avgDurationDays != null" class="chip">{{ p.provider.avgDurationDays }} jours</span>
                <span *ngIf="p.enrollmentDate" class="chip">Inscrit le {{ formatDate(p.enrollmentDate) }}</span>
                <span *ngIf="p.completionDate" class="chip">Terminé le {{ formatDate(p.completionDate) }}</span>
              </div>

              <a *ngIf="p.certificateUrl" [href]="p.certificateUrl" target="_blank" class="btn btn--secondary btn--sm certificate-link">
                <app-icon name="document" [size]="15" /> Voir mon certificat
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .formation-page { padding-bottom: var(--sp-6); }

    .section { margin-bottom: var(--sp-7); }
    .section-title { margin-bottom: var(--sp-4); }

    .cards-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: var(--sp-4);
    }
    .cards-grid .card { display: flex; flex-direction: column; }
    .cards-grid .card__body { flex: 1 1 auto; display: flex; flex-direction: column; gap: var(--sp-3); }

    /* Carte en attente de décision : liseré d'accent rôle */
    .card.pending { border-color: var(--c-accent); }

    .card-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: var(--sp-3);
    }
    .provider-name { font-size: var(--fs-15); margin: 0; }

    .provider-desc { color: var(--c-muted); font-size: var(--fs-14); line-height: 1.55; margin: 0; }

    .meta-row { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; }

    .provider-link {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: var(--fs-13); font-weight: 500; color: var(--c-brand);
    }
    .provider-link:hover { color: var(--c-brand-strong); }

    /* Variantes de convention (conventionClass) */
    .badge.conventionne { background: var(--c-success-soft); color: var(--c-success-ink); }
    .badge.reference    { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .badge.nouveau      { background: var(--c-info-soft);    color: var(--c-info-ink); }

    /* Variantes de statut (statusClass) */
    .badge.proposed  { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .badge.accepted  { background: var(--c-info-soft);    color: var(--c-info-ink); }
    .badge.enrolled  { background: var(--c-brand-soft);   color: var(--c-brand-ink); }
    .badge.completed { background: var(--c-success-soft); color: var(--c-success-ink); }
    .badge.refused,
    .badge.abandoned { background: var(--c-danger-soft);  color: var(--c-danger-ink); }

    /* Bloc justification IA — teinté de l'accent rôle */
    .ai-block {
      display: flex; align-items: flex-start; gap: var(--sp-2);
      background: var(--c-accent-soft); border-radius: var(--r-md); padding: var(--sp-3);
    }
    .ai-ic { color: var(--c-accent-ink); margin-top: 1px; }
    .ai-justif { margin: 0; font-size: var(--fs-13); color: var(--c-accent-ink); line-height: 1.5; }

    .manager-from { margin: 0; font-size: var(--fs-13); color: var(--c-muted); }

    .actions { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
    .certificate-link { align-self: flex-start; text-decoration: none; }
  `]
})
export class EmployeeFormationComponent implements OnInit {

  proposals: TrainingProposal[] = [];
  loading = false;
  acting = false;

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.trainingService.listEmployeeProposals().subscribe({
      next: (data) => { this.proposals = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get pendingProposals(): TrainingProposal[] {
    return this.proposals.filter(p => p.status === 'PROPOSED');
  }

  get otherProposals(): TrainingProposal[] {
    return this.proposals.filter(p => p.status !== 'PROPOSED');
  }

  accept(p: TrainingProposal): void {
    if (!p.id) return;
    this.acting = true;
    this.trainingService.acceptProposal(p.id).subscribe({
      next: () => { this.acting = false; this.load(); },
      error: (err) => { this.acting = false; alert(err.error?.error || 'Erreur'); }
    });
  }

  refuse(p: TrainingProposal): void {
    if (!p.id) return;
    if (!confirm(`Refuser la formation chez ${p.provider?.name} ?`)) return;
    this.acting = true;
    this.trainingService.refuseProposal(p.id).subscribe({
      next: () => { this.acting = false; this.load(); },
      error: (err) => { this.acting = false; alert(err.error?.error || 'Erreur'); }
    });
  }

  statusLabel(s: ProposalStatus): string {
    return ({
      PROPOSED: 'En attente',
      ACCEPTED_BY_EMPLOYEE: 'Acceptée — inscription en cours',
      REFUSED_BY_EMPLOYEE: 'Refusée',
      ENROLLED: 'Formation en cours',
      COMPLETED: 'Terminée',
      ABANDONED: 'Abandonnée'
    } as Record<ProposalStatus, string>)[s];
  }
  statusClass(s: ProposalStatus): string {
    return ({
      PROPOSED: 'proposed', ACCEPTED_BY_EMPLOYEE: 'accepted', REFUSED_BY_EMPLOYEE: 'refused',
      ENROLLED: 'enrolled', COMPLETED: 'completed', ABANDONED: 'abandoned'
    } as Record<ProposalStatus, string>)[s];
  }
  conventionLabel(s: string): string {
    return s === 'CONVENTIONNE' ? 'Conventionné' : s === 'REFERENCE' ? 'Référencé' : 'Nouveau';
  }
  conventionClass(s: string): string { return s.toLowerCase(); }
  modeLabel(m: DeliveryMode): string {
    return m === 'PRESENTIEL' ? 'Présentiel' : m === 'DISTANCIEL' ? 'Distanciel' : 'Hybride';
  }
  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  }
}
