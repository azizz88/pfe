import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

/**
 * Dashboard du manager : liste ses entretiens assignés avec filtres
 * (statut, type candidat) et permet de saisir notes/résultat.
 */
@Component({
  selector: 'app-manager-interviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">🎙️</div>
          <div>
            <h1>Mes Entretiens</h1>
            <p class="header-sub">Entretiens qui vous sont assignés</p>
          </div>
        </div>
      </div>

      <!-- Bannière "à planifier" (visible si au moins un en attente) -->
      <div class="pending-banner" *ngIf="pendingCount() > 0">
        <div class="pb-icon">📋</div>
        <div class="pb-body">
          <strong>{{ pendingCount() }} entretien(s) à planifier</strong>
          <p>Le RH vous a affecté ces candidats. Fixez date, heure et lieu pour envoyer la convocation officielle.</p>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters">
        <div class="filter">
          <label>Statut</label>
          <select [(ngModel)]="filterStatus" (change)="applyFilters()">
            <option value="">Tous</option>
            <option value="PENDING_SCHEDULING">📋 À planifier</option>
            <option value="SCHEDULED">⏰ À venir</option>
            <option value="COMPLETED">✅ Réalisés</option>
            <option value="CANCELLED">🚫 Annulés</option>
            <option value="REJECTED_BY_MANAGER">⛔ Refusés</option>
          </select>
        </div>
        <div class="filter">
          <label>Type candidat</label>
          <select [(ngModel)]="filterCandidateType" (change)="applyFilters()">
            <option value="">Tous</option>
            <option value="INTERNAL">Interne</option>
            <option value="EXTERNAL">Externe</option>
          </select>
        </div>
        <div class="stats">
          <span class="stat">{{ filtered.length }} / {{ interviews.length }} entretiens</span>
        </div>
      </div>

      <!-- Erreur de chargement -->
      <div class="error-banner" *ngIf="loadError">
        <span class="error-icon">⚠️</span>
        <span>{{ loadError }}</span>
        <button class="retry-btn" (click)="loadError = null; loadInterviews()">Réessayer</button>
      </div>

      <!-- Liste vide -->
      <div class="empty" *ngIf="!loadError && filtered.length === 0">
        <div class="empty-icon">📭</div>
        <p>Aucun entretien {{ filterStatus || filterCandidateType ? 'pour ces filtres' : 'assigné' }}.</p>
      </div>

      <!-- Cartes d'entretiens -->
      <div class="cards" *ngIf="filtered.length > 0">
        <div class="card" *ngFor="let it of filtered"
             [class.pending]="it.status === 'PENDING_SCHEDULING'"
             [class.upcoming]="it.status === 'SCHEDULED'"
             [class.done]="it.status === 'COMPLETED'"
             [class.cancelled]="it.status === 'CANCELLED'"
             [class.rejected]="it.status === 'REJECTED_BY_MANAGER'">

          <div class="card-head">
            <div class="card-date" *ngIf="it.status !== 'PENDING_SCHEDULING'">
              <div class="date-day">{{ formatDay(it.scheduledDate) }}</div>
              <div class="date-time">{{ formatTime(it.scheduledDate) }}</div>
            </div>
            <!-- Pour PENDING : afficher le SLA à la place de la date -->
            <div class="card-sla" *ngIf="it.status === 'PENDING_SCHEDULING'"
                 [class.warn]="slaHoursElapsed(it) >= 24 && slaHoursElapsed(it) < 48"
                 [class.danger]="slaHoursElapsed(it) >= 48">
              <div class="sla-label">Affecté il y a</div>
              <div class="sla-value">{{ slaLabel(it) }}</div>
            </div>

            <div class="card-meta">
              <span class="badge type" [class.internal]="it.candidateType === 'INTERNAL'"
                                       [class.external]="it.candidateType === 'EXTERNAL'">
                {{ it.candidateType === 'INTERNAL' ? '🏢 Interne' : it.candidateType === 'EXTERNAL' ? '🌐 Externe' : '—' }}
              </span>
              <span class="badge status" [attr.data-status]="it.status">
                {{ statusLabel(it.status) }}
              </span>
              <span class="badge matching" *ngIf="it.matchingCategory"
                    [attr.data-cat]="it.matchingCategory">
                {{ matchingLabel(it.matchingCategory) }}
                <span class="ms" *ngIf="it.matchingScore != null">{{ it.matchingScore }}/100</span>
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="row">
              <span class="lbl">Candidat</span>
              <span class="val">{{ it.candidateName || ('#' + it.applicationId) }}</span>
            </div>
            <div class="row" *ngIf="it.jobOfferTitle">
              <span class="lbl">💼 Poste</span>
              <span class="val">{{ it.jobOfferTitle }}</span>
            </div>
            <div class="row" *ngIf="it.location && it.status !== 'PENDING_SCHEDULING'">
              <span class="lbl">📍 Lieu</span>
              <span class="val">{{ it.location }}</span>
            </div>
            <div class="row" *ngIf="it.interviewer && it.status !== 'PENDING_SCHEDULING'">
              <span class="lbl">Intervieweur</span>
              <span class="val">{{ it.interviewer }}</span>
            </div>

            <!-- Note RH visible en PENDING -->
            <div class="rh-note" *ngIf="it.status === 'PENDING_SCHEDULING' && it.rhNote">
              <strong>📝 Note du RH :</strong>
              <p>{{ it.rhNote }}</p>
            </div>
            <!-- Motif de refus si refusé -->
            <div class="rejection-note" *ngIf="it.status === 'REJECTED_BY_MANAGER' && it.rejectionReason">
              <strong>⛔ Motif de refus :</strong>
              <p>{{ it.rejectionReason }}</p>
            </div>
          </div>

          <!-- Actions prioritaires pour PENDING -->
          <div class="pending-actions" *ngIf="it.status === 'PENDING_SCHEDULING'">
            <button class="btn-schedule" (click)="openScheduler(it)">📅 Planifier maintenant</button>
            <button class="btn-reject" (click)="openReject(it)">⛔ Refuser</button>
          </div>

          <!-- Édition inline -->
          <div class="card-edit" *ngIf="editingId === it.id">
            <div class="field">
              <label>Statut</label>
              <select [(ngModel)]="editForm.status">
                <option value="SCHEDULED">À venir</option>
                <option value="COMPLETED">Réalisé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
            <div class="field">
              <label>Résultat</label>
              <select [(ngModel)]="editForm.result">
                <option value="">—</option>
                <option value="POSITIF">✅ Positif</option>
                <option value="EN_COURS">⏳ En cours</option>
                <option value="NEGATIF">❌ Négatif</option>
              </select>
            </div>
            <div class="field full">
              <label>Lieu / Lien</label>
              <input [(ngModel)]="editForm.location" placeholder="Salle B204, ou https://meet.google.com/..." />
            </div>
            <div class="field full">
              <label>Notes / Compte-rendu</label>
              <textarea [(ngModel)]="editForm.notes" rows="4"
                        placeholder="Points clés discutés, ressenti, recommandation…"></textarea>
            </div>

            <!-- Aperçu de la promotion automatique si POSITIF + interne -->
            <div class="promotion-hint full"
                 *ngIf="editForm.result === 'POSITIF' && it.candidateType === 'INTERNAL'">
              <span class="ph-icon">🎯</span>
              <div>
                <strong>Validation positive</strong>
                <p>En enregistrant, <em>{{ it.candidateName }}</em> sera affecté au poste
                  <strong>« {{ it.jobOfferTitle }} »</strong> (statut de candidature : Retenu).
                  La mise à jour sera visible dans son espace employé.</p>
              </div>
            </div>

            <div class="edit-actions">
              <button class="btn-cancel" (click)="cancelEdit()">Annuler</button>
              <button class="btn-save" (click)="saveEdit(it)">💾 Enregistrer</button>
            </div>
          </div>

          <div class="card-foot" *ngIf="editingId !== it.id && it.status !== 'PENDING_SCHEDULING' && it.status !== 'REJECTED_BY_MANAGER'">
            <div class="notes-preview" *ngIf="it.notes">{{ it.notes }}</div>
            <div class="result-pill" *ngIf="it.result">
              <span [class.pos]="it.result === 'POSITIF'"
                    [class.neg]="it.result === 'NEGATIF' || it.result === 'NÉGATIF'"
                    [class.mid]="it.result === 'EN_COURS'">
                {{ resultLabel(it.result) }}
              </span>
            </div>

            <!-- Plan de formation déjà saisi : aperçu -->
            <div class="training-card" *ngIf="it.trainingPlan">
              <div class="tc-head">
                <span class="tc-icon">🎓</span>
                <strong>Formation recommandée</strong>
                <span class="tc-duration" *ngIf="it.trainingDuration">⏱ {{ it.trainingDuration }}</span>
              </div>
              <p class="tc-plan">{{ it.trainingPlan }}</p>
              <p class="tc-notes" *ngIf="it.trainingNotes"><em>{{ it.trainingNotes }}</em></p>
            </div>

            <!-- Carte verrouillée une fois l'entretien finalisé : on n'affiche plus que le badge. -->
            <div class="locked-badge" *ngIf="isLocked(it)">
              🔒 Entretien finalisé — modifications désactivées
            </div>

            <div class="foot-actions" *ngIf="!isLocked(it)">
              <button class="btn-edit" (click)="startEdit(it)">✏️ Mettre à jour</button>
              <!-- Bouton formation visible uniquement pour candidats internes À Former -->
              <button class="btn-training"
                      *ngIf="canRecommendTraining(it)"
                      (click)="openTraining(it)">
                🎓 {{ it.trainingPlan ? 'Modifier la formation' : 'Recommander une formation' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ Modal Planifier l'entretien (Manager) ═══════════ -->
      <div class="modal-overlay" *ngIf="showScheduleModal" (click)="closeScheduleModal()">
        <div class="modal-form" (click)="$event.stopPropagation()">
          <div class="mf-header">
            <div class="mf-icon">📅</div>
            <h3>Planifier l'entretien</h3>
            <p class="mf-sub" *ngIf="schedulingInterview">
              {{ schedulingInterview.candidateName }} — {{ schedulingInterview.jobOfferTitle }}
            </p>
          </div>
          <div class="mf-body">
            <div class="info-banner">
              <span>ℹ️</span>
              <span>
                En confirmant, un email de convocation officiel avec pièce jointe <code>.ics</code>
                (à ajouter au calendrier) sera envoyé au candidat.
              </span>
            </div>
            <div class="grid-2">
              <div class="field full">
                <label>Date et heure <span class="req">*</span></label>
                <input type="datetime-local" [(ngModel)]="scheduleForm.scheduledDate" />
              </div>
              <div class="field full">
                <label>Lieu ou lien visio</label>
                <input [(ngModel)]="scheduleForm.location"
                       placeholder="Ex: Salle B204, ou https://meet.google.com/abc-defg-hij" />
              </div>
              <div class="field full">
                <label>Intervieweur affiché <span class="opt">(optionnel)</span></label>
                <input [(ngModel)]="scheduleForm.interviewer"
                       placeholder="Par défaut : votre nom" />
              </div>
            </div>
          </div>
          <div class="mf-footer">
            <button class="btn-cancel" (click)="closeScheduleModal()">Annuler</button>
            <button class="btn-save" [disabled]="scheduleSaving" (click)="submitSchedule()">
              {{ scheduleSaving ? '⏳ Envoi…' : '✅ Confirmer & envoyer convocation' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ Modal Refuser l'affectation (Manager) ═══════════ -->
      <div class="modal-overlay" *ngIf="showRejectModal" (click)="closeRejectModal()">
        <div class="modal-form" (click)="$event.stopPropagation()">
          <div class="mf-header rejecting">
            <div class="mf-icon">⛔</div>
            <h3>Refuser cette affectation</h3>
            <p class="mf-sub" *ngIf="schedulingInterview">
              {{ schedulingInterview.candidateName }} — {{ schedulingInterview.jobOfferTitle }}
            </p>
          </div>
          <div class="mf-body">
            <div class="info-banner warn">
              <span>⚠️</span>
              <span>
                Le RH sera notifié par email et devra réaffecter cet entretien à un autre manager.
                Merci d'expliquer brièvement pourquoi.
              </span>
            </div>
            <div class="field full">
              <label>Motif du refus <span class="req">*</span></label>
              <textarea [(ngModel)]="rejectForm.reason" rows="4"
                        placeholder="Ex: Absence du XX au YY, conflit d'intérêt, périmètre hors de ma compétence..."></textarea>
            </div>
          </div>
          <div class="mf-footer">
            <button class="btn-cancel" (click)="closeRejectModal()">Annuler</button>
            <button class="btn-reject-confirm" [disabled]="rejectSaving || !rejectForm.reason" (click)="submitReject()">
              {{ rejectSaving ? '⏳ Envoi…' : '⛔ Confirmer le refus' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ Modal Recommandation de formation (Manager) ═══════════ -->
      <div class="modal-overlay" *ngIf="showTrainingModal" (click)="closeTrainingModal()">
        <div class="modal-form" (click)="$event.stopPropagation()">
          <div class="mf-header training-head">
            <div class="mf-icon">🎓</div>
            <h3>Recommander une formation</h3>
            <p class="mf-sub" *ngIf="trainingInterview">
              {{ trainingInterview.candidateName }} — {{ trainingInterview.jobOfferTitle }}
            </p>
          </div>
          <div class="mf-body">
            <div class="info-banner training-banner">
              <span>💡</span>
              <span>
                Ce candidat a été classé <strong>À Former</strong> par le matching IA
                <span *ngIf="trainingInterview?.matchingScore != null">(score {{ trainingInterview.matchingScore }}/100)</span>.
                Décrivez le plan de formation à suivre pour qu'il atteigne le niveau idéal du poste.
              </span>
            </div>
            <div class="field full">
              <label>Plan de formation <span class="req">*</span></label>
              <textarea [(ngModel)]="trainingForm.trainingPlan" rows="4"
                        placeholder="Ex: Formation Spring Boot avancé + mentorat sur l'architecture microservices, ateliers pratiques sur Docker/Kubernetes…"></textarea>
            </div>
            <div class="field full">
              <label>Durée estimée <span class="opt">(optionnel)</span></label>
              <input [(ngModel)]="trainingForm.trainingDuration"
                     placeholder="Ex: 2 semaines, 3 mois, 40h…" />
            </div>
            <div class="field full">
              <label>Notes complémentaires <span class="opt">(optionnel)</span></label>
              <textarea [(ngModel)]="trainingForm.trainingNotes" rows="3"
                        placeholder="Mentor proposé, planning, objectifs mesurables…"></textarea>
            </div>
          </div>
          <div class="mf-footer">
            <button class="btn-cancel" (click)="closeTrainingModal()">Annuler</button>
            <button class="btn-training-confirm"
                    [disabled]="trainingSaving || !trainingForm.trainingPlan"
                    (click)="submitTraining()">
              {{ trainingSaving ? '⏳ Envoi…' : '🎓 Enregistrer la formation' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { animation: fadeIn 0.4s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .header-icon { font-size:2.2rem; }
    .page-header h1 { margin:0; font-size:1.6rem; font-weight:800; background:linear-gradient(135deg,#1e3a5f,#3b82f6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .header-sub { margin:4px 0 0; color:#64748b; font-size:0.88rem; }

    .filters {
      display:flex; gap:14px; align-items:flex-end; flex-wrap:wrap;
      background:white; padding:14px 18px; border-radius:14px;
      border:1px solid #e2e8f0; margin-bottom:20px;
    }
    .filter { display:flex; flex-direction:column; gap:5px; min-width:160px; }
    .filter label { font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; }
    .filter select {
      padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;
      font-size:0.88rem; outline:none; background:white;
    }
    .filter select:focus { border-color:#3b82f6; }
    .stats { margin-left:auto; }
    .stat { font-size:0.85rem; color:#475569; font-weight:600; background:#eff6ff; padding:8px 14px; border-radius:8px; }

    .empty { text-align:center; padding:60px 20px; background:white; border-radius:14px; border:1px dashed #cbd5e1; }
    .empty-icon { font-size:3rem; margin-bottom:10px; }
    .empty p { color:#64748b; font-size:0.95rem; }

    .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); gap:16px; }
    .card {
      background:white; border-radius:14px; padding:18px 20px;
      border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04);
      transition:all 0.2s ease; border-left:4px solid #cbd5e1;
    }
    .card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.08); }
    .card.upcoming { border-left-color:#3b82f6; }
    .card.done { border-left-color:#10b981; }
    .card.cancelled { border-left-color:#94a3b8; opacity:0.75; }

    .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:14px; }
    .card-date { text-align:center; min-width:80px; }
    .date-day { font-size:0.95rem; font-weight:700; color:#1e293b; line-height:1.2; }
    .date-time { font-size:0.82rem; color:#3b82f6; font-weight:600; margin-top:2px; }
    .card-meta { display:flex; flex-direction:column; gap:6px; align-items:flex-end; }
    .badge { padding:3px 10px; border-radius:14px; font-size:0.72rem; font-weight:700; white-space:nowrap; }
    .badge.type.internal { background:#dbeafe; color:#1e40af; }
    .badge.type.external { background:#fef3c7; color:#92400e; }
    .badge.status[data-status="SCHEDULED"] { background:#e0e7ff; color:#3730a3; }
    .badge.status[data-status="COMPLETED"] { background:#dcfce7; color:#166534; }
    .badge.status[data-status="CANCELLED"] { background:#f1f5f9; color:#475569; }

    .card-body { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
    .row { display:flex; justify-content:space-between; font-size:0.84rem; }
    .row .lbl { color:#64748b; font-weight:500; }
    .row .val { color:#1e293b; font-weight:600; }

    .card-foot { display:flex; flex-direction:column; gap:8px; }
    .notes-preview {
      background:#f8fafc; border-left:3px solid #cbd5e1;
      padding:8px 12px; border-radius:6px; font-size:0.82rem;
      color:#475569; max-height:80px; overflow:hidden; line-height:1.5;
    }
    .result-pill span {
      display:inline-block; padding:4px 12px; border-radius:14px;
      font-size:0.78rem; font-weight:700;
    }
    .result-pill span.pos { background:#dcfce7; color:#166534; }
    .result-pill span.neg { background:#fee2e2; color:#991b1b; }
    .result-pill span.mid { background:#fef3c7; color:#92400e; }

    .btn-edit {
      padding:8px 14px; background:linear-gradient(135deg,#3b82f6,#2563eb);
      color:white; border:none; border-radius:8px; cursor:pointer;
      font-size:0.82rem; font-weight:600; align-self:flex-start;
      transition:all 0.2s;
    }
    .btn-edit:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(37,99,235,0.3); }

    .card-edit {
      display:grid; grid-template-columns:1fr 1fr; gap:10px;
      padding-top:14px; border-top:1px solid #f1f5f9;
    }
    .card-edit .field { display:flex; flex-direction:column; gap:4px; }
    .card-edit .field.full { grid-column:span 2; }
    .card-edit .field label { font-size:0.7rem; font-weight:700; color:#64748b; text-transform:uppercase; }
    .card-edit input, .card-edit select, .card-edit textarea {
      padding:8px 10px; border:2px solid #e2e8f0; border-radius:8px;
      font-size:0.85rem; outline:none; font-family:inherit; resize:vertical;
    }
    .card-edit input:focus, .card-edit select:focus, .card-edit textarea:focus { border-color:#3b82f6; }
    .edit-actions { grid-column:span 2; display:flex; gap:8px; justify-content:flex-end; margin-top:6px; }
    .btn-cancel { padding:8px 14px; border:2px solid #e2e8f0; background:white; border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600; color:#64748b; }
    .btn-save { padding:8px 14px; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:700; }

    .error-banner { display:flex; align-items:center; gap:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:14px 18px; margin-bottom:18px; color:#dc2626; font-size:0.88rem; }
    .error-icon { font-size:1.2rem; flex-shrink:0; }
    .retry-btn { margin-left:auto; padding:6px 16px; background:#dc2626; color:white; border:none; border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600; }

    /* ══════════════ État PENDING_SCHEDULING ══════════════ */
    .pending-banner {
      display:flex; align-items:center; gap:14px;
      background:linear-gradient(135deg,#fffbeb,#fef3c7);
      border:1px solid #fde68a; border-radius:14px;
      padding:16px 20px; margin-bottom:20px;
    }
    .pb-icon { font-size:2rem; }
    .pb-body strong { display:block; color:#854d0e; font-size:1rem; }
    .pb-body p { margin:4px 0 0; color:#92400e; font-size:0.85rem; }

    .card.pending {
      border-left-color:#f59e0b;
      background:linear-gradient(180deg,#fffbeb 0%,white 60%);
    }
    .card.rejected { border-left-color:#dc2626; opacity:0.85; }

    .card-sla { text-align:center; min-width:90px; padding:4px 8px; border-radius:10px; background:#f0fdf4; }
    .card-sla.warn { background:#fef3c7; }
    .card-sla.danger { background:#fee2e2; }
    .sla-label { font-size:0.7rem; color:#64748b; font-weight:600; text-transform:uppercase; }
    .sla-value { font-size:0.95rem; font-weight:800; color:#1e293b; margin-top:2px; }
    .card-sla.warn .sla-value { color:#92400e; }
    .card-sla.danger .sla-value { color:#991b1b; }

    .badge.status[data-status="PENDING_SCHEDULING"] { background:#fef3c7; color:#92400e; }
    .badge.status[data-status="REJECTED_BY_MANAGER"] { background:#fee2e2; color:#991b1b; }

    .rh-note {
      background:#fffbeb; border-left:3px solid #f59e0b;
      padding:10px 12px; border-radius:6px;
      margin-top:8px;
    }
    .rh-note strong { font-size:0.78rem; color:#854d0e; }
    .rh-note p { margin:4px 0 0; font-size:0.84rem; color:#713f12; line-height:1.4; }
    .rejection-note {
      background:#fef2f2; border-left:3px solid #dc2626;
      padding:10px 12px; border-radius:6px; margin-top:8px;
    }
    .rejection-note strong { font-size:0.78rem; color:#991b1b; }
    .rejection-note p { margin:4px 0 0; font-size:0.84rem; color:#7f1d1d; line-height:1.4; }

    .pending-actions {
      display:flex; gap:10px; padding-top:12px; border-top:1px dashed #fde68a;
    }
    .btn-schedule {
      flex:1; padding:10px 16px;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      color:white; border:none; border-radius:10px;
      cursor:pointer; font-size:0.88rem; font-weight:700;
      box-shadow:0 3px 10px rgba(245,158,11,0.3);
      transition:all 0.2s;
    }
    .btn-schedule:hover { transform:translateY(-1px); box-shadow:0 5px 14px rgba(245,158,11,0.4); }
    .btn-reject {
      padding:10px 14px; background:white; color:#dc2626;
      border:2px solid #fecaca; border-radius:10px;
      cursor:pointer; font-size:0.82rem; font-weight:700;
      transition:all 0.15s;
    }
    .btn-reject:hover { background:#fef2f2; border-color:#fca5a5; }

    /* ══════════════ Modals (planif + refus) ══════════════ */
    .modal-overlay {
      position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center; z-index:1000;
      animation:fadeIn 0.2s ease;
    }
    .modal-form {
      background:white; border-radius:20px; width:94%; max-width:560px;
      max-height:90vh; overflow-y:auto; box-shadow:0 24px 48px rgba(0,0,0,0.2);
    }
    .mf-header {
      text-align:center; padding:24px 24px 14px;
      background:linear-gradient(135deg,#fffbeb,#fef3c7);
      border-bottom:1px solid #fde68a;
    }
    .mf-header.rejecting { background:linear-gradient(135deg,#fef2f2,#fee2e2); border-bottom-color:#fecaca; }
    .mf-header .mf-icon { font-size:2rem; }
    .mf-header h3 { margin:6px 0 4px; color:#1e293b; font-size:1.2rem; font-weight:800; }
    .mf-sub { margin:0; color:#64748b; font-size:0.86rem; }
    .mf-body { padding:20px 24px; display:flex; flex-direction:column; gap:14px; }
    .info-banner {
      display:flex; align-items:flex-start; gap:8px;
      background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;
      padding:10px 14px; font-size:0.83rem; color:#1e40af; line-height:1.45;
    }
    .info-banner.warn { background:#fef3c7; border-color:#fde68a; color:#92400e; }
    .info-banner code { background:white; padding:1px 6px; border-radius:4px; font-size:0.78rem; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .grid-2 .field.full { grid-column:span 2; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:0.74rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; }
    .field label .req { color:#dc2626; margin-left:3px; }
    .field label .opt { color:#94a3b8; font-weight:400; margin-left:6px; font-size:0.7rem; text-transform:none; }
    .field input, .field textarea {
      padding:10px 12px; border:2px solid #e2e8f0; border-radius:10px;
      font-size:0.88rem; outline:none; font-family:inherit; resize:vertical;
      background:white; color:#1e293b; transition:all 0.2s;
    }
    .field input:focus, .field textarea:focus { border-color:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,0.1); }
    .mf-footer {
      display:flex; justify-content:flex-end; gap:10px;
      padding:14px 24px 20px; border-top:1px solid #f1f5f9;
    }
    .btn-reject-confirm {
      padding:10px 18px; background:linear-gradient(135deg,#dc2626,#b91c1c);
      color:white; border:none; border-radius:10px;
      cursor:pointer; font-size:0.86rem; font-weight:700;
      box-shadow:0 3px 10px rgba(220,38,38,0.3);
    }
    .btn-reject-confirm:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 14px rgba(220,38,38,0.4); }
    .btn-reject-confirm:disabled, .btn-save:disabled, .btn-training-confirm:disabled { opacity:0.5; cursor:not-allowed; box-shadow:none; }

    /* ══════════════ Badge matching (À Former / Idéal / Externe) ══════════════ */
    .badge.matching { display:inline-flex; align-items:center; gap:6px; }
    .badge.matching[data-cat="TRAINING"] { background:#fef3c7; color:#92400e; }
    .badge.matching[data-cat="IDEAL"] { background:#dcfce7; color:#166534; }
    .badge.matching[data-cat="EXTERNAL"] { background:#fee2e2; color:#991b1b; }
    .badge.matching .ms { font-size:0.66rem; opacity:0.7; font-weight:600; }

    /* ══════════════ Aperçu plan de formation enregistré ══════════════ */
    .training-card {
      background:linear-gradient(135deg,#fffbeb,#fef3c7);
      border:1px solid #fde68a; border-left:4px solid #f59e0b;
      border-radius:10px; padding:10px 14px;
      display:flex; flex-direction:column; gap:6px;
    }
    .tc-head { display:flex; align-items:center; gap:8px; color:#854d0e; font-size:0.85rem; }
    .tc-icon { font-size:1.05rem; }
    .tc-duration {
      margin-left:auto; background:white; padding:2px 10px;
      border-radius:10px; font-size:0.74rem; color:#92400e; font-weight:600;
    }
    .tc-plan { margin:0; font-size:0.85rem; color:#713f12; line-height:1.5; white-space:pre-wrap; }
    .tc-notes { margin:0; font-size:0.78rem; color:#92400e; line-height:1.45; }

    /* ══════════════ Actions du card-foot ══════════════ */
    .foot-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .btn-training {
      padding:8px 14px;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      color:white; border:none; border-radius:8px; cursor:pointer;
      font-size:0.82rem; font-weight:700;
      box-shadow:0 2px 8px rgba(245,158,11,0.25);
      transition:all 0.2s;
    }
    .btn-training:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(245,158,11,0.35); }

    /* ══════════════ Modal training ══════════════ */
    .mf-header.training-head {
      background:linear-gradient(135deg,#fffbeb,#fef3c7);
      border-bottom-color:#fde68a;
    }
    .info-banner.training-banner { background:#fef3c7; border-color:#fde68a; color:#92400e; }
    .btn-training-confirm {
      padding:10px 18px;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      color:white; border:none; border-radius:10px;
      cursor:pointer; font-size:0.86rem; font-weight:700;
      box-shadow:0 3px 10px rgba(245,158,11,0.3);
    }
    .btn-training-confirm:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 14px rgba(245,158,11,0.4); }

    /* ══════════════ Hint promotion automatique (POSITIF + interne) ══════════════ */
    .promotion-hint {
      display:flex; gap:12px; align-items:flex-start;
      background:linear-gradient(135deg,#ecfdf5,#dcfce7);
      border:1px solid #86efac; border-left:4px solid #10b981;
      border-radius:10px; padding:12px 14px;
    }
    .promotion-hint.full { grid-column:span 2; }
    .ph-icon { font-size:1.4rem; flex-shrink:0; }
    .promotion-hint strong { display:block; color:#065f46; font-size:0.88rem; }
    .promotion-hint p { margin:4px 0 0; color:#047857; font-size:0.82rem; line-height:1.45; }
    .promotion-hint p strong { display:inline; color:#064e3b; }

    /* ══════════════ Carte verrouillée (entretien finalisé) ══════════════ */
    .locked-badge {
      display:flex; align-items:center; justify-content:center; gap:8px;
      background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:10px;
      padding:8px 12px; font-size:0.8rem; color:#475569; font-weight:600;
      letter-spacing:0.2px;
    }
  `]
})
export class ManagerInterviewsComponent implements OnInit {
  interviews: any[] = [];
  filtered: any[] = [];
  filterStatus = '';
  filterCandidateType = '';
  loadError: string | null = null;

  editingId: number | null = null;
  editForm: any = {};

  // Planification (phase 2) par le manager
  showScheduleModal = false;
  schedulingInterview: any = null;
  scheduleForm: any = { scheduledDate: '', location: '', interviewer: '' };
  scheduleSaving = false;

  // Refus de l'affectation
  showRejectModal = false;
  rejectForm: { reason: string } = { reason: '' };
  rejectSaving = false;

  // Recommandation de formation (candidats "À Former")
  showTrainingModal = false;
  trainingInterview: any = null;
  trainingForm: { trainingPlan: string; trainingDuration: string; trainingNotes: string } =
    { trainingPlan: '', trainingDuration: '', trainingNotes: '' };
  trainingSaving = false;

  constructor(
    private recruitmentApi: RecruitmentApiService,
    private router: Router
  ) {}

  ngOnInit(): void { this.loadInterviews(); }

  /** Nombre d'entretiens en attente de planification. */
  pendingCount(): number {
    return this.interviews.filter(i => i.status === 'PENDING_SCHEDULING').length;
  }

  loadInterviews(): void {
    this.recruitmentApi.getMyInterviews().subscribe({
      next: (data) => {
        this.interviews = data || [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur chargement entretiens:', err);
        this.loadError = 'Impossible de charger vos entretiens.';
      }
    });
  }

  applyFilters(): void {
    this.filtered = this.interviews.filter(it => {
      if (this.filterStatus && it.status !== this.filterStatus) return false;
      if (this.filterCandidateType && it.candidateType !== this.filterCandidateType) return false;
      return true;
    });
  }

  startEdit(it: any): void {
    this.editingId = it.id;
    this.editForm = {
      status: it.status || 'SCHEDULED',
      result: it.result || '',
      notes: it.notes || '',
      location: it.location || ''
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm = {};
  }

  saveEdit(it: any): void {
    const wasPositive = it.result === 'POSITIF';
    const willPromote = this.editForm.result === 'POSITIF'
        && !wasPositive
        && it.candidateType === 'INTERNAL';

    const payload = {
      status: this.editForm.status,
      result: this.editForm.result || null,
      notes: this.editForm.notes || null,
      location: this.editForm.location || null
    };
    this.recruitmentApi.updateInterview(it.id, payload).subscribe({
      next: (updated) => {
        Object.assign(it, updated);
        this.cancelEdit();
        this.applyFilters();
        if (willPromote) {
          alert(`✅ Entretien validé !\n${it.candidateName} a été affecté au poste « ${it.jobOfferTitle} ». La candidature est passée en statut RETENU et le profil de l'employé a été mis à jour.`);
        }
      },
      error: (err) => alert('Erreur mise à jour : ' + (err.error?.message || err.message))
    });
  }

  formatDay(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  }
  formatTime(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }
  statusLabel(s: string): string {
    switch (s) {
      case 'PENDING_SCHEDULING': return '📋 À planifier';
      case 'SCHEDULED': return '⏰ À venir';
      case 'COMPLETED': return '✅ Réalisé';
      case 'CANCELLED': return '🚫 Annulé';
      case 'REJECTED_BY_MANAGER': return '⛔ Refusé';
      default: return '—';
    }
  }
  resultLabel(r: string): string {
    if (r === 'POSITIF') return '✅ Positif';
    if (r === 'NEGATIF' || r === 'NÉGATIF') return '❌ Négatif';
    if (r === 'EN_COURS') return '⏳ En cours';
    return r;
  }

  /** Libellé lisible de la catégorie de matching IA. */
  matchingLabel(cat: string): string {
    if (cat === 'IDEAL') return '⭐ Idéal';
    if (cat === 'TRAINING') return '🎓 À Former';
    if (cat === 'EXTERNAL') return '🌐 Externe';
    return cat;
  }

  /**
   * Le bouton "Recommander une formation" s'affiche pour :
   * - les candidats internes (les externes ne sont pas formés en interne),
   * - classés TRAINING par le matching IA,
   * - dont l'entretien n'a pas été refusé,
   * - tant que l'entretien n'est pas verrouillé (résultat finalisé).
   */
  canRecommendTraining(it: any): boolean {
    return it
        && it.candidateType === 'INTERNAL'
        && it.matchingCategory === 'TRAINING'
        && it.status !== 'REJECTED_BY_MANAGER'
        && !this.isLocked(it);
  }

  /**
   * Verrouille la carte dès qu'un état final est atteint :
   *  - résultat POSITIF ou NEGATIF saisi (peu importe le statut workflow — la décision est prise),
   *  - statut CANCELLED ou REJECTED_BY_MANAGER (entretien annulé / refusé par le manager).
   *
   * Dans tous ces cas, plus aucune mise à jour entretien ni modification formation n'est possible
   * (cohérent avec la décision côté RH qui passe l'application en REFUSE/RETENU).
   */
  isLocked(it: any): boolean {
    if (!it) return false;
    if (it.status === 'CANCELLED' || it.status === 'REJECTED_BY_MANAGER') return true;
    const r = (it.result || '').toString().toUpperCase();
    return r === 'POSITIF' || r === 'NEGATIF' || r === 'NÉGATIF';
  }

  // ─── SLA "temps écoulé depuis l'affectation" ─────────────────────

  /** Heures écoulées depuis l'affectation (0 si aucun horodatage). */
  slaHoursElapsed(it: any): number {
    if (!it?.assignedAt) return 0;
    const assigned = new Date(it.assignedAt).getTime();
    return Math.max(0, (Date.now() - assigned) / (1000 * 60 * 60));
  }

  slaLabel(it: any): string {
    const hours = this.slaHoursElapsed(it);
    if (hours < 1) return 'moins d\'1h';
    if (hours < 24) return Math.floor(hours) + 'h';
    const days = Math.floor(hours / 24);
    return days + 'j ' + Math.floor(hours - days * 24) + 'h';
  }

  // ─── Phase 2 : planifier (manager) ─────────────────────────────

  openScheduler(it: any): void {
    this.schedulingInterview = it;
    this.scheduleForm = {
      scheduledDate: '',
      location: it.location || '',
      interviewer: ''
    };
    this.showScheduleModal = true;
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.schedulingInterview = null;
    this.scheduleSaving = false;
  }

  submitSchedule(): void {
    if (!this.schedulingInterview || !this.scheduleForm.scheduledDate) {
      alert('Date et heure obligatoires.');
      return;
    }
    this.scheduleSaving = true;
    this.recruitmentApi.scheduleInterviewByManager(this.schedulingInterview.id, {
      scheduledDate: this.scheduleForm.scheduledDate,
      location: this.scheduleForm.location || null,
      interviewer: this.scheduleForm.interviewer || null
    }).subscribe({
      next: () => {
        alert('✅ Entretien planifié. La convocation a été envoyée au candidat.');
        this.closeScheduleModal();
        this.loadInterviews();
      },
      error: (err) => {
        this.scheduleSaving = false;
        alert('Erreur : ' + (err.error?.message || err.message));
      }
    });
  }

  // ─── Refus d'affectation ─────────────────────────────────────

  openReject(it: any): void {
    this.schedulingInterview = it;
    this.rejectForm = { reason: '' };
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.schedulingInterview = null;
    this.rejectSaving = false;
  }

  submitReject(): void {
    if (!this.schedulingInterview || !this.rejectForm.reason) return;
    this.rejectSaving = true;
    this.recruitmentApi.rejectInterviewAssignment(
      this.schedulingInterview.id, this.rejectForm.reason
    ).subscribe({
      next: () => {
        alert('Affectation refusée. Le RH a été notifié pour réaffecter.');
        this.closeRejectModal();
        this.loadInterviews();
      },
      error: (err) => {
        this.rejectSaving = false;
        alert('Erreur : ' + (err.error?.message || err.message));
      }
    });
  }

  // ─── Recommandation de formation pour candidat "À Former" ─────────

  openTraining(it: any): void {
    // 1. Récupère le contexte (matricule + missing skills) puis navigue vers /manager/formation
    //    avec tout pré-rempli ; le modal s'auto-ouvrira et la suggestion IA se déclenchera.
    if (!it.applicationId) {
      alert('Impossible de proposer une formation : candidature non identifiée.');
      return;
    }
    this.recruitmentApi.getTrainingContext(it.applicationId).subscribe({
      next: (ctx) => {
        const missingIds: number[] = ctx.missingSkillIds || [];
        this.router.navigate(['/manager/formation'], {
          queryParams: {
            employeeMatricule: ctx.employeeMatricule || '',
            employeeName: ctx.employeeName || it.candidateName || '',
            employeeEmail: it.candidateEmail || '',
            applicationId: it.applicationId,
            missingSkillIds: missingIds.join(','),
            autoOpen: '1',
            autoSuggest: missingIds.length > 0 ? '1' : '0'
          }
        });
      },
      error: () => {
        // Fallback : navigation sans missing skills si l'endpoint plante.
        this.router.navigate(['/manager/formation'], {
          queryParams: {
            employeeName: it.candidateName || '',
            employeeEmail: it.candidateEmail || '',
            applicationId: it.applicationId,
            autoOpen: '1'
          }
        });
      }
    });
  }

  closeTrainingModal(): void {
    this.showTrainingModal = false;
    this.trainingInterview = null;
    this.trainingSaving = false;
  }

  submitTraining(): void {
    if (!this.trainingInterview || !this.trainingForm.trainingPlan) return;
    this.trainingSaving = true;
    this.recruitmentApi.recommendTrainingByManager(this.trainingInterview.id, {
      trainingPlan: this.trainingForm.trainingPlan,
      trainingDuration: this.trainingForm.trainingDuration || undefined,
      trainingNotes: this.trainingForm.trainingNotes || undefined
    }).subscribe({
      next: (updated) => {
        const idx = this.interviews.findIndex(i => i.id === this.trainingInterview.id);
        if (idx >= 0) Object.assign(this.interviews[idx], updated);
        alert('✅ Plan de formation enregistré. Le RH le verra dans le pipeline.');
        this.closeTrainingModal();
        this.applyFilters();
      },
      error: (err) => {
        this.trainingSaving = false;
        alert('Erreur : ' + (err.error?.message || err.message));
      }
    });
  }
}
