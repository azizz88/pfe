import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TrainingService,
  TrainingProposal,
  ProposalStatus,
  DeliveryMode
} from '../../../services/training.service';

@Component({
  selector: 'app-employee-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="formation-page">
      <div class="header">
        <div>
          <h1>🎓 Mes formations</h1>
          <p class="subtitle">Propositions de formation reçues de votre manager.</p>
        </div>
      </div>

      <div class="loading" *ngIf="loading">Chargement…</div>

      <div class="empty-state" *ngIf="!loading && proposals.length === 0">
        <div class="empty-icon">📭</div>
        <h3>Aucune formation proposée</h3>
        <p>Vous serez notifié dès que votre manager vous proposera une formation.</p>
      </div>

      <!-- Section actions à prendre (PROPOSED) -->
      <div *ngIf="pendingProposals.length > 0" class="section">
        <h2 class="section-title">⚡ Action requise</h2>
        <div class="cards-grid">
          <div class="card pending" *ngFor="let p of pendingProposals">
            <div class="card-head">
              <h3>{{ p.provider?.name }}</h3>
              <span class="status-badge proposed">⏳ Décision attendue</span>
            </div>

            <div class="provider-desc" *ngIf="p.provider?.description">{{ p.provider.description }}</div>

            <div class="meta-row">
              <span *ngIf="p.provider?.conventionStatus" class="badge" [ngClass]="conventionClass(p.provider.conventionStatus)">
                {{ conventionLabel(p.provider.conventionStatus) }}
              </span>
              <span class="badge qualiopi" *ngIf="p.provider?.qualiopiCertified">✓ Qualiopi</span>
              <span *ngIf="p.provider?.deliveryMode" class="meta-item">{{ modeLabel(p.provider.deliveryMode) }}</span>
              <span *ngIf="p.provider?.avgDurationDays != null" class="meta-item">{{ p.provider.avgDurationDays }} jours</span>
              <span *ngIf="p.provider?.website" class="meta-item">
                <a [href]="p.provider.website" target="_blank" class="link">🌐 Voir l'organisme</a>
              </span>
            </div>

            <div class="ai-block" *ngIf="p.aiJustification">
              <p class="ai-justif">💡 {{ p.aiJustification }}</p>
            </div>

            <p class="manager-from" *ngIf="p.managerName">Proposée par <strong>{{ p.managerName }}</strong></p>

            <div class="actions">
              <button class="btn-primary" (click)="accept(p)" [disabled]="acting">✓ Accepter cette formation</button>
              <button class="btn-ghost" (click)="refuse(p)" [disabled]="acting">Refuser</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section formations en cours / passées -->
      <div *ngIf="otherProposals.length > 0" class="section">
        <h2 class="section-title">📚 Mon historique</h2>
        <div class="cards-grid">
          <div class="card" *ngFor="let p of otherProposals">
            <div class="card-head">
              <h3>{{ p.provider?.name }}</h3>
              <span class="status-badge" [ngClass]="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
            </div>

            <div class="meta-row">
              <span *ngIf="p.provider?.deliveryMode" class="meta-item">{{ modeLabel(p.provider.deliveryMode) }}</span>
              <span *ngIf="p.provider?.avgDurationDays != null" class="meta-item">{{ p.provider.avgDurationDays }} jours</span>
              <span *ngIf="p.enrollmentDate" class="meta-item">Inscrit le {{ formatDate(p.enrollmentDate) }}</span>
              <span *ngIf="p.completionDate" class="meta-item">Terminé le {{ formatDate(p.completionDate) }}</span>
            </div>

            <a *ngIf="p.certificateUrl" [href]="p.certificateUrl" target="_blank" class="btn-link">📄 Voir mon certificat</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .formation-page { color:#0f172a; }
    .header { margin-bottom:24px; }
    .header h1 { color:#1e3a5f; margin:0 0 6px 0; font-size:1.6rem; }
    .subtitle { color:#64748b; margin:0; font-size:0.9rem; }

    .loading, .empty-state { text-align:center; padding:40px; color:#94a3b8; }
    .empty-state { background:#fff; border:1px dashed #cbd5e1; border-radius:12px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }

    .section { margin-bottom:32px; }
    .section-title { font-size:1.1rem; color:#1e3a5f; margin:0 0 14px 0; font-weight:600; }

    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(400px,1fr)); gap:14px; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(15,23,42,0.04); display:flex; flex-direction:column; gap:12px; }
    .card.pending { border-color:#fde68a; background:linear-gradient(180deg, #fffbeb 0%, #fff 50%); }
    .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .card-head h3 { margin:0; color:#0f172a; font-size:1.05rem; }

    .status-badge { padding:4px 11px; border-radius:999px; font-size:0.72rem; font-weight:600; white-space:nowrap; }
    .status-badge.proposed { background:#fef3c7; color:#92400e; }
    .status-badge.accepted { background:#dbeafe; color:#1e40af; }
    .status-badge.enrolled { background:#eff6ff; color:#1e3a5f; }
    .status-badge.completed { background:#dcfce7; color:#15803d; }
    .status-badge.refused, .status-badge.abandoned { background:#fee2e2; color:#991b1b; }

    .provider-desc { color:#475569; font-size:0.9rem; line-height:1.5; margin:0; }

    .meta-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; font-size:0.8rem; color:#64748b; }
    .meta-item { padding:2px 7px; background:#f1f5f9; border-radius:4px; }
    .link { color:#1e3a5f; text-decoration:none; font-weight:500; }
    .link:hover { text-decoration:underline; }

    .badge { padding:3px 10px; border-radius:999px; font-size:0.72rem; font-weight:600; }
    .badge.conventionne { background:#dcfce7; color:#15803d; }
    .badge.reference    { background:#fef9c3; color:#854d0e; }
    .badge.nouveau      { background:#dbeafe; color:#1e40af; }
    .badge.qualiopi     { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }

    .ai-block { background:#f8fafc; border-left:3px solid #1e3a5f; border-radius:6px; padding:10px 12px; }
    .ai-justif { margin:0; font-size:0.88rem; color:#334155; line-height:1.4; }

    .manager-from { margin:0; font-size:0.82rem; color:#64748b; font-style:italic; }

    .actions { display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px dashed #e2e8f0; }
    .btn-primary { padding:9px 16px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.88rem; font-weight:600; }
    .btn-primary:hover:not(:disabled) { background:#17304f; }
    .btn-primary:disabled { background:#94a3b8; cursor:not-allowed; }
    .btn-ghost { padding:9px 16px; background:transparent; border:1px solid #cbd5e1; color:#475569; border-radius:8px; cursor:pointer; font-size:0.88rem; }
    .btn-ghost:hover { background:#fef2f2; border-color:#ef4444; color:#991b1b; }
    .btn-link { display:inline-block; padding:8px 14px; color:#1e3a5f; text-decoration:none; font-size:0.85rem; font-weight:500; border:1px solid #cbd5e1; border-radius:6px; align-self:flex-start; }
    .btn-link:hover { background:#eff6ff; }
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
      ENROLLED: '🎯 Formation en cours',
      COMPLETED: '✓ Terminée',
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
    return s === 'CONVENTIONNE' ? '✓ Conventionné' : s === 'REFERENCE' ? 'Référencé' : 'Nouveau';
  }
  conventionClass(s: string): string { return s.toLowerCase(); }
  modeLabel(m: DeliveryMode): string {
    return m === 'PRESENTIEL' ? '📍 Présentiel' : m === 'DISTANCIEL' ? '💻 Distanciel' : '🔀 Hybride';
  }
  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  }
}
