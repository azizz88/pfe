import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import {
  LucideLayoutDashboard, LucideUsers, LucideUsersRound, LucideUserRound, LucideUser,
  LucideUserCog, LucideUserPlus, LucideBuilding2, LucideFileSignature, LucideFileText,
  LucideNetwork, LucideTarget, LucideGlobe, LucideAward, LucideSchool, LucideBriefcase,
  LucideBookOpen, LucideMic, LucideGraduationCap, LucideSearch, LucidePlus, LucidePencil,
  LucideTrash2, LucideSave, LucideCheck, LucideCircleCheck, LucideX, LucideCircleX,
  LucideClock, LucideEye, LucideFilter, LucideDownload, LucideUpload, LucideSend,
  LucideRefreshCw, LucideChevronRight, LucideChevronDown, LucideArrowRight, LucidePaperclip,
  LucideLink2, LucideCalendar, LucideCalendarDays, LucideCalendarClock, LucideMail,
  LucidePhone, LucideMapPin, LucideWallet, LucideBell, LucideSparkles, LucideBot,
  LucideTrendingUp, LucideStar, LucideLock, LucideInfo, LucideTriangleAlert,
  LucideCircleAlert, LucideBan, LucideInbox, LucideSettings, LucideLogOut, LucideMenu,
  LucidePanelLeft, LucideLandmark, LucideClipboardList, LucideListChecks, LucideLayers,
  LucideChartColumn, LucideChartPie, LucideChartLine, LucideMessageSquare, LucideHash,
  LucidePanelLeftClose,
} from '@lucide/angular';

/**
 * Icône applicative — wrapper unique au-dessus de @lucide/angular.
 * Centralise le jeu d'icônes : les composants utilisent
 * `<app-icon name="employees" [size]="18" />` sans importer chaque icône.
 *
 * Les icônes sont décoratives par défaut (aria-hidden). Pour une icône
 * porteuse de sens (bouton icône seul), renseigner `label`.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideLayoutDashboard, LucideUsers, LucideUsersRound, LucideUserRound, LucideUser,
    LucideUserCog, LucideUserPlus, LucideBuilding2, LucideFileSignature, LucideFileText,
    LucideNetwork, LucideTarget, LucideGlobe, LucideAward, LucideSchool, LucideBriefcase,
    LucideBookOpen, LucideMic, LucideGraduationCap, LucideSearch, LucidePlus, LucidePencil,
    LucideTrash2, LucideSave, LucideCheck, LucideCircleCheck, LucideX, LucideCircleX,
    LucideClock, LucideEye, LucideFilter, LucideDownload, LucideUpload, LucideSend,
    LucideRefreshCw, LucideChevronRight, LucideChevronDown, LucideArrowRight, LucidePaperclip,
    LucideLink2, LucideCalendar, LucideCalendarDays, LucideCalendarClock, LucideMail,
    LucidePhone, LucideMapPin, LucideWallet, LucideBell, LucideSparkles, LucideBot,
    LucideTrendingUp, LucideStar, LucideLock, LucideInfo, LucideTriangleAlert,
    LucideCircleAlert, LucideBan, LucideInbox, LucideSettings, LucideLogOut, LucideMenu,
    LucidePanelLeft, LucideLandmark, LucideClipboardList, LucideListChecks, LucideLayers,
    LucideChartColumn, LucideChartPie, LucideChartLine, LucideMessageSquare, LucideHash,
    LucidePanelLeftClose,
  ],
  template: `
    @switch (name()) {
      @case ('dashboard')        { <svg lucideLayoutDashboard [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('employees')        { <svg lucideUsers [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('team')             { <svg lucideUsersRound [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('profile')          { <svg lucideUserRound [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('user')             { <svg lucideUser [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('manager')          { <svg lucideUserCog [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('user-plus')        { <svg lucideUserPlus [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('department')       { <svg lucideBuilding2 [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('building')         { <svg lucideBuilding2 [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('contract')         { <svg lucideFileSignature [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('document')         { <svg lucideFileText [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('org-chart')        { <svg lucideNetwork [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('recruitment')      { <svg lucideTarget [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('target')           { <svg lucideTarget [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('external')         { <svg lucideGlobe [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('skills')           { <svg lucideAward [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('award')            { <svg lucideAward [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('training-provider'){ <svg lucideSchool [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('job')              { <svg lucideBriefcase [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('directory')        { <svg lucideBookOpen [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('interview')        { <svg lucideMic [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('formation')        { <svg lucideGraduationCap [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('search')           { <svg lucideSearch [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('add')              { <svg lucidePlus [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('edit')             { <svg lucidePencil [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('delete')           { <svg lucideTrash2 [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('save')             { <svg lucideSave [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('check')            { <svg lucideCheck [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('approve')          { <svg lucideCircleCheck [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('close')            { <svg lucideX [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('reject')           { <svg lucideCircleX [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('pending')          { <svg lucideClock [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('clock')            { <svg lucideClock [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('view')             { <svg lucideEye [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('filter')           { <svg lucideFilter [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('download')         { <svg lucideDownload [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('upload')           { <svg lucideUpload [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('send')             { <svg lucideSend [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('refresh')          { <svg lucideRefreshCw [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('next')             { <svg lucideChevronRight [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('expand')           { <svg lucideChevronDown [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('arrow-right')      { <svg lucideArrowRight [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('attach')           { <svg lucidePaperclip [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('link')             { <svg lucideLink2 [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('calendar')         { <svg lucideCalendar [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('date')             { <svg lucideCalendarDays [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('calendar-clock')   { <svg lucideCalendarClock [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('email')            { <svg lucideMail [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('phone')            { <svg lucidePhone [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('location')         { <svg lucideMapPin [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('salary')           { <svg lucideWallet [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('notification')     { <svg lucideBell [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('ai')               { <svg lucideSparkles [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('bot')              { <svg lucideBot [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('promoted')         { <svg lucideTrendingUp [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('trending')         { <svg lucideTrendingUp [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('star')             { <svg lucideStar [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('lock')             { <svg lucideLock [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('info')             { <svg lucideInfo [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('warning')          { <svg lucideTriangleAlert [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('alert')            { <svg lucideCircleAlert [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('blocked')          { <svg lucideBan [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('inbox')            { <svg lucideInbox [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('settings')         { <svg lucideSettings [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('logout')           { <svg lucideLogOut [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('menu')             { <svg lucideMenu [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('panel')            { <svg lucidePanelLeft [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('panel-close')      { <svg lucidePanelLeftClose [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('landmark')         { <svg lucideLandmark [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('list')             { <svg lucideClipboardList [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('checks')           { <svg lucideListChecks [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('layers')           { <svg lucideLayers [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('chart')            { <svg lucideChartColumn [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('chart-pie')        { <svg lucideChartPie [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('chart-line')       { <svg lucideChartLine [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('message')          { <svg lucideMessageSquare [size]="s()" [strokeWidth]="w()"></svg> }
      @case ('hash')             { <svg lucideHash [size]="s()" [strokeWidth]="w()"></svg> }
      @default                   { <svg lucideHash [size]="s()" [strokeWidth]="w()"></svg> }
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      color: inherit;
      flex: none;
    }
    svg { display: block; }
  `],
  host: {
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class IconComponent {
  /** Nom sémantique de l'icône (voir le switch ci-dessus). */
  readonly name = input.required<string>();
  /** Taille en pixels (largeur = hauteur). */
  readonly size = input<number | string>(18);
  /** Épaisseur de trait Lucide. */
  readonly strokeWidth = input<number>(1.8);
  /** Libellé accessible — si fourni, l'icône devient porteuse de sens (role=img). */
  readonly label = input<string>('');

  protected readonly s = computed(() => Number(this.size()));
  protected readonly w = computed(() => this.strokeWidth());
}
