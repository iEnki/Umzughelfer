import React, { useState, useEffect, useCallback } from "react";
import { FolderOpen, Plus, Edit2, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";

const TYPEN = ["Reorganisation", "Reparatur", "Saisonwechsel", "Renovierung", "Dekoration", "Anschaffung", "Sonstiges"];
const STATUS_OPTIONEN = ["geplant", "in_bearbeitung", "pausiert", "abgeschlossen"];
const STATUS_LABEL = { geplant: "Geplant", in_bearbeitung: "In Bearbeitung", pausiert: "Pausiert", abgeschlossen: "Abgeschlossen" };
const STATUS_FARBEN = { geplant: "bg-gray-500/10 text-gray-500", in_bearbeitung: "bg-blue-500/10 text-blue-500", pausiert: "bg-amber-500/10 text-amber-500", abgeschlossen: "bg-green-500/10 text-green-500" };

const ProjektForm = ({ initial, onSpeichern, onAbbrechen }) => {
  const [form, setForm] = useState({
    name: initial?.name || "",
    typ: initial?.typ || "Sonstiges",
    status: initial?.status || "geplant",
    beschreibung: initial?.beschreibung || "",
    startdatum: initial?.startdatum || "",
    zieldatum: initial?.zieldatum || "",
    budget: initial?.budget || "",
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Projektname*</label>
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="z.B. Keller aufräumen" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Typ</label>
          <select value={form.typ} onChange={(e) => setForm((p) => ({ ...p, typ: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
            {TYPEN.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
            {STATUS_OPTIONEN.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Beschreibung</label>
        <textarea value={form.beschreibung} onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none resize-none" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Start</label>
          <input type="date" value={form.startdatum} onChange={(e) => setForm((p) => ({ ...p, startdatum: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Zieldatum</label>
          <input type="date" value={form.zieldatum} onChange={(e) => setForm((p) => ({ ...p, zieldatum: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Budget (€)</label>
          <input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onAbbrechen} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
        <button onClick={() => form.name.trim() && onSpeichern(form)} disabled={!form.name.trim()} className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50">Speichern</button>
      </div>
    </div>
  );
};

const HomeProjekte = ({ session }) => {
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [projekte, setProjekte] = useState([]);
  const [modal, setModal] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const ladeDaten = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("home_projekte").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      setProjekte(data || []);
    } catch (e) {
      setFehler("Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { ladeDaten(); }, [ladeDaten]);

  const speichere = async (daten) => {
    const payload = { ...daten, user_id: userId };
    if (modal?.id) {
      await supabase.from("home_projekte").update(daten).eq("id", modal.id);
    } else {
      await supabase.from("home_projekte").insert(payload);
    }
    setModal(null);
    ladeDaten();
  };

  const loesche = async (id) => {
    if (!window.confirm("Projekt löschen?")) return;
    await supabase.from("home_projekte").delete().eq("id", id);
    ladeDaten();
  };

  const gefiltertProjekte = projekte.filter((p) => !statusFilter || p.status === statusFilter);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FolderOpen size={22} className="text-purple-500" />
          <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">Projekte</h1>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
          <Plus size={14} />Neues Projekt
        </button>
      </div>

      {fehler && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertCircle size={16} />{fehler}</div>}

      {/* Status-Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!statusFilter ? "bg-purple-500 text-white" : "bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-main dark:text-dark-text-main"}`}>Alle</button>
        {STATUS_OPTIONEN.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? "bg-purple-500 text-white" : "bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-main dark:text-dark-text-main"}`}>{STATUS_LABEL[s]}</button>
        ))}
      </div>

      {gefiltertProjekte.length === 0 ? (
        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Projekte</p>
          <button onClick={() => setModal({})} className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"><Plus size={14} />Erstes Projekt anlegen</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gefiltertProjekte.map((p) => (
            <div key={p.id} className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-light-text-main dark:text-dark-text-main truncate">{p.name}</h3>
                  <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{p.typ}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button onClick={() => setModal(p)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-500"><Edit2 size={12} /></button>
                  <button onClick={() => loesche(p.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
              {p.beschreibung && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3 line-clamp-2">{p.beschreibung}</p>}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_FARBEN[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                {p.budget && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Budget: {Number(p.budget).toFixed(0)} €</span>}
              </div>
              {p.zieldatum && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">Ziel: {p.zieldatum}</p>}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full border border-light-border dark:border-dark-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
              <h3 className="font-semibold text-light-text-main dark:text-dark-text-main">{modal.id ? "Projekt bearbeiten" : "Neues Projekt"}</h3>
              <button onClick={() => setModal(null)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary"><X size={18} /></button>
            </div>
            <div className="p-4">
              <ProjektForm initial={modal.id ? modal : null} onSpeichern={speichere} onAbbrechen={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeProjekte;
