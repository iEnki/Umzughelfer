# Umzughelfer PWA — Projektgedächtnis

## Projektstruktur
- **Root:** `E:\Code Projekte\umzughelfer`
- **App:** `umzugshelfer-pwa/` (React 18, CRA, Tailwind CSS, Supabase)
- **Commands:** alle von `umzugshelfer-pwa/` ausführen (`npm start`, `node_modules/.bin/react-scripts build`)
- `react-scripts` muss über `node_modules/.bin/react-scripts` aufgerufen werden (nicht global installiert)

## Architektur
- **Auth:** `supabase.auth.onAuthStateChange` in `App.js`, `session` als Prop
- **Theme:** `src/contexts/ThemeContext.js` — dark/light, localStorage, React Context
- **App-Modus:** `src/contexts/AppModeContext.js` — "umzug"|"home", localStorage, React Context
- **Routing:** React Router v6, `ProtectedRoute` in `App.js`, keine separaten Layoutkomponenten
- **Supabase:** Singleton in `src/supabaseClient.js`

## Implementierter Home Organizer (Phase 0+1, Stand 2026-03-07)

### Neue Dateien
- `src/contexts/AppModeContext.js` — Modus-State ("umzug"|"home"), Onboarding-Gate, Migrations-Flags
- `src/components/home/HomeDashboard.js` — Dashboard mit Kacheln
- `src/components/home/HomeInventar.js` — Ort→Lagerort→Objekt Hierarchie + QR
- `src/components/home/HomeVorraete.js` — Vorratsverwaltung mit Ampel
- `src/components/home/HomeEinkaufliste.js` — Einkaufsliste
- `src/components/home/HomeHaushaltsaufgaben.js` — Haushaltsaufgaben (filtert todo_aufgaben nach app_modus)
- `src/components/home/HomeGeraete.js` — Geräte + Wartungsprotokoll
- `src/components/home/HomeBudget.js` — Haushaltsbudget (filtert budget_posten nach app_modus)
- `src/components/home/HomeProjekte.js` — Haushaltsprojekte
- `src/components/home/HomeGlobalSuche.js` — Volltext-Suche über alle Home-Tabellen
- `src/components/home/HomeOnboarding.js` — Erster-Login Modusauswahl
- `src/components/home/UmzugAbschlussModal.js` — 5-Schritt-Migrations-Wizard
- `umzugshelfer-pwa/supabase_home_setup.md` — SQL für neue Tabellen (in Supabase SQL-Editor ausführen!)

### Geänderte Dateien
- `src/App.js` — AppModeProvider, OnboardingGate, alle /home/* Routen
- `src/components/Navbar.js` — dynamische navItems nach Modus, Mode-Toggle Button (Truck/Home Icon)
- `src/components/Dashboard.js` — "Umzug abschließen" Banner wenn Fortschritt 100%

### Neue Supabase-Tabellen (SQL noch nicht ausgeführt!)
`home_orte`, `home_lagerorte`, `home_objekte`, `home_vorraete`, `home_einkaufliste`,
`home_geraete`, `home_wartungen`, `home_projekte`

### ALTER auf bestehenden Tabellen (noch nicht ausgeführt!)
- `todo_aufgaben.app_modus` (default 'umzug')
- `todo_aufgaben.home_projekt_id`
- `budget_posten.app_modus` (default 'umzug')
- `budget_posten.home_projekt_id`
- `user_profile.app_modus`

## Nächste Schritte (Phase 2)
- Supabase SQL aus `supabase_home_setup.md` ausführen
- HomeGeraete: Verknüpfung mit DokumentenManager
- HomeBudget: Monats/Jahres-Ansicht
- HomeProjekte: Todo- und Budget-Verknüpfung
- Navbar-Suche im Home-Modus erweitern

## Wichtige Konventionen
- Alle Komponenten empfangen `session` als Prop
- Supabase-Queries direkt in Komponenten (kein zentrales State-Management)
- Tailwind-Dark-Mode via `dark:` Prefix, Klassen: `dark-bg`, `dark-card`, `dark-text-main`, etc.
- Lucide-React für Icons
- Deutsche UI-Texte und Kommentare
