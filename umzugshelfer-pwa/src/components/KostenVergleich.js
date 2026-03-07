import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { Scale, Building, Car, TrendingDown, TrendingUp, CheckCircle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { formatGermanCurrency } from "../utils/formatUtils";

const EIGENE_KATEGORIEN = ["Transport", "Material", "Verpflegung", "Sonstiges", "Neue Möbel", "Kaution", "Makler", "Helfer", "Renovierung"];

const KostenVergleich = ({ session }) => {
  const userId = session?.user?.id;
  const { theme } = useTheme();
  const [angebotUnternehmen, setAngebotUnternehmen] = useState(
    localStorage.getItem("umzug_kostenvergleich_angebot") || ""
  );
  const [budgetPosten, setBudgetPosten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ausgewaehlteKategorien, setAusgewaehlteKategorien] = useState(
    JSON.parse(localStorage.getItem("umzug_kostenvergleich_kat") || "null") || EIGENE_KATEGORIEN
  );

  const fetchBudgetPosten = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from("budget_posten")
      .select("id, beschreibung, kategorie, betrag, teilzahlungen:budget_teilzahlungen(betrag_teilzahlung)")
      .eq("user_id", userId)
      .order("kategorie");
    setBudgetPosten(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBudgetPosten();
  }, [fetchBudgetPosten]);

  const handleAngebotChange = (val) => {
    setAngebotUnternehmen(val);
    localStorage.setItem("umzug_kostenvergleich_angebot", val);
  };

  const toggleKategorie = (kat) => {
    const updated = ausgewaehlteKategorien.includes(kat)
      ? ausgewaehlteKategorien.filter((k) => k !== kat)
      : [...ausgewaehlteKategorien, kat];
    setAusgewaehlteKategorien(updated);
    localStorage.setItem("umzug_kostenvergleich_kat", JSON.stringify(updated));
  };

  // Compute own costs from selected categories
  const relevantePosten = budgetPosten.filter((p) =>
    ausgewaehlteKategorien.includes(p.kategorie)
  );

  const postenMitSumme = relevantePosten.map((p) => {
    const bezahlt = (p.teilzahlungen || []).reduce(
      (sum, t) => sum + (parseFloat(t.betrag_teilzahlung) || 0), 0
    );
    const geplant = parseFloat(p.betrag) || 0;
    return { ...p, summe: Math.max(bezahlt, geplant) };
  });

  const eigeneSumme = postenMitSumme.reduce((sum, p) => sum + p.summe, 0);
  const angebotNum = parseFloat(String(angebotUnternehmen).replace(",", ".")) || 0;
  const differenz = angebotNum - eigeneSumme;
  const eigeneGünstiger = angebotNum > 0 && eigeneSumme < angebotNum;
  const unternehmenGünstiger = angebotNum > 0 && angebotNum < eigeneSumme;

  const availableKategorien = [...new Set(budgetPosten.map((p) => p.kategorie).filter(Boolean))];

  const cardBase = "p-4 rounded-lg border shadow-sm";
  const cardLight = "bg-light-card-bg border-light-border";
  const cardDark = "dark:bg-dark-card-bg dark:border-dark-border";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Scale size={28} className="text-light-accent-purple dark:text-dark-accent-purple" />
        <h1 className="text-2xl font-bold text-light-text-main dark:text-dark-text-main">
          Kostenvergleich
        </h1>
      </div>
      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary -mt-4">
        Vergleiche deine eigenen Umzugskosten mit einem Angebot eines Umzugsunternehmens.
      </p>

      <div className={`${cardBase} ${cardLight} ${cardDark}`}>
        <div className="flex items-center gap-2 mb-3">
          <Building size={18} className="text-light-accent-purple dark:text-dark-accent-purple" />
          <h2 className="font-semibold text-light-text-main dark:text-dark-text-main">
            Angebot Umzugsunternehmen
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="z.B. 1200"
            value={angebotUnternehmen}
            onChange={(e) => handleAngebotChange(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-light-border dark:border-dark-border rounded-md text-sm bg-white dark:bg-dark-border text-light-text-main dark:text-dark-text-main focus:ring-1 focus:ring-light-accent-purple dark:focus:ring-dark-accent-purple"
          />
          <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm">€</span>
        </div>
      </div>

      <div className={`${cardBase} ${cardLight} ${cardDark}`}>
        <div className="flex items-center gap-2 mb-3">
          <Car size={18} className="text-light-accent-green dark:text-dark-accent-green" />
          <h2 className="font-semibold text-light-text-main dark:text-dark-text-main">
            Eigene Kosten – Kategorien auswählen
          </h2>
        </div>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
          Wähle die Budget-Kategorien, die zum eigenen Umzug zählen:
        </p>
        {loading ? (
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Lade...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {(availableKategorien.length > 0 ? availableKategorien : EIGENE_KATEGORIEN).map((kat) => (
                <button
                  key={kat}
                  onClick={() => toggleKategorie(kat)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    ausgewaehlteKategorien.includes(kat)
                      ? "bg-light-accent-green text-white dark:bg-dark-accent-green dark:text-dark-bg"
                      : "bg-light-border text-light-text-secondary dark:bg-dark-border dark:text-dark-text-secondary hover:opacity-80"
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
            {postenMitSumme.length > 0 ? (
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    <th className="text-left py-1 text-light-text-secondary dark:text-dark-text-secondary font-medium">Beschreibung</th>
                    <th className="text-left py-1 text-light-text-secondary dark:text-dark-text-secondary font-medium">Kategorie</th>
                    <th className="text-right py-1 text-light-text-secondary dark:text-dark-text-secondary font-medium">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {postenMitSumme.map((p) => (
                    <tr key={p.id} className="border-b border-light-border/50 dark:border-dark-border/50">
                      <td className="py-1 text-light-text-main dark:text-dark-text-main">{p.beschreibung}</td>
                      <td className="py-1 text-light-text-secondary dark:text-dark-text-secondary">{p.kategorie}</td>
                      <td className="py-1 text-right text-light-text-main dark:text-dark-text-main font-medium">
                        {formatGermanCurrency(p.summe)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="pt-2 font-semibold text-light-text-main dark:text-dark-text-main">
                      Gesamt eigene Kosten
                    </td>
                    <td className="pt-2 text-right font-bold text-light-accent-green dark:text-dark-accent-green">
                      {formatGermanCurrency(eigeneSumme)} €
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">
                Keine Budget-Posten in den ausgewählten Kategorien vorhanden.
              </p>
            )}
          </>
        )}
      </div>

      {angebotNum > 0 && (
        <div className={`${cardBase} ${cardLight} ${cardDark}`}>
          <h2 className="font-semibold text-light-text-main dark:text-dark-text-main mb-4">
            Ergebnis
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-3 rounded-lg text-center ${eigeneGünstiger ? "ring-2 ring-light-accent-green dark:ring-dark-accent-green bg-green-50 dark:bg-green-900/20" : "bg-light-bg dark:bg-dark-bg"}`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Car size={16} className="text-light-accent-green dark:text-dark-accent-green" />
                <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">Eigener Umzug</span>
              </div>
              <p className="text-xl font-bold text-light-accent-green dark:text-dark-accent-green">
                {formatGermanCurrency(eigeneSumme)} €
              </p>
              {eigeneGünstiger && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle size={12} className="text-light-accent-green dark:text-dark-accent-green" />
                  <span className="text-xs text-light-accent-green dark:text-dark-accent-green font-semibold">Günstiger!</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg text-center ${unternehmenGünstiger ? "ring-2 ring-light-accent-purple dark:ring-dark-accent-purple bg-purple-50 dark:bg-purple-900/20" : "bg-light-bg dark:bg-dark-bg"}`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Building size={16} className="text-light-accent-purple dark:text-dark-accent-purple" />
                <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">Umzugsunternehmen</span>
              </div>
              <p className="text-xl font-bold text-light-accent-purple dark:text-dark-accent-purple">
                {formatGermanCurrency(angebotNum)} €
              </p>
              {unternehmenGünstiger && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle size={12} className="text-light-accent-purple dark:text-dark-accent-purple" />
                  <span className="text-xs text-light-accent-purple dark:text-dark-accent-purple font-semibold">Günstiger!</span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg text-center ${differenz > 0 ? "bg-green-50 dark:bg-green-900/20" : differenz < 0 ? "bg-purple-50 dark:bg-purple-900/20" : "bg-light-bg dark:bg-dark-bg"}`}>
            {differenz > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <TrendingDown size={18} className="text-light-accent-green dark:text-dark-accent-green" />
                <p className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  Eigener Umzug spart <span className="text-light-accent-green dark:text-dark-accent-green">{formatGermanCurrency(Math.abs(differenz))} €</span>
                </p>
              </div>
            ) : differenz < 0 ? (
              <div className="flex items-center justify-center gap-2">
                <TrendingUp size={18} className="text-light-accent-purple dark:text-dark-accent-purple" />
                <p className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  Unternehmen spart <span className="text-light-accent-purple dark:text-dark-accent-purple">{formatGermanCurrency(Math.abs(differenz))} €</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Gleiche Kosten</p>
            )}
          </div>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-3 italic">
            Hinweis: Eigene Kosten aus Budget-Posten der ausgewählten Kategorien. Eigene Zeit und Stress sind nicht eingerechnet.
          </p>
        </div>
      )}
    </div>
  );
};

export default KostenVergleich;
