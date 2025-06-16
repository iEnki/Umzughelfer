# Supabase Tabellen Setup für Umzugsplaner PWA

Diese Datei enthält die SQL-Befehle, die benötigt werden, um alle notwendigen Tabellen und Strukturen in deiner Supabase-Datenbank für die Umzugsplaner PWA einzurichten.

**Wichtige Hinweise vorab:**

- Führe diese SQL-Befehle im Supabase SQL Editor aus (Database -> SQL Editor -> New query).
- Die Reihenfolge der Befehle ist wichtig, insbesondere bei der Erstellung von Tabellen mit Foreign Key Constraints.
- Stelle sicher, dass Row Level Security (RLS) für alle Tabellen aktiviert und korrekt konfiguriert ist, damit Benutzer nur auf ihre eigenen Daten zugreifen können (oder auf Daten von Umzügen, bei denen sie Mitglied sind). Beispiele für RLS-Policies sind teilweise enthalten.
- Die `user_profile` Tabelle wird typischerweise durch eine Trigger-Funktion auf `auth.users` automatisch befüllt, wenn sich ein neuer Benutzer registriert. Stelle sicher, dass eine solche Funktion existiert oder erstelle sie.

## Phase 0: Grundlegende User Profile Tabelle (falls nicht schon vorhanden)

Supabase erstellt normalerweise eine `auth.users` Tabelle. Es ist üblich, eine `public.user_profile` Tabelle zu haben, die zusätzliche Benutzerinformationen speichert und über eine `id` (UUID, die `auth.users.id` entspricht) verknüpft ist.

```sql
-- Erstellen der user_profile Tabelle, falls sie nicht existiert
-- Diese Tabelle wird oft durch einen Trigger auf auth.users befüllt.
CREATE TABLE IF NOT EXISTS public.user_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_profile IS 'Speichert öffentliche Profilinformationen für Benutzer.';

-- Trigger-Funktion, um user_profile automatisch zu befüllen (Beispiel)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '-' || SUBSTRING(NEW.id::text, 1, 4)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auf auth.users Tabelle
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funktion und Trigger für updated_at auf user_profile
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_profile_updated_at
BEFORE UPDATE ON public.user_profile
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

## Phase 2: Erweiterung der `user_profile` Tabelle (aus `03_user_profile_add_openai_key.sql`)

```sql
-- Fügt der Tabelle "user_profile" eine Spalte "openai_api_key" hinzu.
-- WICHTIGER SICHERHEITSHINWEIS: Siehe Kommentare in der Originaldatei 03_user_profile_add_openai_key.sql
ALTER TABLE public.user_profile
ADD COLUMN openai_api_key TEXT NULL;

COMMENT ON COLUMN public.user_profile.openai_api_key IS 'OpenAI API-Key des Benutzers. Aus Sicherheitsgründen mit Vorsicht zu behandeln.';

-- RLS für openai_api_key (Beispiele, anpassen!):
-- CREATE POLICY "Benutzer kann eigenen API Key sehen"
-- ON public.user_profile FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Benutzer kann eigenen API Key aktualisieren"
-- ON public.user_profile FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

## Phase 3: Kern-Funktionstabellen

Diese Tabellen speichern die Daten für die Hauptfunktionen der App. Jede Tabelle enthält eine `user_id` Spalte (für den Ersteller/Besitzer) und eine `umzugs_id` Spalte für die Zuordnung zu einem Kollaborationsprojekt.

### 3.1 Kontakte (`kontakte`)

```sql
CREATE TABLE public.kontakte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  kategorie TEXT, -- z.B. Handwerker, Helfer, Makler
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.kontakte IS 'Speichert Kontakte, die für den Umzug relevant sind.';

-- Erweiterung aus 02_kontakte_add_adresse_column.sql
ALTER TABLE public.kontakte
ADD COLUMN adresse TEXT NULL;

COMMENT ON COLUMN public.kontakte.adresse IS 'Vollständige Adresse des Kontakts (Straße, Hausnummer, PLZ, Ort, Land).';

CREATE TRIGGER on_kontakte_updated_at
BEFORE UPDATE ON public.kontakte
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_kontakte_user_id ON public.kontakte(user_id);
```

### 3.2 Budget Tracker (`budget_posten`)

```sql
CREATE TABLE public.budget_posten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  beschreibung TEXT NOT NULL,
  betrag NUMERIC(10, 2) NOT NULL, -- z.B. 12345.67
  typ TEXT NOT NULL CHECK (typ IN ('Einnahme', 'Ausgabe')),
  kategorie TEXT, -- z.B. Miete, Kaution, Transport, Verpflegung
  datum DATE DEFAULT CURRENT_DATE,
  beleg_url TEXT, -- Optional: Link zu einem gescannten Beleg
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.budget_posten IS 'Speichert Einnahmen und Ausgaben für den Umzug.';

CREATE TRIGGER on_budget_posten_updated_at
BEFORE UPDATE ON public.budget_posten
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_budget_posten_user_id ON public.budget_posten(user_id);
```

### 3.3 To-Do Listen (`todo_aufgaben`)

```sql
CREATE TABLE public.todo_aufgaben (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  beschreibung TEXT NOT NULL,
  kategorie TEXT, -- z.B. Behörden, Packen, Organisation
  prioritaet TEXT DEFAULT 'Mittel' CHECK (prioritaet IN ('Hoch', 'Mittel', 'Niedrig')),
  erledigt BOOLEAN DEFAULT FALSE,
  faelligkeitsdatum DATE,
  erinnerungs_datum TIMESTAMPTZ,
  anhaenge TEXT[], -- Array von Texten, z.B. für Links oder Dateinamen
  wiederholung_typ TEXT CHECK (wiederholung_typ IN ('Täglich', 'Wöchentlich', 'Monatlich', 'Jährlich')),
  wiederholung_intervall INTEGER,
  budget_posten_id uuid REFERENCES public.budget_posten(id) ON DELETE SET NULL, -- Optionale Verknüpfung
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.todo_aufgaben IS 'Speichert To-Do Aufgaben für den Umzug.';

CREATE TRIGGER on_todo_aufgaben_updated_at
BEFORE UPDATE ON public.todo_aufgaben
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_todo_aufgaben_user_id ON public.todo_aufgaben(user_id);
CREATE INDEX idx_todo_aufgaben_budget_posten_id ON public.todo_aufgaben(budget_posten_id);

-- Erweiterung aus 05_alter_todo_aufgaben.sql
ALTER TABLE public.todo_aufgaben
ADD COLUMN IF NOT EXISTS angehaengte_dokument_ids UUID[];

COMMENT ON COLUMN public.todo_aufgaben.angehaengte_dokument_ids IS 'Array von IDs aus der Tabelle "dokumente", die dieser Aufgabe zugeordnet sind.';
```

### 3.4 Packlisten - Kisten (`pack_kisten`)

```sql
CREATE TABLE public.pack_kisten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  kisten_nummer TEXT, -- Kann auch automatisch generiert werden
  name TEXT NOT NULL, -- z.B. "Küche Geschirr", "Wohnzimmer Bücher"
  raum_alt TEXT, -- Raum in der alten Wohnung
  raum_neu TEXT, -- Zielraum in der neuen Wohnung
  status TEXT DEFAULT 'geplant' CHECK (status IN ('geplant', 'gepackt', 'transportiert', 'ausgepackt')),
  qr_code_text TEXT UNIQUE, -- Eindeutiger Text für den QR Code, kann die ID sein
  foto_url TEXT, -- URL zu einem Foto der Kiste oder des Inhalts
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pack_kisten IS 'Speichert Informationen zu einzelnen Umzugskisten.';

CREATE TRIGGER on_pack_kisten_updated_at
BEFORE UPDATE ON public.pack_kisten
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_pack_kisten_user_id ON public.pack_kisten(user_id);
```

### 3.5 Packlisten - Gegenstände (`pack_gegenstaende`)

```sql
CREATE TABLE public.pack_gegenstaende (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  kisten_id uuid REFERENCES public.pack_kisten(id) ON DELETE CASCADE, -- Gegenstand gehört zu einer Kiste
  beschreibung TEXT NOT NULL,
  menge INTEGER DEFAULT 1,
  wertvoll BOOLEAN DEFAULT FALSE,
  foto_url TEXT, -- URL zu einem Foto des Gegenstands
  notiz TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pack_gegenstaende IS 'Speichert einzelne Gegenstände innerhalb der Packkisten.';
COMMENT ON COLUMN public.pack_gegenstaende.kisten_id IS 'ID der Kiste, in der sich der Gegenstand befindet.';


CREATE TRIGGER on_pack_gegenstaende_updated_at
BEFORE UPDATE ON public.pack_gegenstaende
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_pack_gegenstaende_user_id ON public.pack_gegenstaende(user_id);
CREATE INDEX idx_pack_gegenstaende_kisten_id ON public.pack_gegenstaende(kisten_id);
```

### 3.5.1 Dokumentenablage (`dokumente` und `kisten_dokumente`)

Diese Tabellen wurden in `04_dokumente_tabelle_erstellen.sql` eingeführt.

```sql
-- Tabelle für hochgeladene Dokumente
CREATE TABLE IF NOT EXISTS public.dokumente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
    dateiname TEXT NOT NULL,
    datei_typ TEXT, -- MIME-Typ der Datei
    datei_groesse_bytes BIGINT,
    storage_pfad TEXT NOT NULL UNIQUE, -- Pfad im Supabase Storage
    beschreibung TEXT,
    tags TEXT[], -- z.B. {'Mietvertrag', 'Rechnung', 'wichtig'}
    todo_aufgabe_id UUID REFERENCES public.todo_aufgaben(id) ON DELETE SET NULL, -- Optionale direkte Verknüpfung zu einer Aufgabe
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.dokumente IS 'Speichert Metadaten zu hochgeladenen Dokumenten.';
COMMENT ON COLUMN public.dokumente.storage_pfad IS 'Eindeutiger Pfad zur Datei im Supabase Storage.';
COMMENT ON COLUMN public.dokumente.todo_aufgabe_id IS 'Optionale direkte Verknüpfung zu einer To-Do Aufgabe.';

CREATE TRIGGER on_dokumente_updated_at
BEFORE UPDATE ON public.dokumente
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_dokumente_user_id ON public.dokumente(user_id);
CREATE INDEX idx_dokumente_todo_aufgabe_id ON public.dokumente(todo_aufgabe_id);

-- Zwischentabelle für die N:M-Beziehung zwischen Kisten und Dokumenten
CREATE TABLE IF NOT EXISTS public.kisten_dokumente (
    kiste_id UUID REFERENCES public.pack_kisten(id) ON DELETE CASCADE,
    dokument_id UUID REFERENCES public.dokumente(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL, -- Um RLS zu vereinfachen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (kiste_id, dokument_id)
);

COMMENT ON TABLE public.kisten_dokumente IS 'Verknüpft Dokumente mit Packkisten (N:M Beziehung).';

CREATE INDEX idx_kisten_dokumente_user_id ON public.kisten_dokumente(user_id);
```

### 3.6 Materialplaner (`material_planung`)

```sql
CREATE TABLE public.material_planung (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  raum_name TEXT, -- z.B. Wohnzimmer, Küche alte Wohnung, Bad neue Wohnung
  material_typ TEXT NOT NULL, -- z.B. Farbe, Tapete, Laminat, Fliesenkleber, Umzugskartons
  produkt_name TEXT, -- Optional: Spezifischer Produktname
  bedarf_menge NUMERIC(10, 2),
  bedarf_einheit TEXT, -- z.B. Liter, Rolle, qm, Stück
  geschätzte_kosten NUMERIC(10, 2),
  gekauft BOOLEAN DEFAULT FALSE,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.material_planung IS 'Speichert den Materialbedarf für Renovierungen und den Umzug selbst.';

CREATE TRIGGER on_material_planung_updated_at
BEFORE UPDATE ON public.material_planung
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_material_planung_user_id ON public.material_planung(user_id);
```

### 3.6.1 Materialkategorien und Materialien (aus `materialien_supabase_500.sql`)

```sql
-- Tabelle für Materialkategorien
CREATE TABLE IF NOT EXISTS public.material_kategorien (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE, -- NULL für globale Kategorien
    name TEXT NOT NULL,
    beschreibung TEXT,
    sortier_reihenfolge INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, name) -- Benutzerdefinierte Kategorien müssen pro Benutzer eindeutig sein
);

COMMENT ON TABLE public.material_kategorien IS 'Kategorien für Materialien (z.B. Farben, Werkzeuge, Verpackung).';

-- Tabelle für Materialien
CREATE TABLE IF NOT EXISTS public.materialien (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profile(id) ON DELETE CASCADE, -- NULL für globale Materialien
    kategorie_id UUID REFERENCES public.material_kategorien(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    beschreibung TEXT,
    einheit TEXT, -- z.B. Stück, Liter, Rolle, m²
    geschätzter_preis_pro_einheit NUMERIC(10, 2),
    standard_menge NUMERIC(10,2) DEFAULT 1,
    link_zum_produkt TEXT,
    notizen TEXT,
    sortier_reihenfolge INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, name, kategorie_id) -- Benutzerdefinierte Materialien pro Kategorie eindeutig
);

COMMENT ON TABLE public.materialien IS 'Vordefinierte oder benutzerdefinierte Materialien für den Materialplaner.';

-- RLS Policies (Beispiele)
ALTER TABLE public.material_kategorien ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materialkategorien öffentlich lesbar oder eigene" ON public.material_kategorien FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Benutzer können eigene Materialkategorien verwalten" ON public.material_kategorien FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.materialien ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materialien öffentlich lesbar oder eigene" ON public.materialien FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Benutzer können eigene Materialien verwalten" ON public.materialien FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indizes
CREATE INDEX idx_material_kategorien_user_id ON public.material_kategorien(user_id);
CREATE INDEX idx_materialien_user_id ON public.materialien(user_id);
CREATE INDEX idx_materialien_kategorie_id ON public.materialien(kategorie_id);
```

### 3.7 Renovierungs-Posten (`renovierungs_posten`)

```sql
CREATE TABLE public.renovierungs_posten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  raum_name TEXT, -- z.B. Wohnzimmer, Küche neue Wohnung
  beschreibung TEXT NOT NULL, -- Was wird gemacht? z.B. Wände streichen, Laminat verlegen
  kategorie TEXT, -- z.B. Malerarbeiten, Bodenlegen, Elektrik, Sanitär, Materialkauf
  status TEXT DEFAULT 'geplant' CHECK (status IN ('geplant', 'in Arbeit', 'erledigt', 'abgebrochen')),
  geschätzte_kosten NUMERIC(10, 2),
  tatsächliche_kosten NUMERIC(10, 2),
  start_datum DATE,
  end_datum DATE,
  verantwortlicher_kontakt_id uuid REFERENCES public.kontakte(id) ON DELETE SET NULL, -- Optional: Welcher Handwerker/Kontakt ist zuständig?
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.renovierungs_posten IS 'Speichert einzelne Posten für Renovierungsarbeiten.';
COMMENT ON COLUMN public.renovierungs_posten.verantwortlicher_kontakt_id IS 'Optional: Verknüpfung zu einem Kontakt (z.B. Handwerker).';

CREATE TRIGGER on_renovierungs_posten_updated_at
BEFORE UPDATE ON public.renovierungs_posten
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_renovierungs_posten_user_id ON public.renovierungs_posten(user_id);
CREATE INDEX idx_renovierungs_posten_kontakt_id ON public.renovierungs_posten(verantwortlicher_kontakt_id);
```

### 3.8 Budget Teilzahlungen (`budget_teilzahlungen`)

Diese Tabelle ermöglicht es, für einen Budget-Posten mehrere Teilzahlungen (z.B. Anzahlung, Restzahlung) zu erfassen.

```sql
CREATE TABLE public.budget_teilzahlungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profile(id) ON DELETE CASCADE NOT NULL,
  budget_posten_id uuid REFERENCES public.budget_posten(id) ON DELETE CASCADE NOT NULL,
  betrag NUMERIC(10, 2) NOT NULL,
  zahlungsdatum DATE DEFAULT CURRENT_DATE NOT NULL,
  beschreibung TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.budget_teilzahlungen IS 'Speichert Teilzahlungen für einzelne Budget-Posten.';
COMMENT ON COLUMN public.budget_teilzahlungen.budget_posten_id IS 'Verknüpfung zum übergeordneten Budget-Posten.';

CREATE TRIGGER on_budget_teilzahlungen_updated_at
BEFORE UPDATE ON public.budget_teilzahlungen
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_budget_teilzahlungen_user_id ON public.budget_teilzahlungen(user_id);
CREATE INDEX idx_budget_teilzahlungen_budget_posten_id ON public.budget_teilzahlungen(budget_posten_id);
```

### 3.9 To-Do Vorlagen (`todo_vorlagen`)

Diese Tabelle wurde in `07_todo_vorlagen_tabelle_erstellen.sql` eingeführt.

```sql
CREATE TABLE public.todo_vorlagen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beschreibung TEXT NOT NULL,
    kategorie TEXT,
    prioritaet TEXT DEFAULT 'Mittel' CHECK (prioritaet IN ('Hoch', 'Mittel', 'Niedrig')),
    faelligkeitsdatum_offset_tage INTEGER,
    standard_anhaenge_text TEXT,
    standard_wiederholung_typ TEXT DEFAULT 'Keine' CHECK (standard_wiederholung_typ IN ('Keine', 'Täglich', 'Wöchentlich', 'Monatlich', 'Jährlich')),
    standard_wiederholung_intervall INTEGER DEFAULT 1 CHECK (standard_wiederholung_intervall > 0),
    sortier_reihenfolge INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.todo_vorlagen IS 'Speichert Vorlagen für häufige To-Do Aufgaben bei Umzügen.';
COMMENT ON COLUMN public.todo_vorlagen.faelligkeitsdatum_offset_tage IS 'Offset in Tagen relativ zum Erstellungsdatum oder einem Umzugsdatum für das Fälligkeitsdatum.';

-- RLS Policy (Beispiel: Alle authentifizierten Benutzer können lesen)
ALTER TABLE public.todo_vorlagen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authentifizierte Benutzer können To-Do-Vorlagen lesen"
ON public.todo_vorlagen
FOR SELECT
TO authenticated
USING (true);

-- Beispieldaten für To-Do Vorlagen:
-- (Kombiniert aus 07_todo_vorlagen_tabelle_erstellen.sql und 08_todo_vorlagen_erweitern.sql)
INSERT INTO todo_vorlagen (beschreibung, kategorie, prioritaet, faelligkeitsdatum_offset_tage, standard_anhaenge_text, sortier_reihenfolge)
VALUES
('Mietvertrag alte Wohnung kündigen (Standard: 3 Monate Frist)', 'Verträge', 'Hoch', 90, NULL, 10),
('Nachsendeauftrag bei der Post einrichten (ca. 2 Wochen vorher)', 'Organisation', 'Hoch', 14, NULL, 20),
('Strom, Gas, Wasser ummelden (ca. 1 Woche vorher)', 'Versorger', 'Hoch', 7, NULL, 30),
('Internet- und Telefonanschluss ummelden/kündigen (ca. 4 Wochen vorher)', 'Versorger', 'Hoch', 28, NULL, 40),
('Termin für Wohnungsübergabe (alte Wohnung) vereinbaren', 'Wohnung', 'Hoch', 21, NULL, 50),
('Umzugshelfer organisieren', 'Umzugstag', 'Mittel', 30, NULL, 60),
('Umzugskartons besorgen und packen beginnen', 'Umzugstag', 'Mittel', 45, NULL, 70),
('Sperrmüll anmelden (falls benötigt)', 'Ausmisten', 'Mittel', 21, NULL, 80),
-- Zusätzliche Vorlagen:
('Umzugsurlaub beim Arbeitgeber einreichen', 'Organisation', 'Hoch', 60, 'Gesetzlicher Anspruch prüfen, schriftlich einreichen', 100),
('Kindergarten/Schule am neuen Wohnort anmelden', 'Organisation', 'Hoch', 90, 'Unterlagen: Geburtsurkunde, Meldezettel', 110),
('Haustierbetreuung für den Umzugstag organisieren', 'Organisation', 'Mittel', 14, 'Freunde fragen oder professionelle Betreuung buchen', 120),
('Adressänderung bei Banken und Versicherungen bekannt geben', 'Organisation', 'Hoch', 7, 'Online-Portale oder Formulare nutzen', 130),
('Adressänderung bei Online-Shops und Abonnements aktualisieren', 'Organisation', 'Mittel', 5, 'Wichtige Lieferdienste prüfen (Amazon, Zalando etc.)', 140),
('Termin für Sperrmüllabholung vereinbaren (falls benötigt)', 'Ausmisten', 'Mittel', 21, 'Details bei der Gemeinde/Stadt erfragen', 150),
('Wichtige Dokumente scannen und digital sichern', 'Dokumente', 'Mittel', 30, 'Cloud-Speicher oder externe Festplatte nutzen', 160),
('Schönheitsreparaturen in alter Wohnung durchführen (falls vertraglich vereinbart)', 'Wohnung', 'Mittel', 14, 'Malerarbeiten, Löcher schließen etc.', 200),
('Zählerstände (Strom, Gas, Wasser) in alter Wohnung ablesen und protokollieren', 'Wohnung', 'Hoch', 0, 'Protokoll mit Vermieter/Nachmieter, Fotos machen', 210),
('Übergabeprotokoll für alte Wohnung vorbereiten/prüfen', 'Wohnung', 'Hoch', 3, 'Mängelliste, Zustand der Räume', 220),
('Schlüssel für neue Wohnung übernehmen und Übergabeprotokoll erstellen', 'Wohnung', 'Hoch', 0, 'Zustand prüfen, Mängel dokumentieren, Zählerstände neue Wohnung', 230),
('Namensschilder an Klingel und Briefkasten (neue Wohnung) anbringen', 'Wohnung', 'Niedrig', -1, 'Nach Einzug erledigen', 240),
('Reinigung der neuen Wohnung vor Einzug organisieren/durchführen', 'Wohnung', 'Mittel', 2, 'Grundreinigung, Fenster putzen', 250),
('Packmaterial besorgen (Kartons, Klebeband, Polstermaterial)', 'Umzugstag', 'Hoch', 45, 'Auch an Werkzeug, Müllsäcke denken', 300),
('Systematisches Packen beginnen (Raum für Raum)', 'Umzugstag', 'Mittel', 30, 'Kartons beschriften (Inhalt, Zielraum)', 310),
('Erste-Hilfe-Koffer für den Umzugstag packen', 'Umzugstag', 'Mittel', 7, 'Pflaster, Desinfektionsmittel, Schmerzmittel', 320),
('Verpflegung für Umzugshelfer planen und einkaufen', 'Umzugstag', 'Mittel', 3, 'Getränke, Snacks, ggf. Mittagessen', 330),
('Parkverbotszone für Umzugswagen beantragen (falls nötig)', 'Umzugstag', 'Hoch', 21, 'Bei der zuständigen Behörde', 340),
('Transportmittel für Haustiere und Pflanzen organisieren', 'Umzugstag', 'Mittel', 7, 'Sichere Transportboxen, ggf. spezielles Fahrzeug', 350),
('Budget für Umzugskosten erstellen und verfolgen', 'Finanzen', 'Hoch', 60, 'Alle erwarteten Ausgaben auflisten', 400),
('Kaution für neue Wohnung überweisen', 'Finanzen', 'Hoch', 30, 'Zahlungsfrist beachten', 410),
('Daueraufträge für Miete etc. anpassen', 'Finanzen', 'Hoch', 5, 'Alte Daueraufträge kündigen, neue einrichten', 420),
('Wohnsitz ummelden (innerhalb der Frist)', 'Behörde', 'Hoch', -3, 'Nach Einzug, Fristen beachten (oft 3 Tage bis 2 Wochen)', 500),
('KFZ ummelden (falls anderer Zulassungsbezirk)', 'Behörde', 'Mittel', -7, 'Unterlagen: Fahrzeugpapiere, eVB-Nummer, Ausweis', 510),
('Neuen Hausarzt/Zahnarzt suchen (falls nötig)', 'Gesundheit', 'Niedrig', -30, 'Nach Einzug, Empfehlungen einholen', 520),
('Vorräte aufbrauchen (Kühlschrank, Gefriertruhe)', 'Sonstiges', 'Mittel', 14, 'Reduziert Packaufwand und Lebensmittelverschwendung', 600),
('Nachbarn über Auszug/Einzug informieren', 'Sonstiges', 'Niedrig', 3, 'Gute Geste, ggf. um Verständnis für Lärm bitten', 610),
('Werkzeugkiste für Möbelmontage/-demontage vorbereiten', 'Umzugstag', 'Mittel', 7, 'Akkuschrauber, Schraubenzieher, Hammer etc.', 620),
('Wichtige Telefonnummern und Adressen griffbereit halten', 'Organisation', 'Hoch', 1, 'Umzugsfirma, Helfer, neue/alte Vermieter', 630),
('Kinder während des Umzugs betreuen lassen oder beschäftigen', 'Organisation', 'Hoch', 0, 'Sicherheit und Stressreduktion für Kinder', 640);
```

## Phase 4: Row Level Security (RLS) Policies

RLS ist entscheidend, um sicherzustellen, dass Benutzer nur auf ihre eigenen Daten zugreifen können. Hier sind **Beispiele** – diese müssen für jede Tabelle sorgfältig erstellt und getestet werden!

**Beispiel RLS für `todo_aufgaben`:**

```sql
-- Zuerst RLS für die Tabelle aktivieren
ALTER TABLE public.todo_aufgaben ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können ihre eigenen Aufgaben sehen und bearbeiten.
CREATE POLICY "Benutzer können eigene Todos verwalten"
ON public.todo_aufgaben
FOR ALL -- Gilt für SELECT, INSERT, UPDATE, DELETE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Die komplexeren Policies bezüglich `umzug_mitglieder` und `umzugs_id` sind nicht mehr notwendig,
-- da die Kollaborationsfunktion entfernt wurde.
-- Die obige Policy "Benutzer können eigene Todos verwalten" ist für die meisten Fälle ausreichend.

-- RLS für dokumente
ALTER TABLE public.dokumente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können eigene Dokumente verwalten" ON public.dokumente FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS für kisten_dokumente
ALTER TABLE public.kisten_dokumente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können eigene Kisten-Dokument-Verknüpfungen verwalten" ON public.kisten_dokumente FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS für material_kategorien und materialien sind oben bei den Tabellendefinitionen enthalten.
-- RLS für todo_vorlagen ist oben bei der Tabellendefinition enthalten.
```

**Wiederhole ähnliche RLS-Konfigurationen (basierend auf `auth.uid() = user_id`) für alle anderen relevanten Tabellen (`kontakte`, `budget_posten`, `pack_kisten`, `pack_gegenstaende`, `material_planung`, `renovierungs_posten`, `budget_teilzahlungen`), falls noch nicht geschehen.**

## Phase 5: Storage Buckets und Policies (aus `06_storage_bucket_und_policies.sql`)

Zusätzlich zu den Tabellen werden Storage Buckets für Datei-Uploads benötigt.

```sql
-- Erstellen des Storage Buckets "dokumente_uploads", falls nicht vorhanden
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('dokumente_uploads', 'dokumente_uploads', false, false, 52428800, NULL) -- 50MB Limit, keine MIME-Type Einschränkung initial
ON CONFLICT (id) DO NOTHING;

-- Erstellen des Storage Buckets "kisten_bilder", falls nicht vorhanden
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('kisten_bilder', 'kisten_bilder', false, false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']) -- 10MB Limit, nur Bilder
ON CONFLICT (id) DO NOTHING;

-- Storage Policies für "dokumente_uploads"
-- Erlaube authentifizierten Benutzern das Hochladen in ihren eigenen Ordner (user_id/dateiname)
CREATE POLICY "Authenticated users can upload documents to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dokumente_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Erlaube Benutzern das Anzeigen/Herunterladen ihrer eigenen Dokumente
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dokumente_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Erlaube Benutzern das Löschen ihrer eigenen Dokumente
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dokumente_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies für "kisten_bilder"
CREATE POLICY "Authenticated users can upload kisten_bilder to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kisten_bilder' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own kisten_bilder"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kisten_bilder' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own kisten_bilder"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kisten_bilder' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Phase 6: Indizes

Für eine bessere Performance sollten Indizes auf häufig abgefragten Spalten, insbesondere Fremdschlüsseln und `user_id`, erstellt werden. Beispiele sind oben bei den Tabellendefinitionen enthalten.

---

Nachdem diese SQL-Befehle ausgeführt wurden, sollte deine Supabase-Datenbank bereit für die Umzugsplaner PWA sein.
