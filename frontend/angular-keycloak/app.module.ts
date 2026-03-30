import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { KeycloakService } from './services/keycloak.service';
import { HttpTokenInterceptor } from './interceptors/http-token-class.interceptor';

// ──────────────────────────────────────────────
// Factory function pour APP_INITIALIZER
// Appelée au démarrage de l'application Angular
// ──────────────────────────────────────────────
export function initializeKeycloak(keycloakService: KeycloakService) {
  return () => keycloakService.init();
}

@NgModule({
  declarations: [
    AppComponent
    // Ajoutez vos autres composants ici
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [
    // ── Initialisation Keycloak au démarrage ──
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],  // Injection du KeycloakService dans la factory
      multi: true               // Permet plusieurs APP_INITIALIZER
    },
    // ── Intercepteur HTTP pour ajouter le token Bearer ──
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpTokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
