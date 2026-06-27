import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Dashboard du manager : liste ses entretiens assignés avec filtres
 * (statut, type candidat) et permet de saisir notes/résultat.
 */
@Component({
  selector: 'app-manager-interviews',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="page fade-in">
      <header class="page-header">
        <div class="iv-titlewrap">
          <span class="iv-title-icon"><app-icon name="interview" [size]="20" /></span>
          <div class="page-header__title">
            <h1>Mes Entretiens</h1>
            <span class="page-header__sub">Entretiens qui vous sont assignés</span>
          </div>
        </div>
      </header>

      <!-- Bannière "à planifier" (visible si au moins un en attente) -->
      <div class="alert alert--warning iv-pending-banner" *ngIf="pendingCount() > 0">
        <app-icon class="alert__icon" name="calendar-clock" [size]="20" />
        <div>
          <strong>{{ pendingCount() }} entretien(s) à planifier</strong>
          <p>Le RH vous a affecté ces candidats. Fixez date, heure et lieu pour envoyer la convocation officielle.</p>
        </div>
      </div>

      <!-- Filtres -->
      <div class="card iv-filters">
        <div class="card__body iv-filters__body">
          <div class="field iv-filters__field">
            <label class="label" for="f-status">Statut</label>
            <select class="select" id="f-status" [(ngModel)]="filterStatus" (change)="applyFilters()">
              <option value="">Tous</option>
              <option value="PENDING_SCHEDULING">À planifier</option>
              <option value="SCHEDULED">À venir</option>
              <option value="COMPLETED">Réalisés</option>
              <option value="CANCELLED">Annulés</option>
              <option value="REJECTED_BY_MANAGER">Refusés</option>
            </select>
          </div>
          <div class="field iv-filters__field">
            <label class="label" for="f-type">Type candidat</label>
            <select class="select" id="f-type" [(ngModel)]="filterCandidateType" (change)="applyFilters()">
              <option value="">Tous</option>
              <option value="INTERNAL">Interne</option>
              <option value="EXTERNAL">Externe</option>
            </select>
          </div>
          <div class="iv-filters__spacer"></div>
          <span class="badge badge--neutral iv-count">{{ filtered.length }} / {{ interviews.length }} entretiens</span>
        </div>
      </div>

      <!-- Erreur de chargement -->
      <div class="alert alert--danger iv-error" *ngIf="loadError">
        <app-icon class="alert__icon" name="warning" [size]="18" />
        <span class="iv-error__msg">{{ loadError }}</span>
        <button class="btn btn--secondary btn--sm" (click)="loadError = null; loadInterviews()">
          <app-icon name="refresh" [size]="15" /> Réessayer
        </button>
      </div>

      <!-- Liste vide -->
      <div class="empty-state" *ngIf="!loadError && filtered.length === 0">
        <div class="empty-state__icon"><app-icon name="inbox" [size]="26" /></div>
        <div class="empty-state__title">Aucun entretien</div>
        <p class="empty-state__text">
          {{ filterStatus || filterCandidateType
              ? 'Aucun entretien ne correspond à ces filtres.'
              : 'Aucun entretien ne vous est assigné pour le moment.' }}
        </p>
      </div>

      <!-- Cartes d'entretiens -->
      <div class="iv-cards" *ngIf="filtered.length > 0">
        <article class="card iv-card" *ngFor="let it of filtered"
             [class.pending]="it.status === 'PENDING_SCHEDULING'"
             [class.upcoming]="it.status === 'SCHEDULED'"
             [class.done]="it.status === 'COMPLETED'"
             [class.cancelled]="it.status === 'CANCELLED'"
             [class.rejected]="it.status === 'REJECTED_BY_MANAGER'">
          <div class="iv-card__body">

            <header class="iv-head">
              <div class="iv-date" *ngIf="it.status !== 'PENDING_SCHEDULING'">
                <app-icon name="calendar" [size]="16" />
                <div>
                  <div class="iv-date__day">{{ formatDay(it.scheduledDate) }}</div>
                  <div class="iv-date__time">{{ formatTime(it.scheduledDate) }}</div>
                </div>
              </div>
              <!-- Pour PENDING : afficher le SLA à la place de la date -->
              <div class="iv-sla" *ngIf="it.status === 'PENDING_SCHEDULING'"
                   [class.warn]="slaHoursElapsed(it) >= 24 && slaHoursElapsed(it) < 48"
                   [class.danger]="slaHoursElapsed(it) >= 48">
                <div class="iv-sla__label">Affecté il y a</div>
                <div class="iv-sla__value">{{ slaLabel(it) }}</div>
              </div>

              <div class="iv-badges">
                <span class="badge"
                      [class.badge--brand]="it.candidateType === 'INTERNAL'"
                      [class.badge--neutral]="it.candidateType === 'EXTERNAL'">
                  {{ it.candidateType === 'INTERNAL' ? 'Interne' : it.candidateType === 'EXTERNAL' ? 'Externe' : '—' }}
                </span>
                <span class="badge"
                      [class.badge--warning]="it.status === 'PENDING_SCHEDULING'"
                      [class.badge--info]="it.status === 'SCHEDULED'"
                      [class.badge--success]="it.status === 'COMPLETED'"
                      [class.badge--neutral]="it.status === 'CANCELLED'"
                      [class.badge--danger]="it.status === 'REJECTED_BY_MANAGER'">
                  {{ statusLabel(it.status) }}
                </span>
                <span class="badge" *ngIf="it.matchingCategory"
                      [class.badge--success]="it.matchingCategory === 'IDEAL'"
                      [class.badge--warning]="it.matchingCategory === 'TRAINING'"
                      [class.badge--info]="it.matchingCategory === 'EXTERNAL'">
                  {{ matchingLabel(it.matchingCategory) }}
                  <span class="iv-ms" *ngIf="it.matchingScore != null">{{ it.matchingScore }}/100</span>
                </span>
              </div>
            </header>

            <div class="iv-rows">
              <div class="iv-row">
                <span class="iv-row__lbl"><app-icon name="profile" [size]="14" /> Candidat</span>
                <span class="iv-row__val">{{ it.candidateName || ('#' + it.applicationId) }}</span>
              </div>
              <div class="iv-row" *ngIf="it.jobOfferTitle">
                <span class="iv-row__lbl"><app-icon name="job" [size]="14" /> Poste</span>
                <span class="iv-row__val">{{ it.jobOfferTitle }}</span>
              </div>
              <div class="iv-row" *ngIf="it.location && it.status !== 'PENDING_SCHEDULING'">
                <span class="iv-row__lbl"><app-icon name="location" [size]="14" /> Lieu</span>
                <span class="iv-row__val">{{ it.location }}</span>
              </div>
              <div class="iv-row" *ngIf="it.interviewer && it.status !== 'PENDING_SCHEDULING'">
                <span class="iv-row__lbl"><app-icon name="user" [size]="14" /> Intervieweur</span>
                <span class="iv-row__val">{{ it.interviewer }}</span>
              </div>
            </div>

            <!-- Note RH visible en PENDING -->
            <div class="iv-note iv-note--rh" *ngIf="it.status === 'PENDING_SCHEDULING' && it.rhNote">
              <div class="iv-note__head"><app-icon name="message" [size]="14" /> Note du RH</div>
              <p>{{ it.rhNote }}</p>
            </div>
            <!-- Motif de refus si refusé -->
            <div class="iv-note iv-note--danger" *ngIf="it.status === 'REJECTED_BY_MANAGER' && it.rejectionReason">
              <div class="iv-note__head"><app-icon name="blocked" [size]="14" /> Motif de refus</div>
              <p>{{ it.rejectionReason }}</p>
            </div>

            <!-- Actions prioritaires pour PENDING -->
            <div class="iv-actions--pending" *ngIf="it.status === 'PENDING_SCHEDULING'">
              <button class="btn btn--accent" (click)="openScheduler(it)">
                <app-icon name="calendar" [size]="16" /> Planifier maintenant
              </button>
              <button class="btn btn--secondary" (click)="openReject(it)">
                <app-icon name="blocked" [size]="16" /> Refuser
              </button>
            </div>

            <!-- Édition inline -->
            <div class="iv-edit" *ngIf="editingId === it.id">
              <div class="field">
                <label class="label" [attr.for]="'edit-status-' + it.id">Statut</label>
                <select class="select" [id]="'edit-status-' + it.id" [(ngModel)]="editForm.status">
                  <option value="SCHEDULED">À venir</option>
                  <option value="COMPLETED">Réalisé</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
              <div class="field">
                <label class="label" [attr.for]="'edit-result-' + it.id">Résultat</label>
                <select class="select" [id]="'edit-result-' + it.id" [(ngModel)]="editForm.result">
                  <option value="">—</option>
                  <option value="POSITIF">Positif</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="NEGATIF">Négatif</option>
                </select>
              </div>
              <div class="field iv-edit__full">
                <label class="label" [attr.for]="'edit-loc-' + it.id">Lieu / Lien</label>
                <input class="input" [id]="'edit-loc-' + it.id" [(ngModel)]="editForm.location"
                       placeholder="Salle B204, ou https://meet.google.com/..." />
              </div>
              <div class="field iv-edit__full">
                <label class="label" [attr.for]="'edit-notes-' + it.id">Notes / Compte-rendu</label>
                <textarea class="textarea" [id]="'edit-notes-' + it.id" [(ngModel)]="editForm.notes" rows="4"
                          placeholder="Points clés discutés, ressenti, recommandation…"></textarea>
              </div>

              <!-- Aperçu de la promotion automatique si POSITIF + interne -->
              <div class="alert alert--success iv-edit__full"
                   *ngIf="editForm.result === 'POSITIF' && it.candidateType === 'INTERNAL'">
                <app-icon class="alert__icon" name="promoted" [size]="18" />
                <div>
                  <strong>Validation positive</strong>
                  <p>En enregistrant, <em>{{ it.candidateName }}</em> sera affecté au poste
                    <strong>« {{ it.jobOfferTitle }} »</strong> (statut de candidature : Retenu).
                    La mise à jour sera visible dans son espace employé.</p>
                </div>
              </div>

              <div class="iv-edit__actions iv-edit__full">
                <button class="btn btn--ghost" (click)="cancelEdit()">Annuler</button>
                <button class="btn btn--success" (click)="saveEdit(it)">
                  <app-icon name="save" [size]="16" /> Enregistrer
                </button>
              </div>
            </div>

            <div class="iv-foot" *ngIf="editingId !== it.id && it.status !== 'PENDING_SCHEDULING' && it.status !== 'REJECTED_BY_MANAGER'">
              <div class="iv-notes-preview" *ngIf="it.notes">{{ it.notes }}</div>
              <div *ngIf="it.result">
                <span class="badge"
                      [class.badge--success]="it.result === 'POSITIF'"
                      [class.badge--danger]="it.result === 'NEGATIF' || it.result === 'NÉGATIF'"
                      [class.badge--warning]="it.result === 'EN_COURS'">
                  {{ resultLabel(it.result) }}
                </span>
              </div>

              <!-- Plan de formation déjà saisi : aperçu -->
              <div class="iv-training" *ngIf="it.trainingPlan">
                <div class="iv-training__head">
                  <app-icon name="formation" [size]="16" />
                  <strong>Formation recommandée</strong>
                  <span class="iv-training__duration" *ngIf="it.trainingDuration">
                    <app-icon name="clock" [size]="12" /> {{ it.trainingDuration }}
                  </span>
                </div>
                <p class="iv-training__plan">{{ it.trainingPlan }}</p>
                <p class="iv-training__notes" *ngIf="it.trainingNotes"><em>{{ it.trainingNotes }}</em></p>
              </div>

              <!-- Carte verrouillée une fois l'entretien finalisé : on n'affiche plus que le badge. -->
              <div class="iv-locked" *ngIf="isLocked(it)">
                <app-icon name="lock" [size]="14" /> Entretien finalisé — modifications désactivées
              </div>

              <div class="iv-foot__actions" *ngIf="!isLocked(it)">
                <button class="btn btn--secondary btn--sm" (click)="startEdit(it)">
                  <app-icon name="edit" [size]="15" /> Mettre à jour
                </button>
                <!-- Bouton formation visible uniquement pour candidats internes À Former -->
                <button class="btn btn--secondary btn--sm"
                        *ngIf="canRecommendTraining(it)"
                        (click)="openTraining(it)">
                  <app-icon name="formation" [size]="15" />
                  {{ it.trainingPlan ? 'Modifier la formation' : 'Recommander une formation' }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- ═══════════ Modal Planifier l'entretien (Manager) ═══════════ -->
      <div class="modal-overlay" *ngIf="showScheduleModal" (click)="closeScheduleModal()">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Planifier l'entretien"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div>
              <div class="modal__title"><app-icon name="calendar-clock" [size]="20" /> Planifier l'entretien</div>
              <div class="modal__sub" *ngIf="schedulingInterview">
                {{ schedulingInterview.candidateName }} — {{ schedulingInterview.jobOfferTitle }}
              </div>
            </div>
            <button class="icon-btn" aria-label="Fermer la fenêtre" (click)="closeScheduleModal()">
              <app-icon name="close" [size]="18" />
            </button>
          </div>
          <div class="modal__body">
            <div class="alert alert--info">
              <app-icon class="alert__icon" name="info" [size]="18" />
              <span>
                En confirmant, un email de convocation officiel avec pièce jointe <code class="iv-code">.ics</code>
                (à ajouter au calendrier) sera envoyé au candidat.
              </span>
            </div>
            <div class="field">
              <label class="label" for="sch-date">Date et heure <span class="req">*</span></label>
              <input class="input" id="sch-date" type="datetime-local" [(ngModel)]="scheduleForm.scheduledDate" />
            </div>
            <div class="field">
              <label class="label" for="sch-loc">Lieu ou lien visio</label>
              <input class="input" id="sch-loc" [(ngModel)]="scheduleForm.location"
                     placeholder="Ex: Salle B204, ou https://meet.google.com/abc-defg-hij" />
            </div>
            <div class="field">
              <label class="label" for="sch-int">Intervieweur affiché <span class="iv-opt">(optionnel)</span></label>
              <input class="input" id="sch-int" [(ngModel)]="scheduleForm.interviewer"
                     placeholder="Par défaut : votre nom" />
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="closeScheduleModal()">Annuler</button>
            <button class="btn btn--success" [disabled]="scheduleSaving" (click)="submitSchedule()">
              <span class="spinner spinner--light" *ngIf="scheduleSaving"></span>
              <app-icon *ngIf="!scheduleSaving" name="send" [size]="16" />
              {{ scheduleSaving ? 'Envoi…' : 'Confirmer & envoyer convocation' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ Modal Refuser l'affectation (Manager) ═══════════ -->
      <div class="modal-overlay" *ngIf="showRejectModal" (click)="closeRejectModal()">
        <div class="modal modal--sm" role="dialog" aria-modal="true" aria-label="Refuser cette affectation"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div>
              <div class="modal__title"><app-icon name="blocked" [size]="20" /> Refuser cette affectation</div>
              <div class="modal__sub" *ngIf="schedulingInterview">
                {{ schedulingInterview.candidateName }} — {{ schedulingInterview.jobOfferTitle }}
              </div>
            </div>
            <button class="icon-btn" aria-label="Fermer la fenêtre" (click)="closeRejectModal()">
              <app-icon name="close" [size]="18" />
            </button>
          </div>
          <div class="modal__body">
            <div class="alert alert--warning">
              <app-icon class="alert__icon" name="warning" [size]="18" />
              <span>
                Le RH sera notifié par email et devra réaffecter cet entretien à un autre manager.
                Merci d'expliquer brièvement pourquoi.
              </span>
            </div>
            <div class="field">
              <label class="label" for="rej-reason">Motif du refus <span class="req">*</span></label>
              <textarea class="textarea" id="rej-reason" [(ngModel)]="rejectForm.reason" rows="4"
                        placeholder="Ex: Absence du XX au YY, conflit d'intérêt, périmètre hors de ma compétence..."></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="closeRejectModal()">Annuler</button>
            <button class="btn btn--danger" [disabled]="rejectSaving || !rejectForm.reason" (click)="submitReject()">
              <span class="spinner spinner--light" *ngIf="rejectSaving"></span>
              <app-icon *ngIf="!rejectSaving" name="blocked" [size]="16" />
              {{ rejectSaving ? 'Envoi…' : 'Confirmer le refus' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ Modal Recommandation de formation (Manager) ═══════════ -->
      <div class="modal-overlay" *ngIf="showTrainingModal" (click)="closeTrainingModal()">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Recommander une formation"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div>
              <div class="modal__title"><app-icon name="formation" [size]="20" /> Recommander une formation</div>
              <div class="modal__sub" *ngIf="trainingInterview">
                {{ trainingInterview.candidateName }} — {{ trainingInterview.jobOfferTitle }}
              </div>
            </div>
            <button class="icon-btn" aria-label="Fermer la fenêtre" (click)="closeTrainingModal()">
              <app-icon name="close" [size]="18" />
            </button>
          </div>
          <div class="modal__body">
            <div class="alert alert--info">
              <app-icon class="alert__icon" name="ai" [size]="18" />
              <span>
                Ce candidat a été classé <strong>À Former</strong> par le matching IA
                <span *ngIf="trainingInterview?.matchingScore != null">(score {{ trainingInterview.matchingScore }}/100)</span>.
                Décrivez le plan de formation à suivre pour qu'il atteigne le niveau idéal du poste.
              </span>
            </div>
            <div class="field">
              <label class="label" for="tr-plan">Plan de formation <span class="req">*</span></label>
              <textarea class="textarea" id="tr-plan" [(ngModel)]="trainingForm.trainingPlan" rows="4"
                        placeholder="Ex: Formation Spring Boot avancé + mentorat sur l'architecture microservices, ateliers pratiques sur Docker/Kubernetes…"></textarea>
            </div>
            <div class="field">
              <label class="label" for="tr-dur">Durée estimée <span class="iv-opt">(optionnel)</span></label>
              <input class="input" id="tr-dur" [(ngModel)]="trainingForm.trainingDuration"
                     placeholder="Ex: 2 semaines, 3 mois, 40h…" />
            </div>
            <div class="field">
              <label class="label" for="tr-notes">Notes complémentaires <span class="iv-opt">(optionnel)</span></label>
              <textarea class="textarea" id="tr-notes" [(ngModel)]="trainingForm.trainingNotes" rows="3"
                        placeholder="Mentor proposé, planning, objectifs mesurables…"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="closeTrainingModal()">Annuler</button>
            <button class="btn btn--success"
                    [disabled]="trainingSaving || !trainingForm.trainingPlan"
                    (click)="submitTraining()">
              <span class="spinner spinner--light" *ngIf="trainingSaving"></span>
              <app-icon *ngIf="!trainingSaving" name="save" [size]="16" />
              {{ trainingSaving ? 'Envoi…' : 'Enregistrer la formation' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1320px; margin: 0 auto; }

    /* ── En-tête ── */
    .iv-titlewrap { display: flex; align-items: center; gap: var(--sp-3); }
    .iv-title-icon {
      flex: none; width: 40px; height: 40px; border-radius: var(--r-md);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--c-accent-soft); color: var(--c-accent-ink);
    }

    /* ── Bannière "à planifier" ── */
    .iv-pending-banner { align-items: center; margin-bottom: var(--sp-5); }
    .iv-pending-banner strong { display: block; font-size: var(--fs-14); font-weight: 650; }
    .iv-pending-banner p { margin-top: 2px; font-size: var(--fs-13); }

    /* ── Filtres ── */
    .iv-filters { margin-bottom: var(--sp-5); }
    .iv-filters__body { display: flex; align-items: flex-end; gap: var(--sp-4); flex-wrap: wrap; }
    .iv-filters__field { min-width: 180px; }
    .iv-filters__spacer { flex: 1 1 auto; }
    .iv-count { align-self: center; }

    /* ── Erreur ── */
    .iv-error { align-items: center; margin-bottom: var(--sp-5); }
    .iv-error__msg { flex: 1 1 auto; }

    /* ── Grille de cartes ── */
    .iv-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--sp-4); }

    /* ── Carte d'entretien ── */
    .iv-card { position: relative; overflow: hidden; transition: box-shadow var(--transition); }
    .iv-card:hover { box-shadow: var(--sh-md); }
    .iv-card::before {
      content: ""; position: absolute; left: 0; top: 0; bottom: 0;
      width: 3px; background: var(--c-border-strong);
    }
    .iv-card.pending::before   { background: var(--c-warning); }
    .iv-card.upcoming::before  { background: var(--c-info); }
    .iv-card.done::before      { background: var(--c-success); }
    .iv-card.cancelled::before { background: var(--c-faint); }
    .iv-card.rejected::before  { background: var(--c-danger); }
    .iv-card.cancelled, .iv-card.rejected { opacity: .9; }
    .iv-card__body { padding: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-4); }

    /* ── Tête de carte ── */
    .iv-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-3); }
    .iv-date { display: flex; align-items: center; gap: var(--sp-2); color: var(--c-muted); }
    .iv-date__day { font-size: var(--fs-14); font-weight: 650; color: var(--c-ink); line-height: 1.2; }
    .iv-date__time { font-size: var(--fs-12); color: var(--c-accent-ink); font-weight: 600; margin-top: 1px; }

    .iv-sla {
      padding: var(--sp-2) var(--sp-3); border-radius: var(--r-sm);
      background: var(--c-surface-3); border: 1px solid var(--c-border); min-width: 92px;
    }
    .iv-sla.warn   { background: var(--c-warning-soft); border-color: var(--c-warning-soft); }
    .iv-sla.danger { background: var(--c-danger-soft); border-color: var(--c-danger-soft); }
    .iv-sla__label { font-size: var(--fs-11); text-transform: uppercase; letter-spacing: .04em; color: var(--c-muted); font-weight: 600; }
    .iv-sla__value { font-size: var(--fs-15); font-weight: 700; color: var(--c-ink); }
    .iv-sla.warn .iv-sla__value   { color: var(--c-warning-ink); }
    .iv-sla.danger .iv-sla__value { color: var(--c-danger-ink); }

    .iv-badges { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
    .iv-ms { font-size: var(--fs-11); opacity: .8; font-weight: 600; }

    /* ── Lignes clé/valeur ── */
    .iv-rows { display: flex; flex-direction: column; gap: var(--sp-2); }
    .iv-row { display: flex; justify-content: space-between; gap: var(--sp-3); font-size: var(--fs-13); }
    .iv-row__lbl { display: inline-flex; align-items: center; gap: 6px; color: var(--c-muted); font-weight: 500; }
    .iv-row__lbl app-icon { color: var(--c-faint); }
    .iv-row__val { color: var(--c-ink); font-weight: 600; text-align: right; }

    /* ── Notes (RH / refus) ── */
    .iv-note {
      border-radius: var(--r-sm); padding: var(--sp-3);
      font-size: var(--fs-13); border: 1px solid var(--c-border); background: var(--c-surface-2);
    }
    .iv-note__head { display: flex; align-items: center; gap: 6px; font-weight: 650; font-size: var(--fs-12); margin-bottom: 4px; }
    .iv-note p { color: var(--c-ink-soft); line-height: 1.45; }
    .iv-note--rh { background: var(--c-warning-soft); border-color: var(--c-warning-soft); }
    .iv-note--rh .iv-note__head, .iv-note--rh p { color: var(--c-warning-ink); }
    .iv-note--danger { background: var(--c-danger-soft); border-color: var(--c-danger-soft); }
    .iv-note--danger .iv-note__head, .iv-note--danger p { color: var(--c-danger-ink); }

    /* ── Actions PENDING ── */
    .iv-actions--pending { display: flex; gap: var(--sp-2); padding-top: var(--sp-3); border-top: 1px solid var(--c-border); }
    .iv-actions--pending .btn--accent { flex: 1; }

    /* ── Édition inline ── */
    .iv-edit {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3);
      padding-top: var(--sp-4); border-top: 1px solid var(--c-border);
    }
    .iv-edit__full { grid-column: 1 / -1; }
    .iv-edit__actions { display: flex; justify-content: flex-end; gap: var(--sp-2); }

    /* ── Pied de carte ── */
    .iv-foot { display: flex; flex-direction: column; gap: var(--sp-3); padding-top: var(--sp-3); border-top: 1px solid var(--c-border); }
    .iv-notes-preview {
      background: var(--c-surface-2); border: 1px solid var(--c-border); border-left: 3px solid var(--c-border-strong);
      padding: var(--sp-2) var(--sp-3); border-radius: var(--r-sm); font-size: var(--fs-13);
      color: var(--c-ink-soft); line-height: 1.5; max-height: 90px; overflow: hidden;
    }
    .iv-foot__actions { display: flex; gap: var(--sp-2); flex-wrap: wrap; }

    /* ── Aperçu plan de formation enregistré ── */
    .iv-training {
      border: 1px solid var(--c-border); border-left: 3px solid var(--c-accent);
      border-radius: var(--r-sm); background: var(--c-accent-soft);
      padding: var(--sp-3); display: flex; flex-direction: column; gap: 6px;
    }
    .iv-training__head { display: flex; align-items: center; gap: var(--sp-2); color: var(--c-accent-ink); font-size: var(--fs-13); }
    .iv-training__head strong { font-weight: 650; }
    .iv-training__duration {
      margin-left: auto; display: inline-flex; align-items: center; gap: 4px;
      background: var(--c-surface); border: 1px solid var(--c-border);
      padding: 2px 8px; border-radius: var(--r-pill); font-size: var(--fs-11); color: var(--c-accent-ink); font-weight: 600;
    }
    .iv-training__plan { font-size: var(--fs-13); color: var(--c-ink-soft); line-height: 1.5; white-space: pre-wrap; }
    .iv-training__notes { font-size: var(--fs-12); color: var(--c-muted); line-height: 1.45; }

    /* ── Carte verrouillée ── */
    .iv-locked {
      display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
      background: var(--c-surface-3); border: 1px dashed var(--c-border-strong); border-radius: var(--r-sm);
      padding: var(--sp-2) var(--sp-3); font-size: var(--fs-13); color: var(--c-muted); font-weight: 500;
    }

    /* ── Divers ── */
    .iv-opt { color: var(--c-faint); font-weight: 400; font-size: var(--fs-12); margin-left: 4px; }
    .iv-code {
      background: var(--c-surface-3); border: 1px solid var(--c-border);
      padding: 1px 6px; border-radius: 4px; font-size: var(--fs-12);
      font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
    }

    /* ── Responsive ── */
    @media (max-width: 560px) {
      .iv-cards { grid-template-columns: 1fr; }
      .iv-edit { grid-template-columns: 1fr; }
      .iv-row { flex-direction: column; gap: 2px; }
      .iv-row__val { text-align: left; }
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
          alert(`Entretien validé. ${it.candidateName} a été affecté au poste « ${it.jobOfferTitle} ». La candidature est passée en statut RETENU et le profil de l'employé a été mis à jour.`);
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
      case 'PENDING_SCHEDULING': return 'À planifier';
      case 'SCHEDULED': return 'À venir';
      case 'COMPLETED': return 'Réalisé';
      case 'CANCELLED': return 'Annulé';
      case 'REJECTED_BY_MANAGER': return 'Refusé';
      default: return '—';
    }
  }
  resultLabel(r: string): string {
    if (r === 'POSITIF') return 'Positif';
    if (r === 'NEGATIF' || r === 'NÉGATIF') return 'Négatif';
    if (r === 'EN_COURS') return 'En cours';
    return r;
  }

  /** Libellé lisible de la catégorie de matching IA. */
  matchingLabel(cat: string): string {
    if (cat === 'IDEAL') return 'Idéal';
    if (cat === 'TRAINING') return 'À Former';
    if (cat === 'EXTERNAL') return 'Externe';
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
        alert('Entretien planifié. La convocation a été envoyée au candidat.');
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
        alert('Plan de formation enregistré. Le RH le verra dans le pipeline.');
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
