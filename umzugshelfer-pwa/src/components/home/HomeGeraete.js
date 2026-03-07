import React, { useState, useEffect, useCallback } from "react";
import { Wrench, Plus, Edit2, Trash2, X, AlertTriangle, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "../../supabaseClient";

const GeraetForm = ({ initial, onSpeichern, onAbbrechen }) => {
  const [form, setForm] = useState({
    name: initial?.name || "",
    hersteller: initial?.hersteller || "",
    modell: initial?.modell || "",
    seriennummer: initial?.seriennummer || "",
    kaufdatum: initial?.kaufdatum || "",
    kaufpreis: initial?.kaufpreis || "",
    garantie_bis: initial?.garantie_bis || "",
    naechste_wartung: initial?.naechste_wartung || "",
    wartungsintervall_monate: initial?.wartungsintervall_monate || "",
    notizen: initial?.notizen || "",
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Gerätebezeichnung*</label>
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="z.B. Waschmaschine" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Hersteller</label>
          <input value={form.hersteller} onChange={(e) => setForm((p) => ({ ...p, hersteller: e.target.value }))} placeholder="z.B. Bosch" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Modell</label>
          <input value={form.modell} onChange={(e) => setForm((p) => ({ ...p, modell: e.target.value }))} placeholder="z.B. WAX32K42" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Kaufdatum</label>
          <input type="date" value={form.kaufdatum} onChange={(e) => setForm((p) => ({ ...p, kaufdatum: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Garantie bis</label>
          <input type="date" value={form.garantie_bis} onChange={(e) => setForm((p) => ({ ...p, garantie_bis: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Nächste Wartung</label>
          <input type="date" value={form.naechste_wartung} onChange={(e) => setForm((p) => ({ ...p, naechste_wartung: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Intervall (Monate)</label>
          <input type="number" min="1" value={form.wartungsintervall_monate} onChange={(e) => setForm((p) => ({ ...p, wartungsintervall_monate: e.target.value }))} placeholder="z.B. 12" className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Notizen</label>
        <textarea value={form.notizen} onChange={(e) => setForm((p) => ({ ...p, notizen: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-main dark:text-dark-text-main focus:outline-none resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={onAbbrechen} className="flex-1 px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-light-text-main dark:text-dark-text-main">Abbrechen</button>
        <button onClick={() => form.name.trim() && onSpeichern(form)} disabled={!form.name.trim()} className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50">Speichern</button>
      </div>
    </div>
  );
};

const HomeGeraete = ({ session }) => {
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [geraete, setGeraete] = useState([]);
  const [wartungen, setWartungen] = useState([]);
  const [modal, setModal] = useState(null);
  const [ausgeklappt, setAusgeklappt] = useState({});
  const [fehler, setFehler] = useState(null);

  const ladeDaten = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [geraeteRes, wartungenRes] = await Promise.all([
        supabase.from("home_geraete").select("*").eq("user_id", userId).order("name"),
        supabase.from("home_wartungen").select("*").eq("user_id", userId).order("datum", { ascending: false }),
      ]);
      setGeraete(geraeteRes.data || []);
      setWartungen(wartungenRes.data || []);
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
      await supabase.from("home_geraete").update(daten).eq("id", modal.id);
    } else {
      await supabase.from("home_geraete").insert(payload);
    }
    setModal(null);
    ladeDaten();
  };

  const loesche = async (id) => {
    if (!window.confirm("Gerät und alle Wartungseinträge löschen?")) return;
    await supabase.from("home_geraete").delete().eq("id", id);
    ladeDaten();
  };

  const wartungErledigt = async (geraetId) => {
    const g = geraete.find((x) => x.id === geraetId);
    if (!g) return;
    const neuesDatum = g.wartungsintervall_monate
      ? new Date(Date.now() + g.wartungsintervall_monate * 30 * 86400000).toISOString().split("T")[0]
      : null;
    await supabase.from("home_wartungen").insert({ user_id: userId, geraet_id: geraetId, datum: new Date().toISOString().split("T")[0], typ: "Wartung", beschreibung: "Reguläre Wartung erledigt" });
    if (neuesDatum) {
      await supabase.from("home_geraete").update({ naechste_wartung: neuesDatum }).eq("id", geraetId);
    }
    ladeDaten();
  };

  const heute = new Date().toISOString().split("T")[0];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Wrench size={22} className="text-green-500" />
          <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">Geräte & Wartung</h1>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
          <Plus size={14} />Gerät hinzufügen
        </button>
      </div>

      {fehler && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><AlertCircle size={16} />{fehler}</div>}

      {geraete.length === 0 ? (
        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Geräte erfasst</p>
          <button onClick={() => setModal({})} className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"><Plus size={14} />Erstes Gerät hinzufügen</button>
        </div>
      ) : (
        <div className="space-y-3">
          {geraete.map((g) => {
            const wartungFaellig = g.naechste_wartung && g.naechste_wartung <= heute;
            const garantieAbgelaufen = g.garantie_bis && g.garantie_bis < heute;
            const geraetWartungen = wartungen.filter((w) => w.geraet_id === g.id);
            const isOffen = ausgeklappt[g.id];

            return (
              <div key={g.id} className={`bg-light-card dark:bg-dark-card rounded-xl border ${wartungFaellig ? "border-orange-500/40" : "border-light-border dark:border-dark-border"}`}>
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => setAusgeklappt((p) => ({ ...p, [g.id]: !isOffen }))} className="text-light-text-secondary dark:text-dark-text-secondary">
                    {isOffen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-light-text-main dark:text-dark-text-main">{g.name}</h3>
                      {g.hersteller && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{g.hersteller}</span>}
                      {wartungFaellig && <span className="flex items-center gap-0.5 text-xs text-orange-500"><AlertTriangle size={11} />Wartung fällig</span>}
                      {garantieAbgelaufen && <span className="text-xs text-gray-400">Garantie abgelaufen</span>}
                    </div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                      {g.naechste_wartung && <span>Nächste Wartung: {g.naechste_wartung}</span>}
                      {g.garantie_bis && !garantieAbgelaufen && <span className="ml-3">Garantie bis: {g.garantie_bis}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {wartungFaellig && (
                      <button onClick={() => wartungErledigt(g.id)} className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg">Erledigt</button>
                    )}
                    <button onClick={() => setModal(g)} className="p-1.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-500"><Edit2 size={13} /></button>
                    <button onClick={() => loesche(g.id)} className="p-1.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                {isOffen && (
                  <div className="border-t border-light-border dark:border-dark-border p-3">
                    <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2">Wartungsprotokoll</h4>
                    {geraetWartungen.length === 0 ? (
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Noch keine Wartungen</p>
                    ) : (
                      <div className="space-y-1">
                        {geraetWartungen.slice(0, 5).map((w) => (
                          <div key={w.id} className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            <span className="w-20 flex-shrink-0">{w.datum}</span>
                            <span>{w.typ}</span>
                            {w.beschreibung && <span>— {w.beschreibung}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full border border-light-border dark:border-dark-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-card dark:bg-dark-card">
              <h3 className="font-semibold text-light-text-main dark:text-dark-text-main">{modal.id ? "Gerät bearbeiten" : "Neues Gerät"}</h3>
              <button onClick={() => setModal(null)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary"><X size={18} /></button>
            </div>
            <div className="p-4">
              <GeraetForm initial={modal.id ? modal : null} onSpeichern={speichere} onAbbrechen={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeGeraete;
