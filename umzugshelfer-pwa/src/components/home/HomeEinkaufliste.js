import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Trash2, X, Check, Circle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";

const KATEGORIEN = ["Lebensmittel", "Haushalt", "Hygiene", "Reinigung", "Technik", "Sonstiges"];
const EINHEITEN = ["Stück", "Packung", "Liter", "kg", "Dose", "Flasche", "Rolle"];

const HomeEinkaufliste = ({ session }) => {
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [eintraege, setEintraege] = useState([]);
  const [modal, setModal] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [form, setForm] = useState({ name: "", menge: 1, einheit: "Stück", kategorie: "Haushalt" });

  const ladeDaten = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("home_einkaufliste")
        .select("*")
        .eq("user_id", userId)
        .order("erledigt")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEintraege(data || []);
    } catch (e) {
      setFehler("Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { ladeDaten(); }, [ladeDaten]);

  const hinzufuegen = async () => {
    if (!form.name.trim()) return;
    await supabase.from("home_einkaufliste").insert({ ...form, user_id: userId, name: form.name.trim() });
    setForm({ name: "", menge: 1, einheit: "Stück", kategorie: "Haushalt" });
    setModal(false);
    ladeDaten();
  };

  const toggleErledigt = async (e) => {
    const neuerWert = !e.erledigt;
    await supabase.from("home_einkaufliste").update({
      erledigt: neuerWert,
      erledigt_am: neuerWert ? new Date().toISOString() : null,
    }).eq("id", e.id);
    ladeDaten();
  };

  const loesche = async (id) => {
    await supabase.from("home_einkaufliste").delete().eq("id", id);
    ladeDaten();
  };

  const loescheErledigt = async () => {
    if (!window.confirm("Alle erledigten Einträge löschen?")) return;
    await supabase.from("home_einkaufliste").delete().eq("user_id", userId).eq("erledigt", true);
    ladeDaten();
  };

  const offen = eintraege.filter((e) => !e.erledigt);
  const erledigt = eintraege.filter((e) => e.erledigt);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} className="text-amber-500" />
          <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">Einkaufsliste</h1>
          {offen.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">{offen.length}</span>
          )}
        </div>
        <div className="flex gap-2">
          {erledigt.length > 0 && (
            <button onClick={loescheErledigt} className="px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-dark-hover">
              Erledigte löschen
            </button>
          )}
          <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
            <Plus size={14} />Hinzufügen
          </button>
        </div>
      </div>

      {fehler && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertCircle size={16} />{fehler}</div>}

      {eintraege.length === 0 ? (
        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Einkaufsliste ist leer</p>
          <button onClick={() => setModal(true)} className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm">
            <Plus size={14} />Ersten Eintrag hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {offen.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2">Offen ({offen.length})</h2>
              <div className="space-y-2">
                {offen.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-3 group">
                    <button onClick={() => toggleErledigt(e)} className="w-5 h-5 rounded-full border-2 border-light-border dark:border-dark-border flex items-center justify-center hover:border-green-500 transition-colors flex-shrink-0">
                      <Circle size={12} className="text-light-text-secondary dark:text-dark-text-secondary" />
                    </button>
                    <div className="flex-1">
                      <span className="text-sm text-light-text-main dark:text-dark-text-main">{e.name}</span>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary ml-2">{e.menge} {e.einheit}</span>
                    </div>
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{e.kategorie}</span>
                    <button onClick={() => loesche(e.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {erledigt.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2">Erledigt ({erledigt.length})</h2>
              <div className="space-y-2">
                {erledigt.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-3 opacity-60 group">
                    <button onClick={() => toggleErledigt(e)} className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </button>
                    <div className="flex-1">
                      <span className="text-sm text-light-text-main dark:text-dark-text-main line-through">{e.name}</span>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary ml-2">{e.menge} {e.einheit}</span>
                    </div>
                    <button onClick={() => loesche(e.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-semibold text-light-text-main dark:text-dark-text-main">Eintrag hinzufügen</h3>
              <button onClick={() => setModal(false)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Artikel*</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && hinzufuegen()} placeholder="z.B. Waschmittel" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500" autoFocus />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Menge</label>
                  <input type="number" min="0.5" step="0.5" value={form.menge} onChange={(e) => setForm((p) => ({ ...p, menge: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Einheit</label>
                  <select value={form.einheit} onChange={(e) => setForm((p) => ({ ...p, einheit: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
                    {EINHEITEN.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Kategorie</label>
                  <select value={form.kategorie} onChange={(e) => setForm((p) => ({ ...p, kategorie: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
                    {KATEGORIEN.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(false)} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
                <button onClick={hinzufuegen} disabled={!form.name.trim()} className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50">Hinzufügen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeEinkaufliste;
