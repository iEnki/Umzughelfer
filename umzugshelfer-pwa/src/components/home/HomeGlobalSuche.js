import React, { useState, useCallback, useRef } from "react";
import { Search, Package, ShoppingCart, Wrench, CheckSquare, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const QUELLEN = [
  { key: "objekte", label: "Inventar", icon: Package, farbe: "text-blue-500", pfad: "/home/inventar" },
  { key: "vorraete", label: "Vorräte", icon: ShoppingCart, farbe: "text-green-500", pfad: "/home/vorraete" },
  { key: "geraete", label: "Geräte", icon: Wrench, farbe: "text-orange-500", pfad: "/home/geraete" },
  { key: "aufgaben", label: "Aufgaben", icon: CheckSquare, farbe: "text-purple-500", pfad: "/home/aufgaben" },
];

const HomeGlobalSuche = ({ session }) => {
  const userId = session?.user?.id;
  const navigate = useNavigate();
  const [suchbegriff, setSuchbegriff] = useState("");
  const [loading, setLoading] = useState(false);
  const [ergebnisse, setErgebnisse] = useState({});
  const debounceRef = useRef(null);

  const suche = useCallback(async (begriffe) => {
    if (!userId || begriffe.length < 2) {
      setErgebnisse({});
      return;
    }
    setLoading(true);
    try {
      const [objekteRes, vorraeteRes, geraeteRes, aufgabenRes] = await Promise.all([
        supabase.from("home_objekte").select("id, name, status, kategorie").eq("user_id", userId).ilike("name", `%${begriffe}%`).neq("status", "entsorgt").limit(5),
        supabase.from("home_vorraete").select("id, name, kategorie, bestand, einheit").eq("user_id", userId).ilike("name", `%${begriffe}%`).limit(5),
        supabase.from("home_geraete").select("id, name, hersteller, naechste_wartung").eq("user_id", userId).ilike("name", `%${begriffe}%`).limit(5),
        supabase.from("todo_aufgaben").select("id, beschreibung, erledigt, kategorie").eq("user_id", userId).in("app_modus", ["home", "beides"]).ilike("beschreibung", `%${begriffe}%`).eq("erledigt", false).limit(5),
      ]);

      setErgebnisse({
        objekte: objekteRes.data || [],
        vorraete: vorraeteRes.data || [],
        geraete: geraeteRes.data || [],
        aufgaben: aufgabenRes.data || [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleInput = (val) => {
    setSuchbegriff(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => suche(val), 350);
  };

  const hatErgebnisse = Object.values(ergebnisse).some((arr) => arr.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Search size={22} className="text-green-500" />
        <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">Suche</h1>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
        {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-light-text-secondary dark:text-dark-text-secondary" />}
        <input
          value={suchbegriff}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Wo ist das HDMI-Kabel? Was liegt in Kiste 2?"
          className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-text-main dark:text-dark-text-main focus:outline-none focus:border-green-500 shadow-sm"
          autoFocus
        />
      </div>

      {suchbegriff.length >= 2 && !loading && !hatErgebnisse && (
        <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
          <Search size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Keine Ergebnisse für „{suchbegriff}"</p>
        </div>
      )}

      {hatErgebnisse && (
        <div className="space-y-5">
          {QUELLEN.map(({ key, label, icon: Icon, farbe, pfad }) => {
            const items = ergebnisse[key] || [];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={farbe} />
                  <h2 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">{label}</h2>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(pfad)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-green-500/50 transition-colors text-left"
                    >
                      <Icon size={14} className={`${farbe} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-light-text-main dark:text-dark-text-main truncate">
                          {item.name || item.beschreibung}
                        </p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          {item.kategorie || item.hersteller || (item.bestand !== undefined ? `${item.bestand} ${item.einheit}` : "")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suchbegriff.length < 2 && (
        <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
          <p className="text-sm">Mindestens 2 Zeichen eingeben</p>
          <p className="text-xs mt-1 opacity-70">Durchsucht Inventar, Vorräte, Geräte und Aufgaben</p>
        </div>
      )}
    </div>
  );
};

export default HomeGlobalSuche;
