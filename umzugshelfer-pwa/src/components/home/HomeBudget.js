import React, { useState, useEffect, useCallback } from "react";
import { DollarSign, Plus, Edit2, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";

const HOME_KATEGORIEN = ["Lebensmittel", "Haushalt", "Reparaturen", "Abonnements", "Versicherungen", "Einrichtung", "Rücklagen", "Sonstiges"];

const BudgetForm = ({ initial, onSpeichern, onAbbrechen }) => {
  const [form, setForm] = useState({
    beschreibung: initial?.beschreibung || "",
    kategorie: initial?.kategorie || "Haushalt",
    betrag: initial?.betrag || "",
    datum: initial?.datum || new Date().toISOString().split("T")[0],
    app_modus: "home",
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Beschreibung*</label>
        <input value={form.beschreibung} onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))} placeholder="z.B. Supermarkt Wocheneinkauf" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Kategorie</label>
          <select value={form.kategorie} onChange={(e) => setForm((p) => ({ ...p, kategorie: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none">
            {HOME_KATEGORIEN.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Betrag (€)*</label>
          <input type="number" step="0.01" min="0" value={form.betrag} onChange={(e) => setForm((p) => ({ ...p, betrag: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Datum</label>
        <input type="date" value={form.datum} onChange={(e) => setForm((p) => ({ ...p, datum: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={onAbbrechen} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
        <button onClick={() => form.beschreibung.trim() && form.betrag && onSpeichern(form)} disabled={!form.beschreibung.trim() || !form.betrag} className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50">Speichern</button>
      </div>
    </div>
  );
};

const HomeBudget = ({ session }) => {
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [posten, setPosten] = useState([]);
  const [modal, setModal] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [kategFilter, setKategFilter] = useState("");

  const ladeDaten = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("budget_posten")
        .select("*")
        .eq("user_id", userId)
        .in("app_modus", ["home", "beides"])
        .order("datum", { ascending: false });
      if (error) throw error;
      setPosten(data || []);
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
      await supabase.from("budget_posten").update(daten).eq("id", modal.id);
    } else {
      await supabase.from("budget_posten").insert(payload);
    }
    setModal(null);
    ladeDaten();
  };

  const loesche = async (id) => {
    if (!window.confirm("Eintrag löschen?")) return;
    await supabase.from("budget_posten").delete().eq("id", id);
    ladeDaten();
  };

  const gefiltertPosten = posten.filter((p) => !kategFilter || p.kategorie === kategFilter);
  const gesamt = gefiltertPosten.reduce((s, p) => s + Number(p.betrag), 0);

  // Ausgaben nach Kategorie für Übersicht
  const nachKategorie = HOME_KATEGORIEN.map((k) => ({
    name: k,
    summe: posten.filter((p) => p.kategorie === k).reduce((s, p) => s + Number(p.betrag), 0),
  })).filter((k) => k.summe > 0).sort((a, b) => b.summe - a.summe);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <DollarSign size={22} className="text-green-500" />
          <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">Haushaltsbudget</h1>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
          <Plus size={14} />Ausgabe
        </button>
      </div>

      {fehler && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertCircle size={16} />{fehler}</div>}

      {/* Übersicht nach Kategorie */}
      {nachKategorie.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {nachKategorie.slice(0, 4).map((k) => (
            <div key={k.name} className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-3 text-center">
              <div className="text-lg font-bold text-light-text-main dark:text-dark-text-main">{k.summe.toFixed(2)} €</div>
              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{k.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gesamt */}
      <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-4 mb-5 flex items-center justify-between">
        <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Gesamt {kategFilter ? `(${kategFilter})` : ""}</span>
        <span className="text-xl font-bold text-light-text-main dark:text-dark-text-main">{gesamt.toFixed(2)} €</span>
      </div>

      {/* Kategorie-Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setKategFilter("")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!kategFilter ? "bg-green-500 text-white" : "bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-main dark:text-dark-text-main"}`}>Alle</button>
        {HOME_KATEGORIEN.map((k) => (
          <button key={k} onClick={() => setKategFilter(k)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${kategFilter === k ? "bg-green-500 text-white" : "bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-main dark:text-dark-text-main"}`}>{k}</button>
        ))}
      </div>

      {/* Liste */}
      {gefiltertPosten.length === 0 ? (
        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
          <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Ausgaben</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gefiltertPosten.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border p-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-light-text-main dark:text-dark-text-main truncate">{p.beschreibung}</p>
                <div className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  <span>{p.kategorie}</span>
                  <span>{p.datum}</span>
                </div>
              </div>
              <span className="font-semibold text-light-text-main dark:text-dark-text-main">{Number(p.betrag).toFixed(2)} €</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal(p)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-500"><Edit2 size={13} /></button>
                <button onClick={() => loesche(p.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
              <h3 className="font-semibold text-light-text-main dark:text-dark-text-main">{modal.id ? "Ausgabe bearbeiten" : "Neue Ausgabe"}</h3>
              <button onClick={() => setModal(null)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary"><X size={18} /></button>
            </div>
            <div className="p-4">
              <BudgetForm initial={modal.id ? modal : null} onSpeichern={speichere} onAbbrechen={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeBudget;
