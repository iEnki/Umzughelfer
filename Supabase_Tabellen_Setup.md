# Supabase Setup für Umzugshelfer PWA (aktualisiert)

Diese Dokumentation ist **an die aktuelle Codebasis angepasst**. Die komplette Einrichtung erfolgt über die Datei `supabase_setup.aql`.

## Schnellstart (empfohlen)

1. Supabase-Projekt anlegen.
2. Im Supabase-Dashboard den **SQL Editor** öffnen.
3. Den gesamten Inhalt von `supabase_setup.aql` ausführen.
4. Fertig – die App kann sich verbinden.

> Hinweis: Das Script enthält Seed-Daten für `todo_vorlagen` und den Materialkatalog (`materialien`).
> Wenn du eigene Daten behalten willst, entferne die `DELETE FROM public.todo_vorlagen;` und `DELETE FROM materialien;` Zeilen vor dem Ausführen.

---

## Was das Script erstellt

### Extensions
- `pgcrypto` (für `gen_random_uuid()`)

### Tabellen (App-relevant)
- **user_profile**: `id` (auth.users.id), `email`, `username`, `gesamtbudget`, `openai_api_key`, `created_at`, `updated_at`
- **kontakte**: `user_id`, `name`, `typ`, `telefon`, `adresse`, `notiz`, Timestamps
- **budget_posten**: `user_id`, `beschreibung`, `kategorie`, `betrag`, `datum`, `lieferdatum`, Timestamps
- **budget_teilzahlungen**: `user_id`, `posten_id`, `betrag_teilzahlung`, `datum_teilzahlung`, `notiz_teilzahlung`, Timestamps
- **todo_aufgaben**: `user_id`, `beschreibung`, `kategorie`, `prioritaet`, `erledigt`, `faelligkeitsdatum`, `erinnerungs_datum`, `anhaenge`, `wiederholung_typ`, `wiederholung_intervall`, `budget_posten_id`, `angehaengte_dokument_ids`, Timestamps
- **todo_vorlagen**: globale Vorlagen (nur Lesen für authentifizierte Nutzer)
- **pack_kisten**: `user_id`, `name`, `raum_neu`, `qr_code_wert`, `foto_pfad`, `status_kiste`, `notizen`, Timestamps
- **pack_gegenstaende**: `user_id`, `kiste_id`, `beschreibung`, `menge`, `kategorie`, Timestamps
- **dokumente**: `user_id`, `dateiname`, `datei_typ`, `storage_pfad`, `beschreibung`, `groesse_kb`, `todo_aufgabe_id`, `erstellt_am`, `updated_at`
- **renovierungs_posten**: `user_id`, `beschreibung`, `raum`, `kategorie`, `menge_einheit`, `geschaetzter_preis`, `baumarkt_link`, `status`, Timestamps
- **materialien**: Materialkatalog (`name`, `kategorie`, `einheit`, `standardpreis`, `erstellt_am`)

### Trigger
- `handle_new_user` auf `auth.users` → legt `user_profile` an
- `set_updated_at` für Tabellen mit `updated_at`

### RLS (Row Level Security)
- **Alle userbezogenen Tabellen**: Zugriff nur auf eigene Daten (`auth.uid() = user_id`)
- **todo_vorlagen & materialien**: Lesen für alle authentifizierten Nutzer

### Storage Buckets
- **user-dokumente** (private, 50 MB)
- **kisten-fotos** (public, 10 MB, nur Bildtypen)

Policies erlauben **Insert/Select/Delete** nur im eigenen Ordner `user_id/`.

---

## Wichtige Hinweise

- **Bucket-Namen sind fix**: `user-dokumente` und `kisten-fotos` – diese Namen werden im Code verwendet.
- **kisten-fotos ist public**, weil das Frontend `getPublicUrl()` nutzt. Wenn du private Fotos willst, muss der Code auf `createSignedUrl()` umgestellt werden.
- **openai_api_key** liegt in `user_profile`. RLS erlaubt nur dem jeweiligen User Zugriff.

---

## Troubleshooting

- Fehlende Tabellen/Spalten: Stelle sicher, dass `supabase_setup.aql` vollständig und ohne Fehler ausgeführt wurde.
- Auth-Trigger: Der Trigger auf `auth.users` muss im SQL Editor als `postgres`/Admin laufen.
- Storage-Probleme: Prüfe, ob die Buckets existieren und RLS auf `storage.objects` aktiv ist.
- Dashboard-Fehler `PGRST201` (mehrere Beziehungen zwischen `pack_kisten` und `pack_gegenstaende`):
  Das Script entfernt automatisch die Legacy-Spalte `kisten_id` und lädt das PostgREST-Schema neu. Wenn der Fehler bleibt,
  stelle sicher, dass `kisten_id` wirklich entfernt ist und führe zusätzlich `select pg_notify('pgrst', 'reload schema');` aus.

---

Wenn du willst, kann ich zusätzlich:
- eine Version ohne Seeds erstellen,
- eine Migration von alten Tabellen auf die neuen Namen vorbereiten,
- oder die App auf private Buckets umstellen.
