# Umzugsplaner – Changelog

## Priorität 1 – Schnelle Mehrwerte (2025)

### 1. Dashboard – Echter Renovierungsfortschritt
**Datei:** `src/components/Dashboard.js`

Vorher war der Renovierungsfortschritt auf 30% hardcoded. Jetzt wird die Tabelle `renovierungs_posten` abgefragt und der echte Fortschritt berechnet (Anzahl Posten mit Status "Erledigt" / Gesamtanzahl). Der Wert fließt auch in den Gesamtfortschritts-Balken des Dashboards ein. Außerdem wurde der fehlerhafte Link von `/renovierung` auf `/materialplaner` korrigiert.

---

### 2. To-Dos – Eigene Vorlagen erstellen
**Datei:** `src/components/TodoListenManager.js`
**DB-Änderung:** `todo_vorlagen.user_id` (nullable) + neue RLS-Policies

Nutzer können jetzt eigene Aufgaben-Vorlagen erstellen und löschen. Im Vorlagen-Modal gibt es einen neuen Reiter "Meine Vorlagen" neben den globalen Vorlagen. Eigene Vorlagen werden mit `user_id` gespeichert; globale Vorlagen haben `user_id = NULL`. Die RLS-Policy wurde so angepasst, dass Nutzer nur ihre eigenen Vorlagen bearbeiten/löschen können, aber alle globalen lesen können.

---

### 3. Budget – CSV-Export
**Datei:** `src/components/BudgetTracker.js`

Neuer Button "CSV exportieren" in der Budget-Ansicht. Alle Kostenposten werden als semikolon-separierte CSV-Datei mit UTF-8 BOM heruntergeladen (kompatibel mit Microsoft Excel). Die Datei enthält: Beschreibung, Kategorie, geplanter Betrag, bezahlter Betrag, Status, Fälligkeitsdatum, Notizen.

---

### 4. Kontakte – vCard Import/Export
**Datei:** `src/components/KontaktManager.js`

Zwei neue Buttons in der Kontaktverwaltung:
- **vCard Export:** Alle Kontakte werden als `.vcf`-Datei im vCard 3.0-Format heruntergeladen (kompatibel mit iOS, Android, Outlook, macOS Contacts).
- **vCard Import:** Eine `.vcf`-Datei importieren. Felder wie Name, Telefon, Adresse und Notizen werden automatisch aus dem vCard-Format extrahiert und als neue Kontakte gespeichert.

---

### 5. Packliste – PDF-Export
**Dateien:** `src/components/PacklisteManager.js`, `src/components/PacklistePDF.js` (neu)

Neuer "PDF Export"-Button in der Packlisten-Ansicht (erscheint wenn mindestens eine Kiste vorhanden ist). Erstellt ein strukturiertes A4-PDF mit:
- Titelseite mit Exportdatum und Kistenanzahl
- Pro Kiste: Name, Zielraum, QR-Code-Wert
- Tabelle der Gegenstände (Beschreibung, Kategorie, Menge)
- Seitennummern in der Fußzeile

Nutzt `@react-pdf/renderer` (war bereits installiert).

---

### SQL-Migration (Bestandsinstallationen)
**Datei:** `supabase_setup.md`

Die Datenbankdefinition in `supabase_setup.md` wurde aktualisiert:
- `todo_vorlagen` enthält jetzt eine nullable `user_id`-Spalte
- RLS-Policies für SELECT (global + eigene), INSERT und DELETE wurden ergänzt
- Am Ende der Datei wurde ein `-- MIGRATIONEN`-Block mit idempotenten `ALTER TABLE IF NOT EXISTS`-Befehlen ergänzt, die auf bestehenden Installationen ausgeführt werden können

---

## Priorität 2 – Neue nützliche Features (2026)

### 6. Erinnerungs-System (Browser Notifications)
**Datei:** `src/hooks/useErinnerungen.js` (neu), `src/App.js`

Wenn ein To-Do ein `Erinnerungsdatum` gesetzt hat, erscheint jetzt automatisch eine Browser-Benachrichtigung. Die App fragt beim ersten Start nach der Benachrichtigungsberechtigung. Benachrichtigungen werden einmalig angezeigt (bereits gezeigte IDs werden in localStorage gespeichert, um Duplikate zu verhindern). Der Check läuft einmal pro Minute im Hintergrund.

---

### 7. Phasen-Checkliste im Dashboard
**Datei:** `src/components/Dashboard.js`

Neue Sektion "Umzugsfortschritt nach Phase" unterhalb des Haupt-Dashboards. Alle To-Dos werden den drei Phasen zugeordnet:
- **Vor dem Umzug:** Verträge, Organisation, Finanzen, Dokumente, Ausmisten, Wohnung
- **Umzugstag:** Umzugstag, Transport
- **Nach dem Umzug:** Behörde, Versorger, Gesundheit, Sonstiges, Fahrzeuge

Jede Phase zeigt erledigte/gesamt Aufgaben und einen farbigen Fortschrittsbalken.

---

### 8. Kostenvergleich
**Datei:** `src/components/KostenVergleich.js` (neu), `src/App.js`, `src/components/Navbar.js`

Neue Seite "Kostenvergleich" (Route: `/kostenvergleich`) für den Vergleich zwischen eigenem Umzug und einem Umzugsunternehmen:
- Eingabe des Unternehmensangebots (wird in localStorage gespeichert)
- Automatisches Laden der Budget-Posten aus relevanten Kategorien
- Wählbare Kostenkategorien per Toggle-Buttons
- Ergebnisanzeige mit Vergleichs-Panel und Einsparungsanzeige

---

### 9. Globale Suche
**Datei:** `src/components/Navbar.js`

Suchfeld in der Desktop-Navbar (zwischen Logo und Navigations-Links). Sucht mit 350ms Debounce parallel in:
- Kontakten (Name)
- To-Dos (Beschreibung)
- Pack-Kisten (Name)
- Dokumenten (Dateiname)

Ergebnisse erscheinen als Dropdown mit Modul-Badge und direktem Link.

---

### 10. Automatische Wiederholaufgaben
**Datei:** `src/components/TodoListenManager.js`

Wenn eine Aufgabe mit gesetztem `Wiederholung`-Typ als erledigt markiert wird, erstellt die App automatisch eine neue Instanz der Aufgabe mit dem nächsten Fälligkeitsdatum:
- Täglich: +n Tage
- Wöchentlich: +7×n Tage
- Monatlich: +n Monate
- Jährlich: +n Jahre

---

### 11. Bedarfsrechner – Szenarien speichern
**Datei:** `src/components/RechnerSzenarienManager.js` (neu), `src/components/BedarfsrechnerPage.js`

Neuer Tab "Szenarien" im Bedarfsrechner. Nutzer können berechnete Ergebnisse mit Name, Rechner-Typ (Wandfarbe/Boden/Tapete/Dämmstoff/…), Ergebnis und Notizen in der Datenbank speichern und vergleichen.

**DB-Änderung:** Neue Tabelle `rechner_szenarien` (user_id, name, rechner_typ, ergebnis, notizen).

---

### 12. Kontakt-Bewertungen & Bemerkungen
**Datei:** `src/components/KontaktManager.js`

Kontakte können jetzt bewertet und kommentiert werden:
- **Sternebewertung (1–5):** Direkt im Kontaktformular per klickbarer Sterne anzeigbar; wird auf der Kontaktkarte angezeigt
- **Bemerkungen:** Freitextfeld für strukturierte Notizen (Preis, Verfügbarkeit, Empfehlung) – separat vom allgemeinen Notiz-Feld

**DB-Änderung:** Neue Spalten `bewertung integer` und `bemerkungen text` in der `kontakte`-Tabelle.

---

### SQL-Migrationen (Bestandsinstallationen)
**Datei:** `supabase_setup.md`

Am Ende der Setup-Datei wurden idempotente Migrationsbefehle ergänzt:
- `ALTER TABLE kontakte ADD COLUMN IF NOT EXISTS bewertung integer` + Check-Constraint
- `ALTER TABLE kontakte ADD COLUMN IF NOT EXISTS bemerkungen text`
- `CREATE TABLE IF NOT EXISTS rechner_szenarien` + RLS-Policy

---

## Priorität 3 – KI & Automatisierung (2026)

### 14. KI-Assistenten – Text-Eingabe als Alternative zur Sprache
**Dateien:** `src/components/KiTodoAssistent.js`, `src/components/KiPacklisteAssistent.js`

Beide KI-Assistenten haben jetzt einen Modus-Umschalter „Sprache / Text". Im Text-Modus gibt der Nutzer seine Anweisungen direkt als Text ein und klickt auf „Text analysieren". Die GPT-4o-Analyse läuft identisch zum Sprach-Modus – lediglich der Whisper-Transkriptionsschritt entfällt. Das spart API-Kosten und ermöglicht die Nutzung auf Geräten ohne Mikrofon.

---

### 15. Automatische Kategorisierung von Dokumenten
**Datei:** `src/components/DokumentenManager.js`

Nach dem Upload eines Dokuments wird (sofern ein OpenAI-API-Key hinterlegt ist) automatisch GPT-4o mit Dateiname und Dateityp aufgerufen. Das Modell schlägt eine kurze Beschreibung und eine Dokumentenkategorie vor (z.B. „Mietvertrag", „Versicherung", „Behörde"). Ein dismissbares Banner zeigt den Vorschlag an; der Nutzer kann ihn mit einem Klick auf „Übernehmen" als Beschreibung des Dokuments speichern oder ablehnen.

---

### 16. Smarte Budget-Warnungen
**Datei:** `src/components/BudgetTracker.js`

Zwei neue Prüfmechanismen:
- **Echtzeit-Warnung beim Hinzufügen:** Wenn ein neuer Kostenposten die geplanten Gesamtkosten über das Gesamtbudget hebt, erscheint ein Bestätigungsdialog mit der genauen Überschreitungssumme. Bei 90%-Auslastung erscheint ein Hinweis.
- **Ausgaben-Prognose:** Unterhalb des Budget-Fortschrittsbalkens wird (sobald mindestens zwei Teilzahlungen mit Datum vorhanden sind) die durchschnittliche tägliche Ausgabe angezeigt sowie das voraussichtliche Datum, an dem das Budget aufgebraucht sein wird.

---

### 17. Inventarverwaltung nach dem Umzug (Auspacken-Workflow)
**Datei:** `src/components/PacklisteManager.js`
**DB-Änderung:** `pack_gegenstaende.ausgepakt_am` (timestamp, nullable)

Neuer Workflow für die Zeit nach dem Umzug:
- **Auspacken-Toggle:** Jeder Gegenstand im Kisten-Modal hat jetzt ein Häkchen-Icon (PackageCheck). Ein Klick setzt `ausgepakt_am` auf das aktuelle Datum/Zeit oder löscht es wieder. Ausgepackte Gegenstände werden mit Durchstreichung angezeigt.
- **Fortschrittsbalken auf Kisten-Kacheln:** Kisten mit mindestens einem ausgepackten Gegenstand zeigen einen grünen Fortschrittsbalken (X/Y ausgepackt).
- **Raum-Inventar:** Eine neue aufklappbare Sektion „Raum-Inventar (ausgepackt)" erscheint unterhalb der Kistenliste, sobald der erste Gegenstand ausgepakt ist. Sie zeigt alle ausgepackten Gegenstände nach Zielraum gruppiert – so entsteht automatisch eine Raumübersicht.

---

### SQL-Migrationen (Bestandsinstallationen)
**Datei:** `supabase_setup.md`

- `ALTER TABLE pack_gegenstaende ADD COLUMN IF NOT EXISTS ausgepakt_am timestamptz`
