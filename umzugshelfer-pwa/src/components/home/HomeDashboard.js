import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Package, ShoppingCart, Wrench, CheckSquare,
  FolderOpen, AlertTriangle, ChevronRight, Loader2,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const HomeDashboard = ({ session }) => {
  const userId = session?.user?.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    objekte: 0,
    orte: 0,
    vorraeteRot: 0,
    vorraeteGesamt: 0,
    einkaufOffen: 0,
    geraete: 0,
    geraeteWartungFaellig: 0,
    aufgabenHeute: 0,
    projekteAktiv: 0,
  });

  const ladeStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const heute = new Date().toISOString().split("T")[0];

      const [
        objekteRes,
        orteRes,
        vorraeteRes,
        einkaufRes,
        geraeteRes,
        aufgabenRes,
        projekteRes,
      ] = await Promise.all([
        supabase.from("home_objekte").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("status", "entsorgt"),
        supabase.from("home_orte").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("home_vorraete").select("id, bestand, mindestmenge").eq("user_id", userId),
        supabase.from("home_einkaufliste").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("erledigt", false),
        supabase.from("home_geraete").select("id, naechste_wartung").eq("user_id", userId),
        supabase.from("todo_aufgaben").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("erledigt", false).in("app_modus", ["home", "beides"]).lte("faelligkeitsdatum", `${heute}T23:59:59`),
        supabase.from("home_projekte").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "in_bearbeitung"),
      ]);

      const vorraete = vorraeteRes.data || [];
      const vorraeteRot = vorraete.filter((v) => Number(v.bestand) < Number(v.mindestmenge)).length;

      const geraete = geraeteRes.data || [];
      const geraeteWartungFaellig = geraete.filter(
        (g) => g.naechste_wartung && g.naechste_wartung <= heute
      ).length;

      setStats({
        objekte: objekteRes.count || 0,
        orte: orteRes.count || 0,
        vorraeteRot,
        vorraeteGesamt: vorraete.length,
        einkaufOffen: einkaufRes.count || 0,
        geraete: geraete.length,
        geraeteWartungFaellig,
        aufgabenHeute: aufgabenRes.count || 0,
        projekteAktiv: projekteRes.count || 0,
      });
    } catch (e) {
      console.error("HomeDashboard ladeStats:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    ladeStats();
  }, [ladeStats]);

  const kacheln = [
    {
      titel: "Inventar",
      wert: stats.objekte,
      einheit: "Objekte",
      unter: `${stats.orte} Standorte`,
      icon: Package,
      farbe: "blue",
      pfad: "/home/inventar",
    },
    {
      titel: "Vorräte",
      wert: stats.vorraeteRot,
      einheit: "nachkaufen",
      unter: `${stats.vorraeteGesamt} Artikel gesamt`,
      icon: ShoppingCart,
      farbe: stats.vorraeteRot > 0 ? "red" : "green",
      pfad: "/home/vorraete",
      warnung: stats.vorraeteRot > 0,
    },
    {
      titel: "Einkaufsliste",
      wert: stats.einkaufOffen,
      einheit: "offen",
      icon: ShoppingCart,
      farbe: "amber",
      pfad: "/home/einkaufliste",
    },
    {
      titel: "Geräte",
      wert: stats.geraeteWartungFaellig,
      einheit: "Wartung fällig",
      unter: `${stats.geraete} Geräte gesamt`,
      icon: Wrench,
      farbe: stats.geraeteWartungFaellig > 0 ? "orange" : "green",
      pfad: "/home/geraete",
      warnung: stats.geraeteWartungFaellig > 0,
    },
    {
      titel: "Aufgaben heute",
      wert: stats.aufgabenHeute,
      einheit: "fällig",
      icon: CheckSquare,
      farbe: stats.aufgabenHeute > 0 ? "red" : "green",
      pfad: "/home/aufgaben",
    },
    {
      titel: "Aktive Projekte",
      wert: stats.projekteAktiv,
      einheit: "in Bearbeitung",
      icon: FolderOpen,
      farbe: "purple",
      pfad: "/home/projekte",
    },
  ];

  const farbKlassen = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    amber: "bg-amber-500/10 text-amber-500",
    orange: "bg-orange-500/10 text-orange-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-light-text-secondary dark:text-dark-text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <Home size={22} className="text-green-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-light-text-main dark:text-dark-text-main">
            Home Organizer
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Dein Zuhause im Überblick
          </p>
        </div>
      </div>

      {/* Warnungs-Banner */}
      {(stats.vorraeteRot > 0 || stats.geraeteWartungFaellig > 0 || stats.aufgabenHeute > 0) && (
        <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            {stats.vorraeteRot > 0 && <span className="mr-3">{stats.vorraeteRot} Vorrat unter Mindestmenge</span>}
            {stats.geraeteWartungFaellig > 0 && <span className="mr-3">{stats.geraeteWartungFaellig} Gerätewartung fällig</span>}
            {stats.aufgabenHeute > 0 && <span>{stats.aufgabenHeute} Aufgabe(n) heute fällig</span>}
          </div>
        </div>
      )}

      {/* Kacheln */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kacheln.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.pfad}
              onClick={() => navigate(k.pfad)}
              className="relative p-4 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-green-500/50 transition-all duration-200 text-left group"
            >
              {k.warnung && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${farbKlassen[k.farbe]}`}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold text-light-text-main dark:text-dark-text-main">
                {k.wert}
              </div>
              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {k.einheit}
              </div>
              <div className="text-xs font-medium text-light-text-main dark:text-dark-text-main mt-1">
                {k.titel}
              </div>
              {k.unter && (
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                  {k.unter}
                </div>
              )}
              <ChevronRight size={14} className="absolute bottom-3 right-3 text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      {/* Schnellzugriff */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Objekt suchen", pfad: "/home/suche", icon: "🔍" },
            { label: "Wartungsprotokoll", pfad: "/home/geraete", icon: "🔧" },
            { label: "Budget", pfad: "/home/budget", icon: "💶" },
            { label: "Projekte", pfad: "/home/projekte", icon: "📋" },
          ].map((item) => (
            <button
              key={item.pfad}
              onClick={() => navigate(item.pfad)}
              className="flex items-center gap-2 p-3 rounded-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover transition-colors text-sm text-light-text-main dark:text-dark-text-main"
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
