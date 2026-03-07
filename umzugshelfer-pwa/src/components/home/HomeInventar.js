import React, { useState, useEffect, useCallback } from "react";
import {
  Package, Plus, ChevronRight, ChevronDown, Trash2, Edit2,
  QrCode, Tag, X, Loader2, Search, MapPin, Box,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { QRCodeSVG } from "qrcode.react";

// --- Hilfsfunktionen ---
const STATUS_FARBEN = {
  in_verwendung: "bg-green-500/10 text-green-600 dark:text-green-400",
  eingelagert: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  verliehen: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  defekt: "bg-red-500/10 text-red-600 dark:text-red-400",
  entsorgt: "bg-gray-500/10 text-gray-500",
};

const STATUS_LABEL = {
  in_verwendung: "In Verwendung",
  eingelagert: "Eingelagert",
  verliehen: "Verliehen",
  defekt: "Defekt",
  entsorgt: "Entsorgt",
};

// --- Ort-Formular ---
const OrtForm = ({ initial, onSpeichern, onAbbrechen }) => {
  const [name, setName] = useState(initial?.name || "");
  const [typ, setTyp] = useState(initial?.typ || "Wohnung");
  const typen = ["Wohnung", "Keller", "Garage", "Dachboden", "Gartenhaus", "Sonstiges"];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Name*</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Meine Wohnung"
          className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Typ</label>
        <select
          value={typ}
          onChange={(e) => setTyp(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none"
        >
          {typen.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={onAbbrechen} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
        <button onClick={() => name.trim() && onSpeichern({ name: name.trim(), typ })} className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50" disabled={!name.trim()}>Speichern</button>
      </div>
    </div>
  );
};

// --- Lagerort-Formular ---
const LagerortForm = ({ ortId, parentId, initial, onSpeichern, onAbbrechen }) => {
  const [name, setName] = useState(initial?.name || "");
  const [typ, setTyp] = useState(initial?.typ || "Regal");
  const typen = ["Regal", "Schrank", "Lade", "Schublade", "Fach", "Kiste", "Box", "Karton", "Sonstiges"];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Name*</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Regal 2"
          className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Typ</label>
        <select
          value={typ}
          onChange={(e) => setTyp(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none"
        >
          {typen.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={onAbbrechen} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
        <button onClick={() => name.trim() && onSpeichern({ name: name.trim(), typ, ort_id: ortId, parent_id: parentId || null })} className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50" disabled={!name.trim()}>Speichern</button>
      </div>
    </div>
  );
};

// --- Objekt-Formular ---
const ObjektForm = ({ ortId, lagerortId, initial, onSpeichern, onAbbrechen }) => {
  const [form, setForm] = useState({
    name: initial?.name || "",
    beschreibung: initial?.beschreibung || "",
    kategorie: initial?.kategorie || "",
    status: initial?.status || "in_verwendung",
    menge: initial?.menge || 1,
    zugriffshaeufigkeit: initial?.zugriffshaeufigkeit || "selten",
    tags: initial?.tags?.join(", ") || "",
  });

  const statusOptionen = Object.keys(STATUS_LABEL);
  const kategorien = ["Elektronik", "Kleidung", "Küche", "Bücher", "Werkzeug", "Deko", "Dokumente", "Sport", "Sonstiges"];
  const haeufigkeit = ["taeglich", "woechentlich", "monatlich", "selten", "nie"];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Name*</label>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="z.B. HDMI-Kabel"
          className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
            {statusOptionen.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Menge</label>
          <input
            type="number"
            min="1"
            value={form.menge}
            onChange={(e) => setForm((p) => ({ ...p, menge: Number(e.target.value) }))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Kategorie</label>
          <select value={form.kategorie} onChange={(e) => setForm((p) => ({ ...p, kategorie: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
            <option value="">— wählen —</option>
            {kategorien.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Zugriffshäufigkeit</label>
          <select value={form.zugriffshaeufigkeit} onChange={(e) => setForm((p) => ({ ...p, zugriffshaeufigkeit: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
            {haeufigkeit.map((h) => <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Tags (kommagetrennt)</label>
        <input
          value={form.tags}
          onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          placeholder="z.B. saisonal, Technik, zerbrechlich"
          className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={onAbbrechen} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
        <button
          onClick={() => form.name.trim() && onSpeichern({
            ...form,
            name: form.name.trim(),
            tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            ort_id: ortId,
            lagerort_id: lagerortId || null,
          })}
          className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
          disabled={!form.name.trim()}
        >
          Speichern
        </button>
      </div>
    </div>
  );
};

// --- Hauptkomponente ---
const HomeInventar = ({ session }) => {
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [orte, setOrte] = useState([]);
  const [lagerorte, setLagerorte] = useState([]);
  const [objekte, setObjekte] = useState([]);
  const [ausgewaehlterOrt, setAusgewaehlterOrt] = useState(null);
  const [ausgewaehlterLagerort, setAusgewaehlterLagerort] = useState(null);
  const [suche, setSuche] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null); // { typ: "ort"|"lagerort"|"objekt"|"qr", daten }
  const [aufgeklappt, setAufgeklappt] = useState({});
  const [fehler, setFehler] = useState(null);

  const ladeDaten = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [orteRes, lagerorteRes, objekteRes] = await Promise.all([
        supabase.from("home_orte").select("*").eq("user_id", userId).order("name"),
        supabase.from("home_lagerorte").select("*").eq("user_id", userId).order("position").order("name"),
        supabase.from("home_objekte").select("*").eq("user_id", userId).order("name"),
      ]);
      setOrte(orteRes.data || []);
      setLagerorte(lagerorteRes.data || []);
      setObjekte(objekteRes.data || []);
    } catch (e) {
      setFehler("Fehler beim Laden der Inventardaten.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { ladeDaten(); }, [ladeDaten]);

  // --- CRUD Ort ---
  const speichereOrt = async (daten) => {
    const payload = { ...daten, user_id: userId };
    if (modal?.daten?.id) {
      await supabase.from("home_orte").update(daten).eq("id", modal.daten.id);
    } else {
      await supabase.from("home_orte").insert(payload);
    }
    setModal(null);
    ladeDaten();
  };

  const loescheOrt = async (id) => {
    if (!window.confirm("Ort und alle Lagerorte/Objekte darin löschen?")) return;
    await supabase.from("home_orte").delete().eq("id", id);
    if (ausgewaehlterOrt === id) setAusgewaehlterOrt(null);
    ladeDaten();
  };

  // --- CRUD Lagerort ---
  const speichereLagerort = async (daten) => {
    const payload = { ...daten, user_id: userId };
    if (modal?.daten?.id) {
      await supabase.from("home_lagerorte").update(daten).eq("id", modal.daten.id);
    } else {
      await supabase.from("home_lagerorte").insert(payload);
    }
    setModal(null);
    ladeDaten();
  };

  const loescheLagerort = async (id) => {
    if (!window.confirm("Lagerort und alle Objekte darin löschen?")) return;
    await supabase.from("home_lagerorte").delete().eq("id", id);
    if (ausgewaehlterLagerort === id) setAusgewaehlterLagerort(null);
    ladeDaten();
  };

  // --- CRUD Objekt ---
  const speichereObjekt = async (daten) => {
    const payload = { ...daten, user_id: userId };
    if (modal?.daten?.id) {
      await supabase.from("home_objekte").update(daten).eq("id", modal.daten.id);
    } else {
      await supabase.from("home_objekte").insert(payload);
    }
    setModal(null);
    ladeDaten();
  };

  const loescheObjekt = async (id) => {
    if (!window.confirm("Objekt löschen?")) return;
    await supabase.from("home_objekte").delete().eq("id", id);
    ladeDaten();
  };

  // --- QR generieren ---
  const generiereQr = async (lagerortId) => {
    const qrWert = `home-lagerort-${lagerortId}-${Date.now()}`;
    await supabase.from("home_lagerorte").update({ qr_code_wert: qrWert }).eq("id", lagerortId);
    ladeDaten();
    setModal({ typ: "qr", daten: { qrWert } });
  };

  // --- Gefilterte Objekte ---
  const gefilterteObjekte = objekte.filter((o) => {
    const passOrt = !ausgewaehlterOrt || o.ort_id === ausgewaehlterOrt;
    const passLagerort = !ausgewaehlterLagerort || o.lagerort_id === ausgewaehlterLagerort;
    const passStatus = !statusFilter || o.status === statusFilter;
    const passSuche = !suche || o.name.toLowerCase().includes(suche.toLowerCase()) || (o.tags || []).some((t) => t.toLowerCase().includes(suche.toLowerCase()));
    return passOrt && passLagerort && passStatus && passSuche;
  });

  // --- Lagerorte eines Ortes (nur Root-Level) ---
  const lagerorteVonOrt = (ortId, parentId = null) =>
    lagerorte.filter((l) => l.ort_id === ortId && l.parent_id === parentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Package size={22} className="text-green-500" />
          <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">Inventar</h1>
        </div>
        <button
          onClick={() => setModal({ typ: "ort", daten: null })}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Neuer Standort
        </button>
      </div>

      {fehler && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          {fehler}
        </div>
      )}

      <div className="flex gap-5">
        {/* Sidebar: Standorte */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border overflow-hidden">
            <div className="p-3 border-b border-light-border dark:border-dark-border">
              <h2 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Standorte</h2>
            </div>
            {/* Alle anzeigen */}
            <button
              onClick={() => { setAusgewaehlterOrt(null); setAusgewaehlterLagerort(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${!ausgewaehlterOrt ? "bg-green-500/10 text-green-600 dark:text-green-400 font-medium" : "text-light-text-main dark:text-dark-text-main hover:bg-light-hover dark:hover:bg-dark-hover"}`}
            >
              <MapPin size={14} />
              Alle ({objekte.filter((o) => o.status !== "entsorgt").length})
            </button>

            {orte.map((ort) => {
              const ортLagerorte = lagerorteVonOrt(ort.id);
              const isOffen = aufgeklappt[ort.id];
              return (
                <div key={ort.id}>
                  <div className={`flex items-center group px-3 py-2 transition-colors ${ausgewaehlterOrt === ort.id && !ausgewaehlterLagerort ? "bg-green-500/10" : "hover:bg-light-hover dark:hover:bg-dark-hover"}`}>
                    <button
                      onClick={() => setAufgeklappt((p) => ({ ...p, [ort.id]: !isOffen }))}
                      className="mr-1 text-light-text-secondary dark:text-dark-text-secondary"
                    >
                      {isOffen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    <button
                      onClick={() => { setAusgewaehlterOrt(ort.id); setAusgewaehlterLagerort(null); }}
                      className="flex-1 text-left text-sm text-light-text-main dark:text-dark-text-main font-medium truncate"
                    >
                      {ort.name}
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button onClick={() => setModal({ typ: "lagerort", daten: { ort_id: ort.id } })} className="p-0.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-green-500"><Plus size={12} /></button>
                      <button onClick={() => setModal({ typ: "ort", daten: ort })} className="p-0.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-500"><Edit2 size={12} /></button>
                      <button onClick={() => loescheOrt(ort.id)} className="p-0.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  {isOffen && ортLagerorte.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setAusgewaehlterOrt(ort.id); setAusgewaehlterLagerort(l.id); }}
                      className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-sm transition-colors ${ausgewaehlterLagerort === l.id ? "bg-green-500/10 text-green-600 dark:text-green-400" : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-dark-hover"}`}
                    >
                      <Box size={12} />
                      <span className="truncate">{l.name}</span>
                      <span className="ml-auto text-xs opacity-60">
                        {objekte.filter((o) => o.lagerort_id === l.id).length}
                      </span>
                    </button>
                  ))}
                  {isOffen && (
                    <button
                      onClick={() => setModal({ typ: "lagerort", daten: { ort_id: ort.id } })}
                      className="w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-xs text-green-500 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
                    >
                      <Plus size={11} />
                      Lagerort hinzufügen
                    </button>
                  )}
                </div>
              );
            })}

            {orte.length === 0 && (
              <div className="px-3 py-4 text-xs text-center text-light-text-secondary dark:text-dark-text-secondary">
                Noch keine Standorte
              </div>
            )}
          </div>
        </div>

        {/* Hauptbereich: Objekte */}
        <div className="flex-1 min-w-0">
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                placeholder="Suche nach Name oder Tag..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text-main dark:text-dark-text-main focus:outline-none"
            >
              <option value="">Alle Status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {(ausgewaehlterOrt || ausgewaehlterLagerort) && (
              <button
                onClick={() => setModal({ typ: "objekt", daten: { ort_id: ausgewaehlterOrt, lagerort_id: ausgewaehlterLagerort } })}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Plus size={14} />
                Objekt
              </button>
            )}
          </div>

          {/* Lagerort-Aktionen wenn ausgewählt */}
          {ausgewaehlterLagerort && (
            <div className="mb-3 flex gap-2">
              {(() => {
                const l = lagerorte.find((x) => x.id === ausgewaehlterLagerort);
                return l ? (
                  <>
                    <button onClick={() => setModal({ typ: "lagerort", daten: l })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">
                      <Edit2 size={11} /> Bearbeiten
                    </button>
                    {l.qr_code_wert ? (
                      <button onClick={() => setModal({ typ: "qr", daten: { qrWert: l.qr_code_wert } })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">
                        <QrCode size={11} /> QR anzeigen
                      </button>
                    ) : (
                      <button onClick={() => generiereQr(l.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">
                        <QrCode size={11} /> QR generieren
                      </button>
                    )}
                    <button onClick={() => loescheLagerort(l.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-500/30 rounded-lg hover:bg-red-500/10 text-red-500">
                      <Trash2 size={11} /> Leerraum löschen
                    </button>
                  </>
                ) : null;
              })()}
            </div>
          )}

          {/* Objektliste */}
          {gefilterteObjekte.length === 0 ? (
            <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Keine Objekte gefunden</p>
              {ausgewaehlterOrt && (
                <button
                  onClick={() => setModal({ typ: "objekt", daten: { ort_id: ausgewaehlterOrt, lagerort_id: ausgewaehlterLagerort } })}
                  className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                >
                  <Plus size={14} />
                  Erstes Objekt hinzufügen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {gefilterteObjekte.map((obj) => {
                const ort = orte.find((o) => o.id === obj.ort_id);
                const lagerort = lagerorte.find((l) => l.id === obj.lagerort_id);
                return (
                  <div key={obj.id} className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-3 group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-light-text-main dark:text-dark-text-main truncate">{obj.name}</h3>
                        {lagerort && (
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
                            {ort?.name} → {lagerort.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button onClick={() => setModal({ typ: "objekt", daten: obj })} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-500"><Edit2 size={12} /></button>
                        <button onClick={() => loescheObjekt(obj.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_FARBEN[obj.status]}`}>
                        {STATUS_LABEL[obj.status]}
                      </span>
                      {obj.menge > 1 && (
                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">×{obj.menge}</span>
                      )}
                    </div>
                    {obj.tags && obj.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {obj.tags.slice(0, 3).map((t) => (
                          <span key={t} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-light-border dark:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary">
                            <Tag size={9} />{t}
                          </span>
                        ))}
                        {obj.tags.length > 3 && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">+{obj.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-semibold text-light-text-main dark:text-dark-text-main">
                {modal.typ === "ort" && (modal.daten?.id ? "Standort bearbeiten" : "Neuer Standort")}
                {modal.typ === "lagerort" && (modal.daten?.id ? "Lagerort bearbeiten" : "Neuer Lagerort")}
                {modal.typ === "objekt" && (modal.daten?.id ? "Objekt bearbeiten" : "Neues Objekt")}
                {modal.typ === "qr" && "QR-Code"}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-main dark:hover:text-dark-text-main"><X size={18} /></button>
            </div>
            <div className="p-4">
              {modal.typ === "ort" && (
                <OrtForm initial={modal.daten} onSpeichern={speichereOrt} onAbbrechen={() => setModal(null)} />
              )}
              {modal.typ === "lagerort" && (
                <LagerortForm ortId={modal.daten?.ort_id || ausgewaehlterOrt} parentId={null} initial={modal.daten?.id ? modal.daten : null} onSpeichern={speichereLagerort} onAbbrechen={() => setModal(null)} />
              )}
              {modal.typ === "objekt" && (
                <ObjektForm ortId={modal.daten?.ort_id || ausgewaehlterOrt} lagerortId={modal.daten?.lagerort_id || ausgewaehlterLagerort} initial={modal.daten?.name ? modal.daten : null} onSpeichern={speichereObjekt} onAbbrechen={() => setModal(null)} />
              )}
              {modal.typ === "qr" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={modal.daten.qrWert} size={160} />
                  </div>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center break-all">{modal.daten.qrWert}</p>
                  <button onClick={() => setModal(null)} className="px-4 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm text-light-text-main dark:text-dark-text-main hover:bg-light-hover dark:hover:bg-dark-hover">Schließen</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeInventar;
