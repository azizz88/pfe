# Plateforme SIRH - Microservices avec Spring Boot & Angular

Ce projet est une plateforme SIRH complète basée sur une architecture microservices sécurisée avec Keycloak.

## 🛠️ Prérequis (À installer sur un nouveau PC Windows)

Pour faire tourner ce projet sur une machine vierge, vous devez installer les logiciels suivants :

1. **Git** : Pour cloner le projet.
   - [Télécharger Git](https://git-scm.com/download/win)
2. **Docker Desktop** : Indispensable pour lancer la base de données MySQL et le serveur d'authentification Keycloak.
   - [Télécharger Docker Desktop](https://www.docker.com/products/docker-desktop)
3. **Java Development Kit (JDK) 11 ou supérieur** : Pour exécuter le code backend.
   - [Télécharger Adoptium OpenJDK 17](https://adoptium.net/) (Recommandé)
   - *Important : Lors de l'installation, cochez l'option "Add to PATH" ou "Set JAVA_HOME".*
4. **Apache Maven** : L'outil pour compiler et lancer les microservices Java.
   - [Télécharger Maven](https://maven.apache.org/download.cgi) (Prenez le fichier `.zip` "Binary zip archive")
   - Décompressez-le dans `C:\Program Files\Apache\maven`
   - Ajoutez le dossier `bin` de Maven dans vos variables d'environnement Système (`PATH`).
5. **Node.js** : Pour pouvoir exécuter et compiler l'application web Angular.
   - [Télécharger Node.js](https://nodejs.org/) (Prenez la version LTS).

---

## 🚀 Installation & Démarrage

### 1. Cloner le Projet
Ouvrez un terminal (PowerShell) et tapez :
```bash
git clone https://github.com/azizz88/pfe.git
cd pfe
```

### 2. Lancer l'Infrastructure (Docker)
Cette commande va télécharger et lancer automatiquement Keycloak et la base de données MySQL.
```bash
docker-compose up -d
```
*(Vous pouvez vérifier sur Docker Desktop ou en tapant `docker ps` que les 2 conteneurs tournent).*

### 3. Lancer les Microservices (Backend)
Ouvrez **3 fenêtres de terminal séparées**. Pour chacune d'elles, placez-vous dans le dossier du projet puis naviguez vers le microservice correspondant et lancez-le avec Maven :

**Terminal 1 (Employee Service - Port 8081) :**
```bash
cd backend\employee-service
mvn spring-boot:run
```

**Terminal 2 (Recruitment Service - Port 8082) :**
```bash
cd backend\recruitment-service
mvn spring-boot:run
```

**Terminal 3 (API Gateway - Port 8080) :** *(Lancez-le en dernier)*
```bash
cd backend\api-gateway
mvn spring-boot:run
```

### 4. Lancer le Frontend (Angular)
Ouvrez un **4ème terminal** :
```bash
cd frontend\sirh-frontend
npm install   # À faire obligatoirement la toute première fois
npm start
```

### 5. Accéder à l'application
- **Le site web Angular** : `http://localhost:4200`
- **Keycloak (Panel Admin)** : `http://localhost:8180` (utilisateurs créés via `docker-compose`)
- **API Gateway** : `http://localhost:8080` (C'est par là que passent les requêtes)

---
*Note : Si vous utilisez le script `start-all.ps1` sur une nouvelle machine, assurez-vous de modifier le chemin d'accès vers Java et Maven directement dans le code du script, car il pointe actuellement vers un chemin spécifique à votre premier ordinateur.*
