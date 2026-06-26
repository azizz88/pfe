import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Gestion des employés (CRUD complet) pour le RH Admin.
 */
@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Gestion des Employés</h1>
          <p class="page-header__sub">Gérez l'ensemble du personnel de votre entreprise</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" (click)="showForm = true; resetForm()">
            <app-icon name="add" [size]="18" /> Ajouter un employé
          </button>
        </div>
      </div>

      <!-- Bandeau d'erreur chargement -->
      <div class="alert alert--danger page-alert" *ngIf="loadError">
        <app-icon name="warning" [size]="16" class="alert__icon" />
        <span>{{ loadError }}</span>
        <button class="btn btn--sm btn--danger alert__action" (click)="loadError = null; loadEmployees()">Réessayer</button>
      </div>

      <!-- Bannière de succès après création -->
      <div class="alert alert--success page-alert" *ngIf="createdUsername">
        <app-icon name="approve" [size]="18" class="alert__icon" />
        <div>
          <div class="sb-title">Employé créé avec succès</div>
          <div class="sb-body">
            Nom d'utilisateur : <span class="sb-username">{{ createdUsername }}</span><br>
            Un email contenant ses identifiants a été envoyé à <strong>{{ createdEmail }}</strong>.
            Il devra changer son mot de passe lors de sa première connexion.
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom Complet</th><th>Email</th>
              <th>Poste</th><th>Département</th><th>Service</th>
              <th>Contrat</th><th class="cell-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of employees">
              <td class="cell-strong">{{ emp.firstName }} {{ emp.lastName }}</td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.position || '—' }}</td>
              <td>{{ emp.department?.name || '—' }}</td>
              <td>{{ emp.service?.name || '—' }}</td>
              <td>
                <span *ngIf="emp.contract" class="badge"
                      [ngClass]="{
                        'badge--success': emp.contract.type === 'CDI',
                        'badge--warning': emp.contract.type === 'CDD',
                        'badge--info': emp.contract.type === 'STAGE'
                      }">{{ emp.contract.type }}</span>
              </td>
              <td class="cell-actions">
                <button class="icon-btn" aria-label="Modifier" title="Modifier" (click)="editEmployee(emp)"><app-icon name="edit" [size]="16" /></button>
                <button class="icon-btn" aria-label="Compétences" title="Compétences" (click)="openSkills(emp)"><app-icon name="skills" [size]="16" /></button>
                <button class="icon-btn" aria-label="Documents" title="Documents" (click)="openDocuments(emp)"><app-icon name="document" [size]="16" /></button>
                <button class="icon-btn icon-btn--danger" aria-label="Supprimer" title="Supprimer" (click)="deleteEmployee(emp.id)"><app-icon name="delete" [size]="16" /></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="employees.length === 0 && !loadError">
          <div class="empty-state__icon"><app-icon name="employees" [size]="26" /></div>
          <div class="empty-state__title">Aucun employé</div>
          <div class="empty-state__text">Commencez par ajouter un employé à votre organisation.</div>
        </div>
      </div>

      <!-- Formulaire ajout/modification -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal modal--lg" role="dialog" aria-modal="true"
             [attr.aria-label]="isEditing ? 'Modifier un employé' : 'Ajouter un employé'"
             (click)="$event.stopPropagation()">
          <!-- Modal header -->
          <div class="modal__header">
            <div>
              <div class="modal__title">
                <app-icon [name]="isEditing ? 'edit' : (form.keycloakRole === 'MANAGER' ? 'manager' : form.keycloakRole === 'HR_ADMIN' ? 'lock' : 'user')" [size]="20" />
                {{ isEditing ? 'Modifier un employé' : ('Ajouter un ' + getRoleLabelShort()) }}
              </div>
              <div class="modal__sub">{{ isEditing ? 'Modifiez les informations ci-dessous' : getRoleSubtitle() }}</div>
            </div>
            <button class="icon-btn" aria-label="Fermer" (click)="showForm = false"><app-icon name="close" [size]="18" /></button>
          </div>

          <div class="modal__body">
            <!-- Section: Informations personnelles -->
            <div class="section">
              <div class="section-title"><app-icon name="user" [size]="16" /> Informations personnelles</div>
              <div class="grid-2">
                <div class="field">
                  <label class="label" for="emp-firstname">Prénom</label>
                  <input id="emp-firstname" class="input" [(ngModel)]="form.firstName" placeholder="Prénom" />
                </div>
                <div class="field">
                  <label class="label" for="emp-lastname">Nom</label>
                  <input id="emp-lastname" class="input" [(ngModel)]="form.lastName" placeholder="Nom" />
                </div>
                <div class="field">
                  <label class="label" for="emp-email">Email</label>
                  <input id="emp-email" class="input" [(ngModel)]="form.email" placeholder="email@exemple.com" type="email" />
                </div>
                <div class="field">
                  <label class="label" for="emp-phone">Téléphone</label>
                  <input id="emp-phone" class="input" [(ngModel)]="form.phone" placeholder="+216 XX XXX XXX" />
                </div>
                <div class="field">
                  <label class="label" for="emp-position">Poste</label>
                  <input id="emp-position" class="input" [(ngModel)]="form.position" placeholder="Ex: Développeur" />
                </div>
              </div>
            </div>

            <!-- Section: Compte Keycloak / Rôle (création uniquement)
                 Placée tôt car le rôle conditionne les sections suivantes. -->
            <div class="section" *ngIf="!isEditing">
              <div class="section-title"><app-icon name="lock" [size]="16" /> Compte d'accès &amp; Rôle</div>
              <div class="alert alert--info">
                <app-icon name="info" [size]="16" class="alert__icon" />
                <span>Un email d'activation sera envoyé. Nom d'utilisateur généré automatiquement : <strong>prénom.nom</strong></span>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label class="label" for="emp-role">Rôle Keycloak</label>
                  <select id="emp-role" class="select" [(ngModel)]="form.keycloakRole" (change)="onRoleChange()">
                    <option value="EMPLOYEE">Employé</option>
                    <option value="MANAGER">Manager (entretiens)</option>
                    <option value="HR_ADMIN">Administrateur RH</option>
                  </select>
                </div>
              </div>
              <!-- Description visuelle du rôle sélectionné -->
              <div class="role-preview" [ngClass]="'role-' + (form.keycloakRole || 'EMPLOYEE').toLowerCase()">
                <span class="rp-icon">
                  <app-icon [name]="form.keycloakRole === 'MANAGER' ? 'manager' : form.keycloakRole === 'HR_ADMIN' ? 'lock' : 'user'" [size]="22" />
                </span>
                <div class="rp-body">
                  <strong>{{ getRoleLabelLong() }}</strong>
                  <p>{{ getRoleDescription() }}</p>
                </div>
              </div>
            </div>

            <!-- Section: Affectation (libellé adapté au rôle) -->
            <div class="section" *ngIf="form.keycloakRole !== 'HR_ADMIN' || isEditing">
              <div class="section-title">
                <app-icon name="department" [size]="16" />
                {{ form.keycloakRole === 'MANAGER' ? 'Rattachement hiérarchique' : 'Affectation' }}
              </div>
              <div class="grid-2">
                <div class="field">
                  <label class="label" for="emp-hiredate">Date d'embauche</label>
                  <input id="emp-hiredate" class="input" [(ngModel)]="form.hireDate" type="date" />
                </div>
                <div class="field">
                  <label class="label" for="emp-dept">Département {{ form.keycloakRole === 'MANAGER' ? 'de rattachement' : '' }}</label>
                  <select id="emp-dept" class="select" [(ngModel)]="form.departmentId" (change)="onDepartmentChange()">
                    <option value="">-- Sélectionner --</option>
                    <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label" for="emp-service">Service</label>
                  <select id="emp-service" class="select" [(ngModel)]="form.serviceId" [disabled]="!form.departmentId">
                    <option value="">-- Sélectionner --</option>
                    <option *ngFor="let svc of filteredServices" [value]="svc.id">{{ svc.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Section: Périmètre managérial (création + rôle MANAGER uniquement) -->
            <div class="section mgr-section" *ngIf="!isEditing && form.keycloakRole === 'MANAGER'">
              <div class="section-title"><app-icon name="manager" [size]="16" /> Périmètre managérial</div>
              <div class="alert alert--warning">
                <app-icon name="info" [size]="16" class="alert__icon" />
                <span>Le manager validera les candidatures et planifiera les entretiens pour ce département. Un département ne peut avoir qu'un seul manager actif.</span>
              </div>
              <div class="grid-1">
                <div class="field">
                  <label class="label" for="emp-managed-dept">Département managé <span class="req">*</span></label>
                  <select id="emp-managed-dept" class="select" [(ngModel)]="form.managedDepartmentId">
                    <option [ngValue]="null">-- Sélectionner le département à manager --</option>
                    <option *ngFor="let dept of availableManagedDepartments()" [ngValue]="dept.id">
                      {{ dept.name }}
                    </option>
                  </select>
                  <p class="field-error" *ngIf="availableManagedDepartments().length === 0">
                    <app-icon name="warning" [size]="14" /> Tous les départements ont déjà un manager. Libérez-en un avant de créer un nouveau manager.
                  </p>
                  <p class="help" *ngIf="form.managedDepartmentId && departmentHasManager(form.managedDepartmentId)">
                    <app-icon name="info" [size]="14" /> Ce département est actuellement managé par <strong>{{ getCurrentManagerName(form.managedDepartmentId) }}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section: HR_ADMIN banner (création + rôle HR_ADMIN) -->
            <div class="section admin-section" *ngIf="!isEditing && form.keycloakRole === 'HR_ADMIN'">
              <div class="alert alert--info">
                <app-icon name="lock" [size]="16" class="alert__icon" />
                <div>
                  <strong>Administrateur RH</strong>
                  <p>L'affectation département/service est optionnelle : ce rôle est transverse à l'organisation.</p>
                </div>
              </div>
            </div>

            <!-- Section: Extraction IA depuis CV (création + rôle EMPLOYEE uniquement)
                 Inutile pour Manager/Admin : ces rôles ne participent pas au matching skills. -->
            <div class="section" *ngIf="!isEditing && form.keycloakRole === 'EMPLOYEE'">
              <div class="section-title"><app-icon name="ai" [size]="16" /> Extraction IA des compétences</div>
              <div class="cv-zone">
                <div class="cv-upload-row">
                  <label class="cv-file-label">
                    <input #cvInput type="file" accept=".pdf,.docx,.txt"
                           (change)="onCvSelected($event)" class="cv-file-input" />
                    <span class="cv-file-btn"><app-icon name="attach" [size]="16" /> Choisir un CV (PDF / DOCX / TXT)</span>
                    <span class="cv-file-name" *ngIf="cvFile">{{ cvFile.name }}</span>
                  </label>
                  <button type="button" class="btn btn--primary btn--sm"
                          [disabled]="!cvFile || cvExtracting"
                          (click)="extractCvSkills()">
                    @if (cvExtracting) {
                      <span class="spinner spinner--light"></span> Analyse…
                    } @else {
                      <app-icon name="ai" [size]="16" /> Extraire les compétences
                    }
                  </button>
                </div>
                <p class="help cv-hint" *ngIf="!cvExtractResult && !cvError">
                  L'IA analysera le CV et proposera les compétences avec un niveau estimé.
                  Vous pourrez valider/ajuster avant de créer l'employé.
                </p>
                <div class="alert alert--danger cv-error" *ngIf="cvError"><app-icon name="warning" [size]="16" class="alert__icon" /> {{ cvError }}</div>

                <!-- Résultats d'extraction -->
                <div class="cv-result" *ngIf="cvExtractResult">
                  <div class="cv-summary">
                    <span class="cv-summary-item">
                      <strong>{{ cvExtractResult.skills.length }}</strong> compétence(s) détectée(s)
                    </span>
                    <span class="cv-summary-item" *ngIf="cvExtractResult.estimatedYearsOfExperience">
                      <app-icon name="clock" [size]="14" /> {{ cvExtractResult.estimatedYearsOfExperience }} ans d'expérience détectés
                    </span>
                    <span class="cv-selected-count">
                      <app-icon name="check" [size]="14" /> {{ selectedExtractedCount() }} sélectionnée(s)
                    </span>
                  </div>

                  <div class="cv-skill-row" *ngFor="let sk of cvExtractResult.skills">
                    <input type="checkbox" [(ngModel)]="sk.preselected"
                           [ngModelOptions]="{standalone: true}"
                           class="cv-check" [attr.aria-label]="'Sélectionner ' + sk.skillName" />
                    <div class="cv-skill-info">
                      <div class="cv-skill-head">
                        <strong>{{ sk.skillName }}</strong>
                        <span class="badge badge--neutral" *ngIf="sk.category">{{ sk.category }}</span>
                        <span class="cv-conf" [class.high]="sk.confidence >= 0.75"
                                              [class.mid]="sk.confidence >= 0.5 && sk.confidence < 0.75"
                                              [class.low]="sk.confidence < 0.5">
                          {{ sk.confidence >= 0.75 ? 'Confiance haute' : sk.confidence >= 0.5 ? 'Confiance moyenne' : 'Confiance faible' }}
                        </span>
                      </div>
                      <div class="cv-evidence" *ngIf="sk.evidence">
                        <app-icon name="message" [size]="13" /> {{ sk.evidence }}
                      </div>
                    </div>
                    <div class="level-picker cv-level">
                      <button type="button"
                              *ngFor="let lvl of [1,2,3,4,5]"
                              class="lvl-btn"
                              [class.active]="sk.level === lvl"
                              (click)="sk.level = lvl"
                              [title]="getLevelLabel(lvl)">
                        {{ lvl }}
                      </button>
                    </div>
                    <span class="cv-lvl-label">{{ getLevelLabel(sk.level) }}</span>
                  </div>

                  <p *ngIf="cvExtractResult.skills.length === 0" class="cv-empty">
                    Aucune compétence du catalogue détectée dans ce CV.
                    Vous pouvez ajouter les compétences manuellement après création.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section: Contrat -->
            <div class="section">
              <div class="section-title"><app-icon name="contract" [size]="16" /> Contrat</div>
              <div class="grid-2">
                <div class="field">
                  <label class="label" for="emp-contract-type">Type de contrat</label>
                  <select id="emp-contract-type" class="select" [(ngModel)]="form.contractType">
                    <option value="">-- Sélectionner --</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="STAGE">Stage</option>
                  </select>
                </div>
                <div class="field">
                  <label class="label" for="emp-salary">Salaire mensuel (DT)</label>
                  <input id="emp-salary" class="input" [(ngModel)]="form.contractSalary" placeholder="Ex: 2500" type="number" />
                </div>
                <div class="field">
                  <label class="label" for="emp-contract-start">Date début</label>
                  <input id="emp-contract-start" class="input" [(ngModel)]="form.contractStartDate" type="date" />
                </div>
                <div class="field">
                  <label class="label" for="emp-contract-end">Date fin</label>
                  <input id="emp-contract-end" class="input" [(ngModel)]="form.contractEndDate" type="date" />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="modal__footer">
            <button class="btn btn--secondary" (click)="showForm = false"><app-icon name="close" [size]="16" /> Annuler</button>
            <button class="btn btn--primary" (click)="saveEmployee()">
              @if (isEditing) {
                <app-icon name="save" [size]="16" /> Enregistrer
              } @else {
                <app-icon name="check" [size]="16" /> Créer l'employé
              }
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ Modal Compétences ═══ -->
      <div class="modal-overlay" *ngIf="showSkillModal" (click)="showSkillModal = false">
        <div class="modal modal--lg" role="dialog" aria-modal="true" aria-label="Compétences de l'employé" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div>
              <div class="modal__title"><app-icon name="skills" [size]="20" /> Compétences</div>
              <div class="modal__sub">{{ skillEmployee?.firstName }} {{ skillEmployee?.lastName }}</div>
            </div>
            <button class="icon-btn" aria-label="Fermer" (click)="showSkillModal = false"><app-icon name="close" [size]="18" /></button>
          </div>

          <div class="modal__body">
            <!-- Ajout d'une compétence -->
            <div class="add-skill-zone">
              <div class="field">
                <label class="label" for="skill-select"><app-icon name="add" [size]="16" /> Ajouter une compétence</label>
                <div class="ask-row">
                  <select id="skill-select" [(ngModel)]="newSkillId" class="select ask-select">
                    <option [ngValue]="null">— Choisir une compétence —</option>
                    <option *ngFor="let s of availableSkillsForAdd()" [ngValue]="s.id">
                      {{ s.name }}{{ s.category ? ' (' + s.category + ')' : '' }}
                    </option>
                  </select>
                  <div class="level-picker">
                    <button type="button"
                            *ngFor="let lvl of [1,2,3,4,5]"
                            class="lvl-btn"
                            [class.active]="newSkillLevel === lvl"
                            (click)="newSkillLevel = lvl"
                            [title]="getLevelLabel(lvl)">
                      {{ lvl }}
                    </button>
                  </div>
                  <button class="btn btn--success btn--sm" [disabled]="!newSkillId" (click)="addSkillToEmployee()">
                    <app-icon name="add" [size]="16" /> Ajouter
                  </button>
                </div>
              </div>
              <p class="help ask-hint">{{ getLevelLabel(newSkillLevel) }} — utilisé par le matching IA</p>
            </div>

            <!-- Liste des compétences actuelles -->
            <div class="current-skills">
              <div class="cs-title"><app-icon name="list" [size]="16" /> Compétences actuelles ({{ employeeSkills.length }})</div>

              <div class="empty-state" *ngIf="employeeSkills.length === 0">
                <div class="empty-state__icon"><app-icon name="inbox" [size]="24" /></div>
                <div class="empty-state__title">Aucune compétence assignée</div>
                <div class="empty-state__text">L'employé n'apparaîtra pas dans le matching pour les offres nécessitant des compétences.</div>
              </div>

              <div class="cs-row" *ngFor="let sk of employeeSkills">
                <div class="cs-info">
                  <strong>{{ sk.skillName }}</strong>
                  <span class="badge badge--neutral" *ngIf="sk.category">{{ sk.category }}</span>
                </div>
                <div class="level-picker">
                  <button type="button"
                          *ngFor="let lvl of [1,2,3,4,5]"
                          class="lvl-btn"
                          [class.active]="sk.level === lvl"
                          (click)="updateSkillLevel(sk, lvl)">
                    {{ lvl }}
                  </button>
                </div>
                <span class="cs-label">{{ getLevelLabel(sk.level) }}</span>
                <button class="icon-btn icon-btn--danger icon-btn--sm" aria-label="Retirer la compétence" (click)="removeSkill(sk)"><app-icon name="close" [size]="16" /></button>
              </div>
            </div>
          </div>

          <div class="modal__footer">
            <button class="btn btn--secondary" (click)="showSkillModal = false">Fermer</button>
          </div>
        </div>
      </div>

      <!-- Modal Documents -->
      <div class="modal-overlay" *ngIf="showDocModal" (click)="showDocModal = false">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Documents de l'employé" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div>
              <div class="modal__title"><app-icon name="document" [size]="20" /> Documents</div>
              <div class="modal__sub">{{ docEmployee?.firstName }} {{ docEmployee?.lastName }}</div>
            </div>
            <button class="icon-btn" aria-label="Fermer" (click)="showDocModal = false"><app-icon name="close" [size]="18" /></button>
          </div>
          <div class="modal__body">
            <div class="upload-zone">
              <input type="file" #fileInput (change)="onFileSelected($event)" class="file-input" aria-label="Choisir un fichier" />
              <button class="btn btn--primary btn--sm" (click)="uploadFile()" [disabled]="!selectedFile"><app-icon name="upload" [size]="16" /> Uploader</button>
            </div>
            <div class="doc-list">
              <div class="doc-item" *ngFor="let doc of documents">
                <div class="doc-icon"><app-icon name="document" [size]="20" /></div>
                <div class="doc-info">
                  <div class="doc-name">{{ doc.fileName }}</div>
                  <div class="doc-meta">{{ doc.uploadDate }} &bull; {{ doc.fileType }}</div>
                </div>
                <div class="cell-actions doc-actions">
                  <button class="icon-btn" aria-label="Télécharger" title="Télécharger" (click)="downloadDoc(doc)"><app-icon name="download" [size]="16" /></button>
                  <button class="icon-btn icon-btn--danger" aria-label="Supprimer" title="Supprimer" (click)="deleteDoc(doc.id)"><app-icon name="delete" [size]="16" /></button>
                </div>
              </div>
              <div class="empty-state" *ngIf="documents.length === 0">
                <div class="empty-state__icon"><app-icon name="inbox" [size]="24" /></div>
                <div class="empty-state__text">Aucun document.</div>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" (click)="showDocModal = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Bannières de page */
    .page-alert { margin-bottom: var(--sp-4); }
    .alert .alert__action { margin-left: auto; flex: none; }
    .sb-title { font-weight: 650; color: var(--c-success-ink); font-size: var(--fs-14); margin-bottom: 2px; }
    .sb-body { color: var(--c-success-ink); font-size: var(--fs-13); line-height: 1.6; }
    .sb-username { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-xs); padding: 1px 7px; font-weight: 650; color: var(--c-ink); }

    /* Sections de formulaire (dans la modale) */
    .section { display: flex; flex-direction: column; gap: var(--sp-3); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
    .grid-1 { display: grid; grid-template-columns: 1fr; gap: var(--sp-4); }

    /* Aperçu du rôle sélectionné (surfaces plates, pas de dégradé) */
    .role-preview { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); border: 1px solid var(--c-border); background: var(--c-surface-2); }
    .role-preview .rp-icon { flex: none; display: inline-flex; color: var(--c-ink-soft); }
    .role-preview .rp-body strong { display: block; color: var(--c-ink); font-size: var(--fs-14); }
    .role-preview .rp-body p { margin: 2px 0 0; color: var(--c-muted); font-size: var(--fs-13); line-height: 1.45; }
    .role-employee  { background: var(--c-info-soft);    border-color: var(--c-border); }
    .role-manager   { background: var(--c-warning-soft); border-color: var(--c-border); }
    .role-hr_admin  { background: var(--c-accent-soft);  border-color: var(--c-border-strong); }

    /* Extraction CV par IA */
    .cv-zone { background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--r-md); padding: var(--sp-4); }
    .cv-upload-row { display: flex; gap: var(--sp-3); align-items: center; flex-wrap: wrap; }
    .cv-file-label { flex: 1; min-width: 220px; display: flex; gap: var(--sp-2); align-items: center; cursor: pointer; flex-wrap: wrap; }
    .cv-file-input { display: none; }
    .cv-file-btn { display: inline-flex; align-items: center; gap: var(--sp-2); padding: 9px 14px; background: var(--c-surface); border: 1px dashed var(--c-border-strong); border-radius: var(--r-sm); color: var(--c-ink-soft); font-size: var(--fs-13); font-weight: 600; transition: border-color var(--transition), background var(--transition), color var(--transition); }
    .cv-file-label:hover .cv-file-btn { border-color: var(--c-brand); background: var(--c-brand-soft); color: var(--c-brand-ink); }
    .cv-file-name { font-size: var(--fs-12); color: var(--c-muted); font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; padding: 3px 9px; background: var(--c-surface); border-radius: var(--r-xs); border: 1px solid var(--c-border); }
    .cv-hint { margin-top: var(--sp-3); font-style: italic; }
    .cv-error { margin-top: var(--sp-3); }

    .cv-result { margin-top: var(--sp-4); padding-top: var(--sp-4); border-top: 1px solid var(--c-border); }
    .cv-summary { display: flex; gap: var(--sp-4); flex-wrap: wrap; align-items: center; padding: var(--sp-2) var(--sp-3); margin-bottom: var(--sp-3); background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-sm); font-size: var(--fs-13); color: var(--c-muted); }
    .cv-summary-item { display: inline-flex; align-items: center; gap: 6px; }
    .cv-summary-item strong { color: var(--c-ink); font-weight: 700; }
    .cv-selected-count { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-weight: 650; color: var(--c-success-ink); }

    .cv-skill-row { display: flex; gap: var(--sp-3); align-items: center; padding: var(--sp-2) var(--sp-3); margin-bottom: var(--sp-2); background: var(--c-surface); border-radius: var(--r-sm); border: 1px solid var(--c-border); transition: border-color var(--transition); }
    .cv-skill-row:hover { border-color: var(--c-border-strong); }
    .cv-check { width: 18px; height: 18px; cursor: pointer; accent-color: var(--c-brand); flex-shrink: 0; }
    .cv-skill-info { flex: 1; min-width: 0; }
    .cv-skill-head { display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
    .cv-skill-head strong { color: var(--c-ink); font-size: var(--fs-14); }
    .cv-conf { font-size: var(--fs-12); font-weight: 600; padding: 2px 8px; border-radius: var(--r-pill); background: var(--c-surface-3); color: var(--c-muted); }
    .cv-conf.high { background: var(--c-success-soft); color: var(--c-success-ink); }
    .cv-conf.mid  { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .cv-conf.low  { background: var(--c-surface-3);    color: var(--c-muted); }
    .cv-evidence { margin-top: 4px; display: flex; align-items: flex-start; gap: 6px; font-size: var(--fs-12); color: var(--c-muted); line-height: 1.45; }
    .cv-level { flex-shrink: 0; }
    .cv-lvl-label { min-width: 84px; text-align: right; font-size: var(--fs-12); color: var(--c-muted); font-weight: 500; }
    .cv-empty { text-align: center; padding: var(--sp-5); background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-sm); color: var(--c-muted); font-size: var(--fs-13); }

    /* Sélecteur de niveau (1..5) */
    .level-picker { display: inline-flex; gap: 3px; background: var(--c-surface-2); padding: 3px; border-radius: var(--r-sm); border: 1px solid var(--c-border); }
    .lvl-btn { width: 28px; height: 28px; border: none; background: transparent; border-radius: var(--r-xs); cursor: pointer; font-size: var(--fs-13); font-weight: 600; color: var(--c-muted); transition: background var(--transition), color var(--transition); font-variant-numeric: tabular-nums; }
    .lvl-btn:hover { background: var(--c-surface-3); color: var(--c-ink); }
    .lvl-btn.active { background: var(--c-brand); color: #fff; }

    /* Modale compétences */
    .add-skill-zone { background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--r-md); padding: var(--sp-4); }
    .ask-row { display: flex; gap: var(--sp-3); align-items: center; flex-wrap: wrap; }
    .ask-select { flex: 1; min-width: 200px; }
    .ask-hint { margin-top: var(--sp-2); }
    .cs-title { display: flex; align-items: center; gap: var(--sp-2); font-weight: 650; color: var(--c-ink); font-size: var(--fs-14); margin-bottom: var(--sp-2); }
    .cs-row { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3); border-bottom: 1px solid var(--c-border); }
    .cs-row:last-child { border-bottom: none; }
    .cs-info { flex: 1; display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; min-width: 0; }
    .cs-info strong { color: var(--c-ink); font-size: var(--fs-14); }
    .cs-label { min-width: 84px; text-align: right; font-size: var(--fs-12); color: var(--c-muted); font-weight: 500; }

    /* Modale documents */
    .upload-zone { display: flex; gap: var(--sp-3); align-items: center; padding: var(--sp-3) var(--sp-4); background: var(--c-surface-2); border: 1px dashed var(--c-border-strong); border-radius: var(--r-md); }
    .file-input { flex: 1; font-size: var(--fs-13); color: var(--c-ink-soft); min-width: 0; }
    .doc-list { display: flex; flex-direction: column; }
    .doc-item { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3); border-bottom: 1px solid var(--c-border); }
    .doc-item:last-child { border-bottom: none; }
    .doc-icon { flex: none; width: 36px; height: 36px; border-radius: var(--r-sm); display: inline-flex; align-items: center; justify-content: center; background: var(--c-surface-3); color: var(--c-muted); }
    .doc-info { flex: 1; min-width: 0; }
    .doc-name { font-weight: 600; color: var(--c-ink); font-size: var(--fs-14); }
    .doc-meta { color: var(--c-muted); font-size: var(--fs-12); }
    .doc-actions { flex: none; }

    @media (max-width: 640px) {
      .grid-2 { grid-template-columns: 1fr; }
      .modal__footer { flex-direction: column-reverse; }
      .modal__footer .btn { width: 100%; }
    }
  `]
})
export class EmployeeManagementComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  allServices: any[] = [];
  filteredServices: any[] = [];
  showForm = false;
  isEditing = false;
  editId: number | null = null;
  form: any = {};
  createdUsername: string | null = null;
  createdEmail: string | null = null;
  loadError: string | null = null;

  // Documents
  showDocModal = false;
  docEmployee: any = null;
  documents: any[] = [];
  selectedFile: File | null = null;

  // Compétences (matching IA)
  showSkillModal = false;
  skillEmployee: any = null;
  employeeSkills: any[] = [];
  allSkills: any[] = [];
  newSkillId: number | null = null;
  newSkillLevel = 3;

  // Extraction CV par IA (création employé)
  cvFile: File | null = null;
  cvExtracting = false;
  cvExtractResult: any = null;
  cvError: string | null = null;

  constructor(
    private employeeApi: EmployeeApiService,
    private recruitmentApi: RecruitmentApiService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
    this.loadServices();
    this.loadAllSkills();
  }

  loadAllSkills(): void {
    this.recruitmentApi.getAllSkills().subscribe({
      next: (data) => this.allSkills = data,
      error: () => this.allSkills = []
    });
  }

  loadEmployees(): void {
    this.employeeApi.getAllEmployees().subscribe({
      next: (data) => this.employees = data,
      error: (err: any) => {
        console.error('Erreur chargement employés:', err);
        this.loadError = 'Impossible de charger les employés. Vérifiez que le serveur est démarré.';
      }
    });
  }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({ next: (data) => this.departments = data });
  }

  loadServices(): void {
    this.employeeApi.getServices().subscribe({ next: (data) => this.allServices = data });
  }

  onDepartmentChange(): void {
    this.form.serviceId = '';
    if (this.form.departmentId) {
      this.filteredServices = this.allServices.filter(s => s.department?.id === +this.form.departmentId);
    } else {
      this.filteredServices = [];
    }
  }

  resetForm(): void {
    this.form = {
      contractType: '',
      departmentId: '',
      serviceId: '',
      keycloakRole: 'EMPLOYEE',
      managedDepartmentId: null
    };
    this.filteredServices = [];
    this.isEditing = false;
    this.editId = null;
    this.createdUsername = null;
    this.createdEmail = null;
    this.resetCvExtraction();
  }

  // ─── Helpers liés au rôle ────────────────────────────

  /** Quand le rôle change : nettoyer les champs inutiles dans le nouveau contexte. */
  onRoleChange(): void {
    if (this.form.keycloakRole !== 'MANAGER') {
      this.form.managedDepartmentId = null;
    }
    if (this.form.keycloakRole !== 'EMPLOYEE') {
      // L'extraction CV n'a plus de sens pour Manager / HR_Admin
      this.resetCvExtraction();
    }
  }

  getRoleLabelShort(): string {
    switch (this.form.keycloakRole) {
      case 'MANAGER': return 'manager';
      case 'HR_ADMIN': return 'administrateur RH';
      default: return 'employé';
    }
  }

  getRoleLabelLong(): string {
    switch (this.form.keycloakRole) {
      case 'MANAGER': return 'Manager — Responsable d\'un département';
      case 'HR_ADMIN': return 'Administrateur RH — Accès complet';
      default: return 'Employé — Collaborateur standard';
    }
  }

  getRoleDescription(): string {
    switch (this.form.keycloakRole) {
      case 'MANAGER':
        return 'Valide les candidatures, planifie les entretiens et supervise un département. Doit être rattaché à un département managé.';
      case 'HR_ADMIN':
        return 'Accès complet à la gestion RH : employés, recrutement, congés, paie. Rôle transverse (sans affectation obligatoire).';
      default:
        return 'Accès à son profil, son équipe et ses outils RH. Apparaît dans le matching IA selon ses compétences.';
    }
  }

  getRoleSubtitle(): string {
    switch (this.form.keycloakRole) {
      case 'MANAGER': return 'Renseignez les informations du nouveau manager et son département';
      case 'HR_ADMIN': return 'Renseignez les informations du nouvel administrateur RH';
      default: return 'Remplissez les informations du nouvel employé';
    }
  }

  /** Départements disponibles pour un nouveau manager : ceux sans manager actuel. */
  availableManagedDepartments(): any[] {
    return this.departments.filter(d => !d.manager);
  }

  /** Affiche le manager actuel d'un département (rare : appelé seulement en mode défensif). */
  departmentHasManager(deptId: any): boolean {
    const dept = this.departments.find(d => d.id === +deptId);
    return !!(dept && dept.manager);
  }

  getCurrentManagerName(deptId: any): string {
    const dept = this.departments.find(d => d.id === +deptId);
    if (!dept || !dept.manager) return '—';
    return `${dept.manager.firstName} ${dept.manager.lastName}`;
  }

  // ─── Extraction CV par IA ────────────────────────────

  resetCvExtraction(): void {
    this.cvFile = null;
    this.cvExtracting = false;
    this.cvExtractResult = null;
    this.cvError = null;
  }

  onCvSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.cvFile = file;
    this.cvExtractResult = null;
    this.cvError = null;
  }

  extractCvSkills(): void {
    if (!this.cvFile) return;
    this.cvExtracting = true;
    this.cvError = null;
    this.cvExtractResult = null;
    this.employeeApi.extractCvSkills(this.cvFile).subscribe({
      next: (result) => {
        this.cvExtractResult = result;
        this.cvExtracting = false;
      },
      error: (err) => {
        this.cvError = err.status === 400
          ? 'Format de fichier non supporté ou fichier vide.'
          : (err.error?.message || err.message || 'Erreur lors de l\'extraction du CV.');
        this.cvExtracting = false;
      }
    });
  }

  selectedExtractedCount(): number {
    if (!this.cvExtractResult?.skills) return 0;
    return this.cvExtractResult.skills.filter((s: any) => s.preselected).length;
  }

  editEmployee(emp: any): void {
    this.form = {
      ...emp,
      departmentId: emp.department?.id || '',
      serviceId: emp.service?.id || '',
      contractType: emp.contract?.type || '',
      contractStartDate: emp.contract?.startDate || '',
      contractEndDate: emp.contract?.endDate || '',
      contractSalary: emp.contract?.salary || ''
    };
    this.isEditing = true;
    this.editId = emp.id;
    if (this.form.departmentId) {
      this.filteredServices = this.allServices.filter(s => s.department?.id === +this.form.departmentId);
    } else {
      this.filteredServices = [];
    }
    this.showForm = true;
  }

  saveEmployee(): void {
    const contract = this.form.contractType ? {
      ...(this.isEditing && this.form.contract?.id ? { id: this.form.contract.id } : {}),
      type: this.form.contractType,
      startDate: this.form.contractStartDate || null,
      endDate: this.form.contractEndDate || null,
      salary: this.form.contractSalary || null
    } : null;

    if (this.isEditing) {
      // Mise à jour : on envoie l'entité Employee directement (pas de Keycloak)
      const payload = {
        ...this.form,
        department: this.form.departmentId ? { id: +this.form.departmentId } : null,
        service: this.form.serviceId ? { id: +this.form.serviceId } : null,
        contract
      };
      this.employeeApi.updateEmployee(this.editId!, payload).subscribe({
        next: () => { this.showForm = false; this.loadEmployees(); },
        error: (err: any) => alert('Erreur mise à jour : ' + (err.error?.message || err.message))
      });
    } else {
      // Validation spécifique au rôle Manager : département managé obligatoire
      if (this.form.keycloakRole === 'MANAGER' && !this.form.managedDepartmentId) {
        alert('Veuillez sélectionner le département dont ce manager sera responsable.');
        return;
      }

      // Compétences validées par le RH après extraction CV (uniquement pour le rôle EMPLOYEE)
      const initialSkills = (this.form.keycloakRole === 'EMPLOYEE' && this.cvExtractResult?.skills)
        ? this.cvExtractResult.skills
            .filter((s: any) => s.preselected && s.skillId && s.level)
            .map((s: any) => ({
              skillId: s.skillId,
              skillName: s.skillName,
              category: s.category,
              level: s.level
            }))
        : [];

      // Création : on envoie le DTO avec les champs Keycloak
      // (le matricule est généré côté backend à partir de l'ID auto-incrémenté)
      const payload = {
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        email: this.form.email,
        phone: this.form.phone,
        position: this.form.position,
        hireDate: this.form.hireDate || null,
        department: this.form.departmentId ? { id: +this.form.departmentId } : null,
        service: this.form.serviceId ? { id: +this.form.serviceId } : null,
        contract,
        keycloakRole: this.form.keycloakRole || 'EMPLOYEE',
        managedDepartmentId: this.form.keycloakRole === 'MANAGER' && this.form.managedDepartmentId
          ? +this.form.managedDepartmentId
          : null,
        initialSkills
      };
      this.employeeApi.createEmployee(payload).subscribe({
        next: (emp: any) => {
          this.showForm = false;
          this.createdUsername = emp.keycloakUsername;
          this.createdEmail = emp.email;
          this.loadEmployees();
          // Recharger les départements pour rafraîchir l'état des managers
          this.loadDepartments();
          // Effacer la bannière après 12 secondes
          setTimeout(() => { this.createdUsername = null; this.createdEmail = null; }, 12000);
        },
        error: (err: any) => alert('Erreur création : ' + (err.error?.message || err.message))
      });
    }
  }

  deleteEmployee(id: number): void {
    if (confirm('Supprimer cet employé ?')) {
      this.employeeApi.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
          // Si l'employé supprimé était manager, son département redevient disponible
          this.loadDepartments();
        }
      });
    }
  }

  // ── Documents ──

  openDocuments(emp: any): void {
    this.docEmployee = emp;
    this.showDocModal = true;
    this.selectedFile = null;
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (this.docEmployee) {
      this.employeeApi.getDocumentsByEmployee(this.docEmployee.id).subscribe({
        next: (data) => this.documents = data
      });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  uploadFile(): void {
    if (this.selectedFile && this.docEmployee) {
      this.employeeApi.uploadDocument(this.docEmployee.id, this.selectedFile).subscribe({
        next: () => { this.selectedFile = null; this.loadDocuments(); }
      });
    }
  }

  downloadDoc(doc: any): void {
    this.employeeApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  deleteDoc(docId: number): void {
    if (confirm('Supprimer ce document ?')) {
      this.employeeApi.deleteDocument(docId).subscribe({
        next: () => this.loadDocuments()
      });
    }
  }


  // ─── Compétences (matching IA) ────────────────────────

  openSkills(emp: any): void {
    this.skillEmployee = emp;
    this.showSkillModal = true;
    this.newSkillId = null;
    this.newSkillLevel = 3;
    this.loadEmployeeSkills();
  }

  loadEmployeeSkills(): void {
    if (!this.skillEmployee) return;
    this.employeeApi.getEmployeeSkills(this.skillEmployee.matricule).subscribe({
      next: (data) => this.employeeSkills = data || [],
      error: () => this.employeeSkills = []
    });
  }

  /** Liste des compétences disponibles (= toutes - celles déjà assignées) */
  availableSkillsForAdd(): any[] {
    const assignedIds = new Set(this.employeeSkills.map(s => s.skillId));
    return this.allSkills.filter(s => !assignedIds.has(s.id));
  }

  addSkillToEmployee(): void {
    if (!this.skillEmployee || !this.newSkillId) return;
    const skill = this.allSkills.find(s => s.id === this.newSkillId);
    if (!skill) return;
    this.employeeApi.addEmployeeSkill(this.skillEmployee.matricule, {
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      level: this.newSkillLevel
    }).subscribe({
      next: () => {
        this.newSkillId = null;
        this.newSkillLevel = 3;
        this.loadEmployeeSkills();
      },
      error: (err) => alert('Erreur ajout compétence : ' + (err.error?.message || err.message))
    });
  }

  updateSkillLevel(sk: any, level: number): void {
    if (sk.level === level) return;
    this.employeeApi.updateEmployeeSkillLevel(this.skillEmployee.matricule, sk.skillId, level).subscribe({
      next: () => { sk.level = level; },
      error: (err) => alert('Erreur mise à jour : ' + (err.error?.message || err.message))
    });
  }

  removeSkill(sk: any): void {
    if (!confirm(`Retirer la compétence "${sk.skillName}" ?`)) return;
    this.employeeApi.removeEmployeeSkill(this.skillEmployee.matricule, sk.skillId).subscribe({
      next: () => this.loadEmployeeSkills()
    });
  }

  getLevelLabel(level: number): string {
    const labels: { [k: number]: string } = {
      1: 'Débutant', 2: 'Notions', 3: 'Intermédiaire', 4: 'Avancé', 5: 'Expert'
    };
    return labels[level] || '—';
  }
}
