-- Umzugshelfer PWA - Supabase setup (aligned with codebase)
-- Generated: 2026-01-25
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Helper: auto-updated updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- User profile
create table if not exists public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  gesamtbudget numeric(12,2) default 0,
  openai_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profile (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists set_user_profile_updated_at on public.user_profile;
create trigger set_user_profile_updated_at
before update on public.user_profile
for each row execute function public.set_updated_at();

-- Backfill profiles for users created before trigger
insert into public.user_profile (id, email, username)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
where not exists (
  select 1 from public.user_profile p where p.id = u.id
);

alter table public.user_profile enable row level security;

drop policy if exists user_profile_select_own on public.user_profile;
create policy user_profile_select_own
on public.user_profile for select
using (auth.uid() = id);

drop policy if exists user_profile_insert_own on public.user_profile;
create policy user_profile_insert_own
on public.user_profile for insert
with check (auth.uid() = id);

drop policy if exists user_profile_update_own on public.user_profile;
create policy user_profile_update_own
on public.user_profile for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists user_profile_delete_own on public.user_profile;
create policy user_profile_delete_own
on public.user_profile for delete
using (auth.uid() = id);

-- Kontakte
create table if not exists public.kontakte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  typ text,
  telefon text,
  adresse text,
  notiz text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_kontakte_user_id on public.kontakte(user_id);

drop trigger if exists set_kontakte_updated_at on public.kontakte;
create trigger set_kontakte_updated_at
before update on public.kontakte
for each row execute function public.set_updated_at();

alter table public.kontakte enable row level security;

drop policy if exists kontakte_crud_own on public.kontakte;
create policy kontakte_crud_own
on public.kontakte for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Budget
create table if not exists public.budget_posten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  beschreibung text not null,
  kategorie text,
  betrag numeric(12,2) not null,
  datum date not null default current_date,
  lieferdatum date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_budget_posten_user_id on public.budget_posten(user_id);
create index if not exists idx_budget_posten_datum on public.budget_posten(datum);

drop trigger if exists set_budget_posten_updated_at on public.budget_posten;
create trigger set_budget_posten_updated_at
before update on public.budget_posten
for each row execute function public.set_updated_at();

alter table public.budget_posten enable row level security;

drop policy if exists budget_posten_crud_own on public.budget_posten;
create policy budget_posten_crud_own
on public.budget_posten for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.budget_teilzahlungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  posten_id uuid references public.budget_posten(id) on delete cascade not null,
  betrag_teilzahlung numeric(12,2) not null,
  datum_teilzahlung date not null default current_date,
  notiz_teilzahlung text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_budget_teilzahlungen_user_id on public.budget_teilzahlungen(user_id);
create index if not exists idx_budget_teilzahlungen_posten_id on public.budget_teilzahlungen(posten_id);

drop trigger if exists set_budget_teilzahlungen_updated_at on public.budget_teilzahlungen;
create trigger set_budget_teilzahlungen_updated_at
before update on public.budget_teilzahlungen
for each row execute function public.set_updated_at();

alter table public.budget_teilzahlungen enable row level security;

drop policy if exists budget_teilzahlungen_crud_own on public.budget_teilzahlungen;
create policy budget_teilzahlungen_crud_own
on public.budget_teilzahlungen for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- To-Dos
create table if not exists public.todo_aufgaben (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  beschreibung text not null,
  kategorie text not null,
  prioritaet text default 'Mittel',
  erledigt boolean default false,
  faelligkeitsdatum timestamptz,
  erinnerungs_datum timestamptz,
  anhaenge text[],
  wiederholung_typ text,
  wiederholung_intervall integer,
  budget_posten_id uuid references public.budget_posten(id) on delete set null,
  angehaengte_dokument_ids uuid[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_todo_aufgaben_user_id on public.todo_aufgaben(user_id);
create index if not exists idx_todo_aufgaben_budget_posten_id on public.todo_aufgaben(budget_posten_id);
create index if not exists idx_todo_aufgaben_faelligkeit on public.todo_aufgaben(faelligkeitsdatum);

drop trigger if exists set_todo_aufgaben_updated_at on public.todo_aufgaben;
create trigger set_todo_aufgaben_updated_at
before update on public.todo_aufgaben
for each row execute function public.set_updated_at();

alter table public.todo_aufgaben enable row level security;

drop policy if exists todo_aufgaben_crud_own on public.todo_aufgaben;
create policy todo_aufgaben_crud_own
on public.todo_aufgaben for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- To-Do Vorlagen
create table if not exists public.todo_vorlagen (
  id uuid primary key default gen_random_uuid(),
  beschreibung text not null,
  kategorie text,
  prioritaet text default 'Mittel',
  faelligkeitsdatum_offset_tage integer,
  standard_anhaenge_text text,
  standard_wiederholung_typ text default 'Keine',
  standard_wiederholung_intervall integer default 1,
  sortier_reihenfolge integer default 0,
  created_at timestamptz default now()
);

-- Seed todo_vorlagen (reset to defaults)
delete from public.todo_vorlagen;
INSERT INTO public.todo_vorlagen (beschreibung, kategorie, prioritaet, faelligkeitsdatum_offset_tage, standard_anhaenge_text, sortier_reihenfolge)
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
alter table public.todo_vorlagen enable row level security;

drop policy if exists todo_vorlagen_read on public.todo_vorlagen;
create policy todo_vorlagen_read
on public.todo_vorlagen for select to authenticated
using (true);

-- Packliste
create table if not exists public.pack_kisten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  raum_neu text,
  qr_code_wert text unique,
  foto_pfad text,
  status_kiste text default 'Geplant',
  notizen text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pack_kisten_user_id on public.pack_kisten(user_id);

drop trigger if exists set_pack_kisten_updated_at on public.pack_kisten;
create trigger set_pack_kisten_updated_at
before update on public.pack_kisten
for each row execute function public.set_updated_at();

alter table public.pack_kisten enable row level security;

drop policy if exists pack_kisten_crud_own on public.pack_kisten;
create policy pack_kisten_crud_own
on public.pack_kisten for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.pack_gegenstaende (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  kiste_id uuid references public.pack_kisten(id) on delete cascade not null,
  beschreibung text not null,
  menge integer default 1,
  kategorie text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Legacy fix: merge old kisten_id into kiste_id and remove duplicate relationship
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pack_gegenstaende'
      and column_name = 'kiste_id'
  ) then
    alter table public.pack_gegenstaende add column kiste_id uuid;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pack_gegenstaende'
      and column_name = 'kisten_id'
  ) then
    execute 'update public.pack_gegenstaende set kiste_id = coalesce(kiste_id, kisten_id) where kisten_id is not null';
    execute 'alter table public.pack_gegenstaende drop constraint if exists pack_gegenstaende_kisten_id_fkey';
    execute 'alter table public.pack_gegenstaende drop column if exists kisten_id cascade';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pack_gegenstaende_kiste_id_fkey'
  ) then
    execute 'alter table public.pack_gegenstaende add constraint pack_gegenstaende_kiste_id_fkey foreign key (kiste_id) references public.pack_kisten(id) on delete cascade';
  end if;

  if not exists (
    select 1 from public.pack_gegenstaende where kiste_id is null
  ) then
    execute 'alter table public.pack_gegenstaende alter column kiste_id set not null';
  end if;
end $$;

create index if not exists idx_pack_gegenstaende_user_id on public.pack_gegenstaende(user_id);
create index if not exists idx_pack_gegenstaende_kiste_id on public.pack_gegenstaende(kiste_id);

drop trigger if exists set_pack_gegenstaende_updated_at on public.pack_gegenstaende;
create trigger set_pack_gegenstaende_updated_at
before update on public.pack_gegenstaende
for each row execute function public.set_updated_at();

alter table public.pack_gegenstaende enable row level security;

drop policy if exists pack_gegenstaende_crud_own on public.pack_gegenstaende;
create policy pack_gegenstaende_crud_own
on public.pack_gegenstaende for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Dokumente
create table if not exists public.dokumente (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  dateiname text not null,
  datei_typ text,
  storage_pfad text not null unique,
  beschreibung text,
  groesse_kb integer,
  todo_aufgabe_id uuid references public.todo_aufgaben(id) on delete set null,
  erstellt_am timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_dokumente_user_id on public.dokumente(user_id);
create index if not exists idx_dokumente_todo_aufgabe_id on public.dokumente(todo_aufgabe_id);

drop trigger if exists set_dokumente_updated_at on public.dokumente;
create trigger set_dokumente_updated_at
before update on public.dokumente
for each row execute function public.set_updated_at();

alter table public.dokumente enable row level security;

drop policy if exists dokumente_crud_own on public.dokumente;
create policy dokumente_crud_own
on public.dokumente for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Renovierungs-Posten
create table if not exists public.renovierungs_posten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  beschreibung text not null,
  raum text,
  kategorie text,
  menge_einheit text,
  geschaetzter_preis numeric(12,2),
  baumarkt_link text,
  status text default 'Geplant',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_renovierungs_posten_user_id on public.renovierungs_posten(user_id);

drop trigger if exists set_renovierungs_posten_updated_at on public.renovierungs_posten;
create trigger set_renovierungs_posten_updated_at
before update on public.renovierungs_posten
for each row execute function public.set_updated_at();

alter table public.renovierungs_posten enable row level security;

drop policy if exists renovierungs_posten_crud_own on public.renovierungs_posten;
create policy renovierungs_posten_crud_own
on public.renovierungs_posten for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('user-dokumente', 'user-dokumente', false, 52428800, null),
  ('kisten-fotos', 'kisten-fotos', true, 10485760, array['image/jpeg','image/png','image/gif','image/webp'])
on conflict (id) do nothing;

alter table storage.objects enable row level security;

drop policy if exists storage_user_dokumente_insert on storage.objects;
create policy storage_user_dokumente_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'user-dokumente' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists storage_user_dokumente_select on storage.objects;
create policy storage_user_dokumente_select
on storage.objects for select to authenticated
using (bucket_id = 'user-dokumente' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists storage_user_dokumente_delete on storage.objects;
create policy storage_user_dokumente_delete
on storage.objects for delete to authenticated
using (bucket_id = 'user-dokumente' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists storage_kisten_fotos_insert on storage.objects;
create policy storage_kisten_fotos_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'kisten-fotos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists storage_kisten_fotos_select on storage.objects;
create policy storage_kisten_fotos_select
on storage.objects for select to authenticated
using (bucket_id = 'kisten-fotos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists storage_kisten_fotos_delete on storage.objects;
create policy storage_kisten_fotos_delete
on storage.objects for delete to authenticated
using (bucket_id = 'kisten-fotos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Materialien (Katalog) wird unten aus materialien_supabase_500.sql eingefuegt
CREATE TABLE IF NOT EXISTS materialien (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kategorie TEXT NOT NULL,
    einheit TEXT,
    standardpreis NUMERIC(10,2),
    erstellt_am TIMESTAMP DEFAULT now()
);

-- Lösche existierende Daten, um Duplikate zu vermeiden, falls das Skript mehrmals ausgeführt wird
DELETE FROM materialien;

INSERT INTO materialien (name, kategorie, einheit, standardpreis) VALUES
('Dispersionsfarbe weiß (Innen)', 'Maler- & Tapezierbedarf', 'L', 24.99),
('Tiefgrund 5 L', 'Maler- & Tapezierbedarf', 'Kanister', 18.00),
('Malerrolle (18 cm)', 'Maler- & Tapezierbedarf', 'Stück', 3.00),
('Farbwanne', 'Maler- & Tapezierbedarf', 'Stück', 4.00),
('Malerkreppband (50 m)', 'Maler- & Tapezierbedarf', 'Rolle', 5.00),
('Schleifpapier (Körnung 120)', 'Maler- & Tapezierbedarf', 'Blatt', 0.50),
('Pinselset (3 Stück)', 'Maler- & Tapezierbedarf', 'Set', 8.00),
('Spachtelmasse (innen) 5 kg', 'Maler- & Tapezierbedarf', 'Sack', 12.00),
('Acryl-Dichtmasse 310 ml', 'Maler- & Tapezierbedarf', 'Kartusche', 4.00),
('Feinputz 25 kg', 'Maler- & Tapezierbedarf', 'Sack', 15.00),
('Buntlack (Kunstharz, farbig) 0,75 L', 'Maler- & Tapezierbedarf', 'Dose', 15.00),
('Lackfarbe weiß (Holz/Metall) 1 L', 'Maler- & Tapezierbedarf', 'Dose', 12.00),
('Fassadenfarbe weiß (Außen) 10 L', 'Maler- & Tapezierbedarf', 'Eimer', 60.00),
('Tapetenrolle (Vliestapete) 10 m²', 'Maler- & Tapezierbedarf', 'Rolle', 10.00),
('Tapetenkleister 500 g', 'Maler- & Tapezierbedarf', 'Packung', 5.00),
('Tapezierbürste', 'Maler- & Tapezierbedarf', 'Stück', 7.00),
('Quast (Deckenbürste)', 'Maler- & Tapezierbedarf', 'Stück', 8.00),
('Farbkratzer (Schaber)', 'Maler- & Tapezierbedarf', 'Stück', 5.00),
('Abstreifgitter (für Farbeimer)', 'Maler- & Tapezierbedarf', 'Stück', 2.00),
('Teleskop-Verlängerungsstange', 'Maler- & Tapezierbedarf', 'Stück', 15.00),
('Abdeckpapier (Rolle 50 m)', 'Maler- & Tapezierbedarf', 'Rolle', 10.00),
('Abdeckfolie mit Klebeband (maskierend)', 'Maler- & Tapezierbedarf', 'Rolle', 5.00),
('Maleroverall (Einweg)', 'Maler- & Tapezierbedarf', 'Stück', 5.00),
('Abbeizer (Lackentferner) 1 L', 'Maler- & Tapezierbedarf', 'L', 15.00),
('Pinselreiniger (Lösungsmittel) 1 L', 'Maler- & Tapezierbedarf', 'L', 8.00),
('Holzlasur (farblos) 5 L', 'Maler- & Tapezierbedarf', 'L', 30.00),
('Tapetenlöser 500 ml', 'Maler- & Tapezierbedarf', 'ml', 6.00),
('Stachelwalze (Tapetenperforierer)', 'Maler- & Tapezierbedarf', 'Stück', 15.00),
('Nahtroller (Tapeten-Andruckrolle)', 'Maler- & Tapezierbedarf', 'Stück', 6.00),
('Tapeziertisch (klappbar)', 'Maler- & Tapezierbedarf', 'Stück', 50.00),
('Zement (Portland) 25 kg', 'Maurer & Putz', 'Sack', 5.00),
('Mauerziegel (Standard)', 'Maurer & Putz', 'Stück', 0.80),
('Kalkputz (innen) 25 kg', 'Maurer & Putz', 'Sack', 10.00),
('Estrichmörtel 25 kg', 'Maurer & Putz', 'Sack', 6.00),
('Beton C25/30 (Transportbeton) 1 m³', 'Maurer & Putz', 'm³', 120.00),
('Mauermörtel 25 kg', 'Maurer & Putz', 'Sack', 4.00),
('Kalksandstein (Format NF)', 'Maurer & Putz', 'Stück', 2.50),
('WDVS-Dämmplatte 1 m²', 'Maurer & Putz', 'Stück', 20.00),
('Dämmwolle (Mineralwolle) 1 m²', 'Maurer & Putz', 'm²', 3.50),
('Perlit-Leichtbeton 25 kg', 'Maurer & Putz', 'Sack', 8.00),
('Bausand (Betonsand) 25 kg', 'Maurer & Putz', 'Sack', 3.00),
('Kies (Betonkies) 1 t', 'Maurer & Putz', 't', 30.00),
('Betonstahl (Bewehrungsstab) 6 m', 'Maurer & Putz', 'Stück', 10.00),
('Bewehrungsmatte (Stahlgitter)', 'Maurer & Putz', 'Stück', 50.00),
('Bitumenbahn (Abdichtung) 10 m²', 'Maurer & Putz', 'Rolle', 30.00),
('Dachziegel 1 m²', 'Maurer & Putz', 'm²', 25.00),
('Bauschaum (PU-Montageschaum) 750 ml', 'Maurer & Putz', 'Dose', 8.00),
('Trockenbeton (Fertigbeton) 40 kg', 'Maurer & Putz', 'Sack', 8.00),
('Porenbeton-Stein (Ytong) 625 × 240 × 200 mm', 'Maurer & Putz', 'Stück', 5.00),
('Schamottmörtel (feuerfest) 5 kg', 'Maurer & Putz', 'Eimer', 10.00),
('Schamottstein 230 × 114 × 64 mm', 'Maurer & Putz', 'Stück', 3.00),
('Betonsturz (Fertigteil) 1,0 m', 'Maurer & Putz', 'Stück', 15.00),
('Putzprofil (Eckschiene)', 'Maurer & Putz', 'Stück', 3.00),
('Baugips (Gipspulver) 5 kg', 'Maurer & Putz', 'Sack', 5.00),
('Dichtschlämme (Kellerabdichtung) 5 kg', 'Maurer & Putz', 'Eimer', 20.00),
('Dickbeschichtung (KMB) 10 kg', 'Maurer & Putz', 'Eimer', 30.00),
('Stahlträger (HEA 100) pro lfm', 'Maurer & Putz', 'm', 50.00),
('Porenbetonkleber 25 kg', 'Maurer & Putz', 'Sack', 10.00),
('Perimeterdämmung (XPS-Platte) 1 m²', 'Maurer & Putz', 'Stück', 15.00),
('Trittschalldämmung (EPS) 1 m²', 'Maurer & Putz', 'm²', 5.00),
('Fertigparkett (Buche) 1 m²', 'Holz & Boden', 'm²', 60.00),
('Laminat 1 m²', 'Holz & Boden', 'm²', 20.00),
('OSB-Platte 250×125 cm', 'Holz & Boden', 'Platte', 12.00),
('MDF-Platte 122×61 cm', 'Holz & Boden', 'Platte', 8.00),
('Spanplatte 250×125 cm', 'Holz & Boden', 'Platte', 10.00),
('Dachlatte 4 × 6 cm (Konstruktionsholz)', 'Holz & Boden', 'Stück', 2.00),
('Balken, Fichte 10 × 10 cm', 'Holz & Boden', 'lfm', 15.00),
('Parkettleim 5 kg', 'Holz & Boden', 'Beutel', 25.00),
('Trittschalldämm-Unterlage 1 m²', 'Holz & Boden', 'm²', 1.50),
('Sockelleiste Buche 2,4 m', 'Holz & Boden', 'Stück', 3.50),
('Massivholzdielen (Eiche) 1 m²', 'Holz & Boden', 'm²', 80.00),
('Vinylboden (Designbelag) 1 m²', 'Holz & Boden', 'm²', 30.00),
('Teppichboden (Auslegware) 1 m²', 'Holz & Boden', 'm²', 20.00),
('Bodenfliesen (Keramik) 1 m²', 'Holz & Boden', 'm²', 25.00),
('Wandfliesen (weiß) 1 m²', 'Holz & Boden', 'm²', 15.00),
('Fliesenkleber 25 kg', 'Holz & Boden', 'Sack', 10.00),
('Fugenmörtel 5 kg', 'Holz & Boden', 'Beutel', 8.00),
('Fliesenkreuze (Abstandhalter) 100 Stk', 'Holz & Boden', 'Pack', 3.00),
('Sockelfliese 30 cm', 'Holz & Boden', 'Stück', 2.00),
('PVC-Bodenbelag (Rolle) 1 m²', 'Holz & Boden', 'm²', 10.00),
('Natursteinfliese (Granit) 1 m²', 'Holz & Boden', 'm²', 60.00),
('Holzleim (Ponal) 1 kg', 'Holz & Boden', 'Flasche', 10.00),
('Leimholzplatte (Fichte) 200×60×2 cm', 'Holz & Boden', 'Stück', 50.00),
('Siebdruckplatte (Birkensperrholz) 21 mm', 'Holz & Boden', 'Platte', 70.00),
('Sperrholzplatte 4 mm 122×244 cm', 'Holz & Boden', 'Platte', 15.00),
('Terrassendiele (WPC) pro lfm', 'Holz & Boden', 'm', 5.00),
('KVH Kantholz 60×60 mm', 'Holz & Boden', 'lfm', 5.00),
('Parkettlack (Versiegelung) 1 L', 'Holz & Boden', 'L', 20.00),
('Korkboden 1 m²', 'Holz & Boden', 'm²', 40.00),
('Teppichfliesen 1 m²', 'Holz & Boden', 'm²', 30.00),
('Spanplattenschrauben 4×30 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.05),
('Universaldübel 8×50 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.10),
('Holzschrauben 6×60 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.08),
('Blechschrauben 4×20 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.07),
('Nageldübel 10×100 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.15),
('Schraubenset 200 Stk (Sortiment)', 'Schrauben, Dübel & Befestigung', 'Set', 15.00),
('Hakenanker 8×120 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.45),
('Rohrschelle (für Sanitär) 1/2″', 'Schrauben, Dübel & Befestigung', 'Stück', 0.20),
('Dübelbox (Sortiment)', 'Schrauben, Dübel & Befestigung', 'Packung', 20.00),
('Holznagel 5×50 mm (Stahlstift)', 'Schrauben, Dübel & Befestigung', 'Stück', 0.03),
('Betonschraube 7,5×80 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.50),
('Schwerlastanker M10', 'Schrauben, Dübel & Befestigung', 'Stück', 2.00),
('Gewindestange M8 (1 m)', 'Schrauben, Dübel & Befestigung', 'Stück', 2.00),
('Sechskantmutter M8', 'Schrauben, Dübel & Befestigung', 'Stück', 0.05),
('Unterlegscheibe M8', 'Schrauben, Dübel & Befestigung', 'Stück', 0.02),
('Stahlnagel 100 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.05),
('Stahlnagel (gehärtet) 30 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.10),
('Maschinenschraube M6×40 (mit Mutter)', 'Schrauben, Dübel & Befestigung', 'Stück', 0.20),
('Holzdübel 8×40 mm (Holzverbinder)', 'Schrauben, Dübel & Befestigung', 'Stück', 0.05),
('Kabelbinder 300 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.10),
('Winkelverbinder (Metallwinkel)', 'Schrauben, Dübel & Befestigung', 'Stück', 1.00),
('Lochband (Lochstreifen) 1 m', 'Schrauben, Dübel & Befestigung', 'm', 2.00),
('Bindedraht (1 kg Rolle)', 'Schrauben, Dübel & Befestigung', 'Rolle', 5.00),
('Blindnieten 4×20 mm (Popnieten)', 'Schrauben, Dübel & Befestigung', 'Stück', 0.05),
('Nagelschellen (Kabelclips) 20 Stk', 'Schrauben, Dübel & Befestigung', 'Pack', 2.00),
('Tellerkopfschrauben 6×140 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.50),
('Hohlraumdübel M6', 'Schrauben, Dübel & Befestigung', 'Stück', 0.50),
('Injektionsmörtel (Vinylester) 300 ml', 'Schrauben, Dübel & Befestigung', 'Kartusche', 15.00),
('Gewindestange M12 (1 m)', 'Schrauben, Dübel & Befestigung', 'Stück', 5.00),
('Sechskantmutter M12', 'Schrauben, Dübel & Befestigung', 'Stück', 0.10),
('Unterlegscheibe M12', 'Schrauben, Dübel & Befestigung', 'Stück', 0.05),
('Holzschrauben 8×120 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.20),
('Spanplattenschrauben 4×50 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.08),
('Spanplattenschrauben 5×80 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.10),
('Nageldübel 6×60 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 0.10),
('Drahtseil (Stahl) 1 m', 'Schrauben, Dübel & Befestigung', 'm', 2.00),
('Karabinerhaken (Stahl) 8 mm', 'Schrauben, Dübel & Befestigung', 'Stück', 2.00),
('Akku-Bohrschrauber (18 V)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 80.00),
('Bohrerset (10 tlg.)', 'Werkzeuge & Verbrauchsmaterial', 'Set', 15.00),
('Wasserwaage 60 cm', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 10.00),
('Cuttermesser', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 3.00),
('Zollstock 2 m', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 5.00),
('Hand-Schraubendreher-Set', 'Werkzeuge & Verbrauchsmaterial', 'Set', 10.00),
('Elektroklebeband (Isolierband) schwarz', 'Werkzeuge & Verbrauchsmaterial', 'Rolle', 2.00),
('Eimer 10 L (Baueimer)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 4.00),
('Hammer (Schlosserhammer)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 10.00),
('Handsäge (Fuchsschwanz)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 12.00),
('Metallsäge (Bügelsäge)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 15.00),
('Feilen-Set (Metall/Holz)', 'Werkzeuge & Verbrauchsmaterial', 'Set', 10.00),
('Kombizange', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 8.00),
('Seitenschneider', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 7.00),
('Schraubenschlüssel-Set', 'Werkzeuge & Verbrauchsmaterial', 'Set', 20.00),
('Ratschen-/Steckschlüsselsatz', 'Werkzeuge & Verbrauchsmaterial', 'Set', 30.00),
('Inbusschlüssel-Set', 'Werkzeuge & Verbrauchsmaterial', 'Set', 5.00),
('Stichsäge (elektrisch)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 50.00),
('Handkreissäge', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 100.00),
('Winkelschleifer (Flex)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 60.00),
('Bohrhammer (SDS)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 150.00),
('Multitool (Oszillationswerkzeug)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 80.00),
('Exzenterschleifer', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 50.00),
('Deltaschleifer', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 30.00),
('Heißluftpistole', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 40.00),
('Tacker (Handtacker)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 15.00),
('Heißklebepistole', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 10.00),
('Kabeltrommel (Verlängerung) 25 m', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 25.00),
('Stehleiter (zweiteilig) 2 m', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 50.00),
('Klappgerüst (klein, fahrbar)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 200.00),
('Schubkarre (Baustellenschubkarre)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 80.00),
('Maurerkelle (Kelle)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 8.00),
('Bit-Set (Schrauberbits) 20 tlg.', 'Werkzeuge & Verbrauchsmaterial', 'Set', 10.00),
('Maßband (Rollbandmaß) 5 m', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 8.00),
('Laser-Entfernungsmesser', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 50.00),
('Tapeten-Dampfablöser (Elektro)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 30.00),
('Nass-/Trockensauger (Bau-Staubsauger)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 100.00),
('Laminatschneider (Hebel)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 40.00),
('Fliesenschneider (manuell)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 50.00),
('Abbruchhammer (Stemmgerät)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 200.00),
('Rotationslaser (Nivelliergerät)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 300.00),
('Bohrständer (für Bohrmaschine)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 150.00),
('Tischkreissäge', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 250.00),
('Kettensäge (Elektro)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 100.00),
('Farbsprühsystem (Elektro)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 100.00),
('Kernbohrer-Set (Bohrkronen)', 'Werkzeuge & Verbrauchsmaterial', 'Set', 50.00),
('Baugerüst (Modulgerüst)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 1000.00),
('Betonmischer (mobil)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 300.00),
('Rührgerät (Mörtelmischer)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 80.00),
('Leitungssucher (Ortungsgerät)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 30.00),
('Druckluft-Kompressor 50 L', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 200.00),
('Lackierpistole (Druckluft)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 40.00),
('Werkstattwagen (Werkzeugwagen)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 200.00),
('Schweißgerät (Elektrode)', 'Werkzeuge & Verbrauchsmaterial', 'Stück', 300.00),
('WC-Keramik (Stand-WC)', 'Sanitär & Installation', 'Stück', 150.00),
('Waschbecken (Keramik)', 'Sanitär & Installation', 'Stück', 80.00),
('Duscharmatur (Mischbatterie)', 'Sanitär & Installation', 'Stück', 100.00),
('Eckventil 1/2″', 'Sanitär & Installation', 'Stück', 5.00),
('HT-Rohr (Abwasserrohr) DN 110', 'Sanitär & Installation', 'm', 3.00),
('Siphon (Geruchsverschluss)', 'Sanitär & Installation', 'Stück', 8.00),
('Teflon-Dichtband', 'Sanitär & Installation', 'Rolle', 1.00),
('Gummidichtung (O-Ring)', 'Sanitär & Installation', 'Stück', 0.50),
('Silikon-Dichtmasse (Sanitär) 310 ml', 'Sanitär & Installation', 'Kartusche', 6.00),
('Montagekleber 290 ml', 'Sanitär & Installation', 'Tube', 6.00),
('Badewanne (Acryl)', 'Sanitär & Installation', 'Stück', 300.00),
('Duschwanne 90×90 cm', 'Sanitär & Installation', 'Stück', 100.00),
('Duschkabine (Glas, komplett)', 'Sanitär & Installation', 'Stück', 250.00),
('WC-Sitz (Deckel)', 'Sanitär & Installation', 'Stück', 30.00),
('Waschtischarmatur', 'Sanitär & Installation', 'Stück', 60.00),
('Küchenarmatur (Einhebel)', 'Sanitär & Installation', 'Stück', 80.00),
('Brause-Set (Duschkopf + Schlauch)', 'Sanitär & Installation', 'Set', 30.00),
('Waschmaschinenhahn', 'Sanitär & Installation', 'Stück', 15.00),
('HT-Rohr DN 50', 'Sanitär & Installation', 'm', 2.00),
('Kupferrohr 15 mm', 'Sanitär & Installation', 'm', 8.00),
('Pressfitting 15 mm (Kupplung)', 'Sanitär & Installation', 'Stück', 5.00),
('Ablaufverlängerung (Siphonrohr)', 'Sanitär & Installation', 'Stück', 5.00),
('WC-Anschlussset (Flexrohr)', 'Sanitär & Installation', 'Set', 15.00),
('Untertischboiler 5 L (Elektro)', 'Sanitär & Installation', 'Stück', 100.00),
('Durchlauferhitzer 18 kW', 'Sanitär & Installation', 'Stück', 250.00),
('Bodenablauf (Dusche) mit Geruchsstopp', 'Sanitär & Installation', 'Stück', 20.00),
('Ablaufgarnitur (Waschbecken)', 'Sanitär & Installation', 'Stück', 10.00),
('Flexschlauch 3/8″ (Anschluss)', 'Sanitär & Installation', 'Stück', 5.00),
('Aufputz-Spülkasten (WC)', 'Sanitär & Installation', 'Stück', 50.00),
('Hebeanlage (Abwasserpumpe)', 'Sanitär & Installation', 'Stück', 300.00),
('Kupferkabel (Litze) 1,5 mm², 100 m', 'Elektro & Beleuchtung', 'Rolle', 50.00),
('Steckdose (Unterputz)', 'Elektro & Beleuchtung', 'Stück', 3.00),
('Lichtschalter (Wechselschalter)', 'Elektro & Beleuchtung', 'Stück', 3.00),
('FI-Schutzschalter 30 mA', 'Elektro & Beleuchtung', 'Stück', 30.00),
('Leitungsschutzschalter 16 A', 'Elektro & Beleuchtung', 'Stück', 2.00),
('Deckenleuchte (Fassung+Schirm)', 'Elektro & Beleuchtung', 'Stück', 25.00),
('LED-Lampe E27 (Glühbirne)', 'Elektro & Beleuchtung', 'Stück', 5.00),
('Verlängerungskabel 10 m', 'Elektro & Beleuchtung', 'Stück', 15.00),
('Kabelverbinder (Lüsterklemme)', 'Elektro & Beleuchtung', 'Stück', 0.10),
('Unterputzdose (Gerätedose)', 'Elektro & Beleuchtung', 'Stück', 2.00),
('Installationskabel NYM-J 3×1,5² (50 m)', 'Elektro & Beleuchtung', 'Rolle', 25.00),
('Kabelkanal 20×20 mm (2 m)', 'Elektro & Beleuchtung', 'Stück', 5.00),
('Abzweigdose (Aufputz)', 'Elektro & Beleuchtung', 'Stück', 3.00),
('Nagelschellen 20 Stk (Kabelschellen)', 'Elektro & Beleuchtung', 'Pack', 2.00),
('Netzwerkdose CAT6 (LAN)', 'Elektro & Beleuchtung', 'Stück', 10.00),
('Netzwerkkabel CAT6 20 m', 'Elektro & Beleuchtung', 'Stück', 15.00),
('Koaxialkabel (TV) 10 m', 'Elektro & Beleuchtung', 'Stück', 10.00),
('Bewegungsmelder (Innen)', 'Elektro & Beleuchtung', 'Stück', 20.00),
('Rauchmelder (Batterie)', 'Elektro & Beleuchtung', 'Stück', 10.00),
('Türklingel (Gong)', 'Elektro & Beleuchtung', 'Stück', 15.00),
('Multimeter (Digital)', 'Elektro & Beleuchtung', 'Stück', 20.00),
('Sicherungskasten (Unterverteilung)', 'Elektro & Beleuchtung', 'Stück', 50.00),
('Dimmer-Schalter (Unterputz)', 'Elektro & Beleuchtung', 'Stück', 15.00),
('Steckdosenleiste 6-fach', 'Elektro & Beleuchtung', 'Stück', 10.00),
('Antennendose (TV/Sat)', 'Elektro & Beleuchtung', 'Stück', 5.00),
('LED-Baustrahler (Arbeitslampe)', 'Elektro & Beleuchtung', 'Stück', 30.00),
('Leitungssucher (Ortungsgerät)', 'Elektro & Beleuchtung', 'Stück', 30.00),
('Überspannungsschutz (Zwischenstecker)', 'Elektro & Beleuchtung', 'Stück', 15.00),
('Zeitschaltuhr (Steckdose)', 'Elektro & Beleuchtung', 'Stück', 10.00),
('Spannungsprüfer (Prüfschraubendreher)', 'Elektro & Beleuchtung', 'Stück', 5.00),
('Umzugskarton (Standard)', 'Umzugs- & Verpackungsmaterial', 'Stück', 3.00),
('Luftpolsterfolie', 'Umzugs- & Verpackungsmaterial', 'm', 3.00),
('Packseide (Seidenpapier)', 'Umzugs- & Verpackungsmaterial', 'kg', 3.00),
('Klebeband (Packband) 50 m', 'Umzugs- & Verpackungsmaterial', 'Rolle', 5.00),
('Umzugsdecke (Polsterdecke)', 'Umzugs- & Verpackungsmaterial', 'Stück', 10.00),
('Möbelroller (Rollbrett)', 'Umzugs- & Verpackungsmaterial', 'Stück', 15.00),
('Zurrgurt (Spanngurt)', 'Umzugs- & Verpackungsmaterial', 'Stück', 8.00),
('Halteverbot-Schild', 'Umzugs- & Verpackungsmaterial', 'Stück', 20.00),
('Sackkarre', 'Umzugs- & Verpackungsmaterial', 'Stück', 40.00),
('Werkzeugkoffer (leer)', 'Umzugs- & Verpackungsmaterial', 'Stück', 50.00),
('Kleiderkarton (mit Stange)', 'Umzugs- & Verpackungsmaterial', 'Stück', 14.00),
('Matratzenhülle (Schutzfolie)', 'Umzugs- & Verpackungsmaterial', 'Stück', 8.00),
('Stretchfolie (Wickelfolie)', 'Umzugs- & Verpackungsmaterial', 'Rolle', 15.00),
('Möbel-Schutzfolie (Sofaüberzug)', 'Umzugs- & Verpackungsmaterial', 'Stück', 10.00),
('Möbelgleiter (Gleiter-Set) 4 Stk', 'Umzugs- & Verpackungsmaterial', 'Set', 5.00),
('Tragegurte (Möbelgurte) 2 Stk', 'Umzugs- & Verpackungsmaterial', 'Set', 20.00),
('Seil (Polypropylen) 10 m', 'Umzugs- & Verpackungsmaterial', 'Stück', 5.00),
('Kantenschutzecken (Schaum) 8 Stk', 'Umzugs- & Verpackungsmaterial', 'Pack', 5.00),
('Klappbox (Kunststoffkiste) 60 L', 'Umzugs- & Verpackungsmaterial', 'Stück', 20.00),
('Treppensackkarre (Treppensteiger)', 'Umzugs- & Verpackungsmaterial', 'Stück', 120.00),
('Müllsäcke 120 L (10 Stk)', 'Sonstiges & Verbrauch', 'Packung', 8.00),
('Putzlappen (Baumwolle) 10 Stk', 'Sonstiges & Verbrauch', 'Packung', 5.00),
('Schwammtücher (Reinigung) 5 Stk', 'Sonstiges & Verbrauch', 'Packung', 2.00),
('Bodenabdeckfolie (PE) 5 m', 'Sonstiges & Verbrauch', 'Rolle', 10.00),
('Baustellenradio', 'Sonstiges & Verbrauch', 'Stück', 40.00),
('Breitklebeband (Gaffa)', 'Sonstiges & Verbrauch', 'Rolle', 4.00),
('Baustellenlampe (Warnleuchte)', 'Sonstiges & Verbrauch', 'Stück', 30.00),
('WD-40 Spray (Kriechöl) 250 ml', 'Sonstiges & Verbrauch', 'Dose', 5.00),
('Stromgenerator (Benzin)', 'Sonstiges & Verbrauch', 'Stück', 400.00),
('Handfeger & Kehrschaufel (Set)', 'Sonstiges & Verbrauch', 'Set', 8.00),
('Schaufel (Spitzschaufel)', 'Sonstiges & Verbrauch', 'Stück', 15.00),
('Besen (Straßenbesen)', 'Sonstiges & Verbrauch', 'Stück', 15.00),
('Schutt­sack (Bauabfallsack)', 'Sonstiges & Verbrauch', 'Stück', 2.00),
('Sprühkleber 400 ml', 'Sonstiges & Verbrauch', 'Dose', 8.00),
('Bautrockner (Luftentfeuchter)', 'Sonstiges & Verbrauch', 'Stück', 300.00),
('Bauventilator (Trocknerlüfter)', 'Sonstiges & Verbrauch', 'Stück', 100.00),
('Big-Bag Abfallsack (1 m³)', 'Sonstiges & Verbrauch', 'Stück', 30.00),
('Markierspray (fluoreszierend) 500 ml', 'Sonstiges & Verbrauch', 'Dose', 10.00),
('Feinsteinzeug-Reiniger 5 L', 'Baustellenreiniger & Pflege', 'L', 20.00),
('Glasreiniger 1 L', 'Baustellenreiniger & Pflege', 'L', 3.00),
('Allzweckreiniger 1 L', 'Baustellenreiniger & Pflege', 'L', 4.00),
('Desinfektionsmittel 1 L', 'Baustellenreiniger & Pflege', 'L', 8.00),
('Fugenreiniger (Gel) 500 ml', 'Baustellenreiniger & Pflege', 'ml', 10.00),
('Bodenreiniger (Wischpflege)', 'Baustellenreiniger & Pflege', 'L', 5.00),
('Handreiniger (Paste) 500 ml', 'Baustellenreiniger & Pflege', 'Dose', 6.00),
('Mikrofaser-Tuch', 'Baustellenreiniger & Pflege', 'Stück', 1.00),
('Stahlwolle (Reinigungspad) 200 g', 'Baustellenreiniger & Pflege', 'g', 2.00),
('WC-Reiniger 1 L', 'Baustellenreiniger & Pflege', 'L', 3.00),
('Zementschleier-Entferner 1 L', 'Baustellenreiniger & Pflege', 'L', 10.00),
('Schimmelentferner 500 ml', 'Baustellenreiniger & Pflege', 'ml', 12.00),
('Parkettpflege-Öl 1 L', 'Baustellenreiniger & Pflege', 'L', 15.00),
('Stein-Imprägnierung 1 L', 'Baustellenreiniger & Pflege', 'L', 20.00),
('Backofenreiniger', 'Baustellenreiniger & Pflege', 'Stück', 5.00),
('Rohrreiniger (chemisch) 1 L', 'Baustellenreiniger & Pflege', 'L', 5.00),
('Entkalker 1 L', 'Baustellenreiniger & Pflege', 'L', 4.00),
('Teppichreiniger (Shampoo) 1 L', 'Baustellenreiniger & Pflege', 'L', 10.00),
('Klebstoffentferner 200 ml', 'Baustellenreiniger & Pflege', 'ml', 8.00),
('Grundreiniger (Bauschmutz) 1 L', 'Baustellenreiniger & Pflege', 'L', 10.00),
('Gipskartonplatte (12,5 mm) 2000×1250 mm', 'Trockenbau & Dämmung', 'Stück', 10.00),
('UW-Profil 50 mm (4 m)', 'Trockenbau & Dämmung', 'Stück', 5.00),
('CW-Profil 50 mm (4 m)', 'Trockenbau & Dämmung', 'Stück', 6.00),
('Schnellbauschrauben 25 mm (500 Stk)', 'Trockenbau & Dämmung', 'Pack', 15.00),
('Fugenband (Gipskarton) 25 m', 'Trockenbau & Dämmung', 'Rolle', 5.00),
('Fugenspachtel (Gipskarton) 5 kg', 'Trockenbau & Dämmung', 'Beutel', 10.00),
('Trennwand-Dämmung (Mineralwolle) 1 m²', 'Trockenbau & Dämmung', 'm²', 5.00),
('Dampfsperrfolie 20 m²', 'Trockenbau & Dämmung', 'Rolle', 20.00),
('Kantenschutzprofil (Alu) 2,5 m', 'Trockenbau & Dämmung', 'Stück', 2.00),
('Direktabhänger (Deckenträger)', 'Trockenbau & Dämmung', 'Stück', 0.50),
('Innentür (inkl. Zarge)', 'Fenster & Türen', 'Stück', 300.00),
('Haustür (wärmegedämmt)', 'Fenster & Türen', 'Stück', 1000.00),
('Fenster (Kunststoff, 1×1 m)', 'Fenster & Türen', 'Stück', 500.00),
('Balkontür 90×200 cm', 'Fenster & Türen', 'Stück', 700.00),
('Türdrücker-Garnitur (Innentürgriff)', 'Fenster & Türen', 'Set', 25.00),
('Türzarge (Ersatz) 88×200 cm', 'Fenster & Türen', 'Stück', 100.00),
('Einsteckschloss (Zimmertür)', 'Fenster & Türen', 'Stück', 15.00),
('Schließzylinder (Profil, 30/30)', 'Fenster & Türen', 'Stück', 30.00),
('Türschwelle (Übergangsschiene)', 'Fenster & Türen', 'Stück', 20.00),
('Fensterbank innen (PVC) 1,0 m', 'Fenster & Türen', 'Stück', 20.00),
('Fensterbank außen (Alu) 1,0 m', 'Fenster & Türen', 'Stück', 40.00),
('Rollladen (Fensterladen) 1 m²', 'Fenster & Türen', 'Stück', 150.00),
('Dachfenster 78×98 cm (Schwingfenster)', 'Fenster & Türen', 'Stück', 500.00),
('Türstopper', 'Fenster & Türen', 'Stück', 5.00),
('Türschließer (Türheber)', 'Fenster & Türen', 'Stück', 80.00),
('Heizkörper (Plattenbau, Mittelgröße)', 'Heizung & Klima', 'Stück', 200.00),
('Thermostatventil (Heizkörper)', 'Heizung & Klima', 'Stück', 20.00),
('Heizkörper-Befestigung (Wandhalter-Set)', 'Heizung & Klima', 'Set', 10.00),
('Umwälzpumpe (Heizung)', 'Heizung & Klima', 'Stück', 150.00),
('Gas-Brennwerttherme', 'Heizung & Klima', 'Stück', 3000.00),
('Klimagerät (Split-Anlage)', 'Heizung & Klima', 'Stück', 1000.00),
('Badheizkörper (Handtuchwärmer)', 'Heizung & Klima', 'Stück', 150.00),
('Fußbodenheizungsrohr 100 m', 'Heizung & Klima', 'Rolle', 100.00),
('Kaminofen (Holzofen) freistehend', 'Heizung & Klima', 'Stück', 800.00),
('Ausdehnungsgefäß 25 L (Heizung)', 'Heizung & Klima', 'Stück', 100.00),
('Solarthermie-Paneel (Modul)', 'Heizung & Klima', 'Stück', 1000.00),
('Heizlüfter (Elektro, mobil)', 'Heizung & Klima', 'Stück', 30.00),
('Schutzhelm (Bauhelm)', 'Arbeitsschutz & Sicherheit', 'Stück', 20.00),
('Schutzbrille (Klarglas)', 'Arbeitsschutz & Sicherheit', 'Stück', 6.00),
('Atemschutzmaske (FFP3)', 'Arbeitsschutz & Sicherheit', 'Stück', 7.00),
('Gehörschutz (Kapselgehörschutz)', 'Arbeitsschutz & Sicherheit', 'Paar', 10.00),
('Arbeitshandschuhe (PVC-beschichtet)', 'Arbeitsschutz & Sicherheit', 'Paar', 4.00),
('Sicherheitsschuhe (S3)', 'Arbeitsschutz & Sicherheit', 'Paar', 60.00),
('Warnweste (hi-vis)', 'Arbeitsschutz & Sicherheit', 'Stück', 5.00),
('Feuerlöscher 6 kg (ABC)', 'Arbeitsschutz & Sicherheit', 'Stück', 50.00),
('Erste-Hilfe-Kasten (DIN 13164)', 'Arbeitsschutz & Sicherheit', 'Stück', 20.00),
('Auffanggurt (Sicherheitsgurt)', 'Arbeitsschutz & Sicherheit', 'Stück', 100.00),
('Absperrband (Warnband) 50 m', 'Arbeitsschutz & Sicherheit', 'Rolle', 3.00),
('Gartenzaun-Holzelement 1 m', 'Außenbereich & Garten', 'Stück', 30.00),
('Maschendrahtzaun 1,5 m (10 m Rolle)', 'Außenbereich & Garten', 'Rolle', 50.00),
('Zaunpfosten (Metall) 1,5 m', 'Außenbereich & Garten', 'Stück', 20.00),
('Gartentor (Metall) 100 cm', 'Außenbereich & Garten', 'Stück', 150.00),
('Terrassenplatte (Beton) 50×50 cm', 'Außenbereich & Garten', 'Stück', 5.00),
('Pflasterstein (Beton) 10×20 cm', 'Außenbereich & Garten', 'Stück', 0.50),
('Randstein (Beetkante) 100 cm', 'Außenbereich & Garten', 'Stück', 10.00),
('Zierkies 25 kg', 'Außenbereich & Garten', 'Sack', 6.00),
('Gehwegplatte 30×30 cm', 'Außenbereich & Garten', 'Stück', 2.00),
('Rasengitterstein (Beton) 40×40 cm', 'Außenbereich & Garten', 'Stück', 5.00),
('Regentonne 200 L', 'Außenbereich & Garten', 'Stück', 40.00),
('Gartenschlauch 20 m', 'Außenbereich & Garten', 'Stück', 25.00),
('Rasensprenger (Sprinkler)', 'Außenbereich & Garten', 'Stück', 15.00),
('Außenleuchte (Wandlampe)', 'Außenbereich & Garten', 'Stück', 30.00),
('Bewegungsmelder (Außen)', 'Außenbereich & Garten', 'Stück', 25.00),
('Außensteckdose (Garten) Dual', 'Außenbereich & Garten', 'Stück', 20.00),
('Teichfolie 4 m²', 'Außenbereich & Garten', 'm²', 40.00),
('Gartenhacke (Handhacke)', 'Außenbereich & Garten', 'Stück', 15.00),
('Spaten (Gärtnerspaten)', 'Außenbereich & Garten', 'Stück', 20.00),
('Heckenschere (manuell)', 'Außenbereich & Garten', 'Stück', 25.00);

-- RLS fuer materialien
alter table public.materialien enable row level security;

drop policy if exists materialien_read on public.materialien;
create policy materialien_read
on public.materialien for select to authenticated
using (true);

create index if not exists idx_materialien_kategorie on public.materialien(kategorie);
create index if not exists idx_materialien_name on public.materialien(name);

-- Refresh PostgREST schema cache (avoids stale relationships after migrations)
select pg_notify('pgrst', 'reload schema');
