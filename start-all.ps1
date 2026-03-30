# ============================================================
# Script de lancement complet du SIRH
# ============================================================

Write-Host "=== Lancement du projet SIRH Complet ===" -ForegroundColor Cyan

# Configuration de la version Java exacte (pour ce terminal)
$env:JAVA_HOME = "C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.3\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# 1. Démarrer Docker (Base de données et Keycloak)
Write-Host "-> [1/3] Démarrage de Docker (Keycloak & MySQL)..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Attente de 10 secondes pour l'initialisation des bases de données..."
Start-Sleep -Seconds 10

# Les commandes pour configurer Java dans les nouvelles fenêtres
$javaConfig = "`$env:JAVA_HOME='C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.3\jbr'; `$env:PATH=`$env:JAVA_HOME + '\bin;' + `$env:PATH;"

# 2. Démarrer les Microservices (chacun dans une nouvelle fenêtre)
Write-Host "-> [2/3] Démarrage des Microservices Backend..." -ForegroundColor Yellow

$services = @(
    "backend\employee-service",
    "backend\recruitment-service"
)

# Lancer les services métiers d'abord
foreach ($service in $services) {
    Write-Host "Lancement de $service dans un nouveau terminal..."
    $servicePath = Join-Path $PWD $service
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$servicePath'; $javaConfig & 'C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.3\plugins\maven\lib\maven3\bin\mvn.cmd' spring-boot:run"
}

Write-Host "Attente de 15 secondes avant de lancer l'API Gateway (pour que les autres services soient prêts)..."
Start-Sleep -Seconds 15

# Lancer l'API Gateway ensuite
Write-Host "Lancement de backend\api-gateway dans un nouveau terminal..."
$gatewayPath = Join-Path $PWD "backend\api-gateway"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$gatewayPath'; $javaConfig & 'C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.3\plugins\maven\lib\maven3\bin\mvn.cmd' spring-boot:run"


# 3. Démarrer le Frontend Angular (en parralèle)
Write-Host "-> [3/3] Démarrage du Frontend Angular..." -ForegroundColor Yellow
$frontendPath = Join-Path $PWD "frontend\sirh-frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; if (-not (Test-Path 'node_modules')) { Write-Host 'Installation des dépendances Angular...'; npm install }; npm start"


Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Tous les services sont en cours de démarrage !" -ForegroundColor Green
Write-Host "L'API Gateway est accessible sur http://localhost:8080"
Write-Host "Le Frontend Angular tourne sur   http://localhost:4200"
Write-Host "Gardez les fenêtres bleues ouvertes. Pour tout arrêter, fermez-les simplement."
Write-Host "============================================================" -ForegroundColor Green
