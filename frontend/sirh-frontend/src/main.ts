import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Point d'entrée de l'application Angular SIRH.
 * Bootstrap en mode standalone avec la configuration Keycloak.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Erreur démarrage application:', err));
