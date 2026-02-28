DEMO-Seite: https://umzug.enkination.de/   Login: demo@demo.com PW: Demo123

# Umzugsplaner PWA - Dein smarter Helfer für einen stressfreien Umzug

![Umzugsplaner Logo](umzugshelfer-pwa/public/logo512.png) <!-- Optional: Pfad zum Logo anpassen -->

Der Umzugsplaner PWA ist eine umfassende Progressive Web Application, die dich bei der Planung, Organisation und Durchführung deines Umzugs unterstützt. Von der ersten Idee bis zum letzten ausgepackten Karton – diese App bietet dir alle Werkzeuge, die du für einen reibungslosen Übergang in dein neues Zuhause benötigst.

## ✨ Hauptfunktionen

- **Dashboard:** Eine zentrale Übersicht über anstehende Aufgaben, wichtige Termine und den Fortschritt deiner Umzugsplanung.
- **Intelligente Packliste:**
  - Erfasse Kisten und deren Inhalt detailliert.
  - Automatische Kategorie-Vorschläge für Gegenstände.
  - Generiere und scanne QR-Codes für jede Kiste, um den Inhalt schnell zu identifizieren.
  - Füge Fotos zu Kisten hinzu.
  - **KI-Packlisten-Assistent:** Lasse dir von einer KI helfen, Gegenstände für bestimmte Räume oder Kistentypen vorzuschlagen.
- **Budget Tracker:**
  - Verwalte alle umzugsbedingten Einnahmen und Ausgaben.
  - Kategorisiere Kostenpunkte.
  - Erfasse Teilzahlungen für größere Posten.
- **Kontaktmanager:** Speichere wichtige Kontakte (Handwerker, Helfer, Makler etc.) zentral.
- **To-Do Listen:**
  - Erstelle und verwalte Aufgabenlisten für verschiedene Phasen des Umzugs.
  - Setze Prioritäten und Fälligkeitsdaten.
  - **KI-To-Do-Assistent:** Erhalte Vorschläge für typische Umzugsaufgaben.
- **Materialplaner & Bedarfsrechner:**
  - Plane den Materialbedarf für Renovierungen (Farbe, Tapete, Bodenbelag, Dämmstoff).
  - Berechne benötigte Mengen und geschätzte Kosten.
  - Weitere Bedarfsrechner für Umzugskartons, Transportvolumen und Transportkosten.
- **Renovierungsplaner:** Verwalte detaillierte Renovierungsaufgaben, Kosten und Verantwortlichkeiten.
- **Responsive Design:** Optimiert für die Nutzung auf Desktops, Tablets und Smartphones.
- **PWA-Funktionalität:** Installierbar auf deinen Geräten für einen schnellen Zugriff.
- **Benutzerauthentifizierung:** Sichere Anmeldung und Verwaltung deiner persönlichen Daten.

## 🛠️ Technologie-Stack

- **Frontend:** React (mit Create React App), JavaScript
- **Styling:** Tailwind CSS
- **Backend & Datenbank:** Supabase (PostgreSQL, Auth, Storage)
- **KI-Integration:** OpenAI API (für KI-Assistenten)
- **Deployment:** Docker, Docker Compose, Nginx (als Webserver für die React Build-Dateien)

## 🚀 Voraussetzungen

- Node.js (Version 18.x oder höher empfohlen)
- npm (wird mit Node.js installiert)
- Docker und Docker Compose
- Ein Supabase-Account und ein erstelltes Projekt
- Ein OpenAI API Key (optional, für KI-Funktionen)

## ⚙️ Installation und Setup

### 1. Repository klonen

```bash
git clone https://github.com/iEnki/umzughelfer.git
cd [PROJEKTVERZEICHNIS]
```

### 2. Supabase einrichten

1.  Gehe zu deinem Supabase-Projekt.
2.  Navigiere zum **SQL Editor** (Database -> SQL Editor).
3.  Führe die SQL-Befehle aus der Datei `supabase_setup.md` aus, um alle notwendigen Tabellen und Strukturen zu erstellen. Achte auf die Hinweise in der Datei bezüglich Reihenfolge und RLS (Row Level Security).

### 3. Umgebungsvariablen konfigurieren

Erstelle im Hauptverzeichnis des Projekts (auf derselben Ebene wie `docker-compose.yml`) eine Datei namens `.env`. Füge folgende Variablen hinzu und ersetze die Platzhalter durch deine tatsächlichen Werte:

```env
# Supabase
REACT_APP_SUPABASE_URL=DEINE_SUPABASE_PROJEKT_URL
REACT_APP_SUPABASE_ANON_KEY=DEIN_SUPABASE_ANON_KEY

# OpenAI (optional, für KI-Funktionen)
REACT_APP_OPENAI_API_KEY=DEIN_OPENAI_API_KEY

# Port für den Docker-Container (kann meist so bleiben)
APP_PORT=3000
```

- `DEINE_SUPABASE_PROJEKT_URL`: Findest du in deinem Supabase Projekt unter Project Settings -> API -> Project URL.
- `DEIN_SUPABASE_ANON_KEY`: Findest du in deinem Supabase Projekt unter Project Settings -> API -> Project API keys -> anon public.

### 4. Lokale Entwicklung (ohne Docker)

Wenn du die App lokal ohne Docker entwickeln und testen möchtest:

1.  Navigiere in das Frontend-Verzeichnis:
    ```bash
    cd umzugshelfer-pwa
    ```
2.  Installiere die Abhängigkeiten:
    ```bash
    npm install
    ```
3.  Um die Umgebungsvariablen für die lokale Entwicklung verfügbar zu machen, erstelle eine `.env`-Datei direkt im `umzugshelfer-pwa` Verzeichnis (zusätzlich zu der im Root-Verzeichnis für Docker) oder setze die Variablen in deiner Shell. Die Namen müssen mit `REACT_APP_` beginnen.
    Inhalt für `umzugshelfer-pwa/.env`:
    ```env
    REACT_APP_SUPABASE_URL=DEINE_SUPABASE_PROJEKT_URL
    REACT_APP_SUPABASE_ANON_KEY=DEIN_SUPABASE_ANON_KEY
    REACT_APP_OPENAI_API_KEY=DEIN_OPENAI_API_KEY
    ```
4.  Starte den React Development Server:
    ```bash
    npm start
    ```
    Die App sollte unter `http://localhost:3000` (oder einem anderen Port, falls 3000 belegt ist) im Browser öffnen.

### 5. Docker-Deployment

Für das Deployment mit Docker (z.B. auf einem Server):

1.  Stelle sicher, dass Docker und Docker Compose auf dem Zielsystem installiert sind.
2.  Kopiere das gesamte Projektverzeichnis auf den Server oder klone es dort.
3.  Stelle sicher, dass die `.env`-Datei im Projekt-Root-Verzeichnis (neben `docker-compose.yml`) mit den korrekten Werten vorhanden ist (siehe Schritt 3).
4.  Baue die Docker-Images und starte die Container im Hintergrund:
    ```bash
    docker compose build
    docker compose up -d
    ```
    - Wenn du Änderungen am Code vorgenommen hast und neu bauen möchtest, ohne den Cache zu verwenden:
      ```bash
      docker compose build --no-cache umzugsplaner-app
      docker compose up -d --force-recreate
      ```
    - Die App ist dann über den in der `.env`-Datei (und `docker-compose.yml`) konfigurierten `APP_PORT` erreichbar (standardmäßig Port 3000 des Host-Systems).

## 📖 Verwendung

1.  **Registrierung & Login:** Erstelle einen Account oder melde dich an, um deine Umzugsdaten zu speichern.
2.  **Dashboard:** Erhalte einen schnellen Überblick.
3.  **Navigation:** Nutze die Navigationsleiste, um zu den verschiedenen Modulen zu gelangen.
    - **Packliste:** Erstelle Kisten, füge Gegenstände hinzu (manuell oder mit KI), drucke QR-Codes und verwalte Fotos.
    - **Budget:** Erfasse Einnahmen und Ausgaben, kategorisiere sie und verfolge dein Umzugsbudget.
    - **Kontakte:** Speichere alle relevanten Telefonnummern und Adressen.
    - **To-Dos:** Organisiere deine Aufgaben, setze Prioritäten und hake Erledigtes ab.
    - **Materialplaner/Bedarfsrechner:** Plane Materialien für Renovierungen oder berechne Umzugsvolumen.
4.  **KI-Assistenten:** Nutze die KI-Buttons in den Modulen Packliste und To-Dos, um dir bei der Erstellung von Inhalten helfen zu lassen. (Benötigt einen konfigurierten OpenAI API Key).

## 📁 Projektstruktur (Frontend `umzugshelfer-pwa`)

```
umzugshelfer-pwa/
├── public/             # Statische Dateien, index.html, manifest.json
├── src/
│   ├── components/     # React-Komponenten für verschiedene Features
│   │   ├── featurepages/ # Spezifische Landingpages für Features (Info)
│   │   └── ...         # Weitere UI-Komponenten
│   ├── utils/          # Hilfsfunktionen
│   ├── App.js          # Haupt-App-Komponente mit Routing
│   ├── index.js        # Einstiegspunkt der React-Anwendung
│   ├── index.css       # Globale Styles und Tailwind-Importe
│   └── supabaseClient.js # Supabase Client Initialisierung
├── .dockerignore       # Definiert Dateien, die beim Docker-Build ignoriert werden
├── Dockerfile          # Anweisungen zum Bauen des Frontend Docker-Images
├── package.json        # Projekt-Metadaten und Abhängigkeiten
└── tailwind.config.js  # Konfiguration für Tailwind CSS
```

## 🤝 Contributing 

Wenn du zum Projekt beitragen möchtest, beachte bitte folgende Punkte:

- Erstelle einen Fork des Repositories.
- Entwickle neue Features oder Bugfixes in einem eigenen Branch.
- Stelle sicher, dass dein Code den bestehenden Coding-Style einhält.
- Erstelle einen Pull Request mit einer klaren Beschreibung deiner Änderungen.

## 📜 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe die `LICENSE`-Datei für weitere Details (falls vorhanden).

---

Ich hoffen, dieser Umzugsplaner macht deinen nächsten Umzug ein wenig einfacher!




