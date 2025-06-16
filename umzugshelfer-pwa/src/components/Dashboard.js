import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  ListChecks,
  Paintbrush,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Archive,
  PieChart,
  Zap,
  TrendingUp as GesamtFortschrittIcon,
  // Sun, Moon und useTheme werden hier nicht mehr direkt benötigt
} from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatGermanCurrency } from "../utils/formatUtils"; // Korrekter Import
import { useTheme } from "../contexts/ThemeContext"; // Importieren für Diagrammfarben

ChartJS.register(ArcElement, Tooltip, Legend);

// Farbpaletten für Diagramme
const kategorieFarbenLight = {
  Transport: "rgba(124, 58, 237, 0.7)", // light-accent-purple (Tailwind violet-600)
  Material: "rgba(22, 163, 74, 0.7)", // light-accent-green (Tailwind green-600)
  Verpflegung: "rgba(234, 88, 12, 0.7)", // light-accent-orange (Tailwind orange-600)
  "Neue Möbel": "rgba(124, 58, 237, 0.5)",
  Kaution: "rgba(202, 138, 4, 0.7)", // Tailwind yellow-600
  Makler: "rgba(220, 38, 38, 0.7)", // Tailwind red-600
  Sonstiges: "rgba(107, 114, 128, 0.7)", // Tailwind gray-500
};
const defaultChartColorsLight = [
  "rgba(22, 163, 74, 0.7)",
  "rgba(124, 58, 237, 0.7)",
  "rgba(107, 114, 128, 0.7)",
  "rgba(220, 38, 38, 0.6)",
  "rgba(234, 88, 12, 0.6)",
  "rgba(37, 99, 235, 0.6)", // Tailwind blue-600
];

const kategorieFarbenDark = {
  Transport: "rgba(139, 92, 246, 0.7)",
  Material: "rgba(46, 204, 113, 0.7)",
  Verpflegung: "rgba(249, 115, 22, 0.7)",
  "Neue Möbel": "rgba(139, 92, 246, 0.5)",
  Kaution: "rgba(234, 179, 8, 0.7)",
  Makler: "rgba(239, 68, 68, 0.7)",
  Sonstiges: "rgba(156, 163, 175, 0.7)",
};
const defaultChartColorsDark = [
  "rgba(46, 204, 113, 0.7)",
  "rgba(139, 92, 246, 0.7)",
  "rgba(156, 163, 175, 0.7)",
  "rgba(239, 68, 68, 0.6)",
  "rgba(249, 115, 22, 0.6)",
  "rgba(59, 130, 246, 0.6)",
];

const Dashboard = ({ session }) => {
  const userId = session?.user?.id;
  const { theme } = useTheme(); // Theme holen für Diagrammfarben
  const [kontakteCount, setKontakteCount] = useState(0);
  const [gesamtbudget, setGesamtbudget] = useState(0);
  const [budgetAusgegeben, setBudgetAusgegeben] = useState(0);
  const [todosErledigt, setTodosErledigt] = useState(0);
  const [todosGesamt, setTodosGesamt] = useState(0);
  const [packlisteItemsCount, setPacklisteItemsCount] = useState(0);
  const [kistenGesamtCount, setKistenGesamtCount] = useState(0);
  const [kistenGepacktCount, setKistenGepacktCount] = useState(0);
  const [naechsteDeadlines, setNaechsteDeadlines] = useState([]);
  const [offeneTodosWichtig, setOffeneTodosWichtig] = useState([]);
  const [kostenNachKategorie, setKostenNachKategorie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gesamtFortschrittProzent, setGesamtFortschrittProzent] = useState(0);
  // const { theme, toggleTheme } = useTheme(); // Logik wandert in Navbar

  const fetchData = useCallback(async () => {
    /* ... (Logik bleibt gleich) ... */
    if (!userId) {
      setLoading(false);
      setKontakteCount(0);
      setGesamtbudget(0);
      setBudgetAusgegeben(0);
      setTodosGesamt(0);
      setTodosErledigt(0);
      setPacklisteItemsCount(0);
      setKistenGesamtCount(0);
      setKistenGepacktCount(0);
      setNaechsteDeadlines([]);
      setOffeneTodosWichtig([]);
      setKostenNachKategorie(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { count: kontakteData } = await supabase
        .from("kontakte")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      setKontakteCount(kontakteData || 0);
      const { data: profileData, error: profileError } = await supabase
        .from("user_profile")
        .select("gesamtbudget")
        .eq("id", userId)
        .single();
      if (profileError && profileError.code !== "PGRST116") throw profileError;
      const currentGesamtbudget = profileData?.gesamtbudget || 0;
      setGesamtbudget(currentGesamtbudget);
      const { data: todosDataRes } = await supabase
        .from("todo_aufgaben")
        .select("erledigt, beschreibung, faelligkeitsdatum, prioritaet")
        .eq("user_id", userId);
      setTodosGesamt(todosDataRes?.length || 0);
      setTodosErledigt(
        todosDataRes?.filter((todo) => todo.erledigt).length || 0
      );
      const { data: kistenDataForPackliste, error: kistenError } =
        await supabase
          .from("pack_kisten")
          .select("id, status_kiste, inhalt:pack_gegenstaende(count)")
          .eq("user_id", userId);
      if (kistenError) throw kistenError;
      let totalItems = 0;
      let gepackteKisten = 0;
      if (kistenDataForPackliste) {
        setKistenGesamtCount(kistenDataForPackliste.length);
        kistenDataForPackliste.forEach((kiste) => {
          if (kiste.inhalt && kiste.inhalt.length > 0)
            totalItems += kiste.inhalt[0].count;
          if (kiste.status_kiste === "Gepackt") gepackteKisten++;
        });
      }
      setPacklisteItemsCount(totalItems);
      setKistenGepacktCount(gepackteKisten);
      const heuteString = new Date().toISOString().split("T")[0];
      const { data: deadlineTodos } = await supabase
        .from("todo_aufgaben")
        .select("id, beschreibung, faelligkeitsdatum")
        .eq("user_id", userId)
        .eq("erledigt", false)
        .gte("faelligkeitsdatum", heuteString)
        .order("faelligkeitsdatum", { ascending: true })
        .limit(3);
      const { data: deadlineBudgetsFromDB } = await supabase
        .from("budget_posten")
        .select(
          "id, beschreibung, datum, betrag, teilzahlungen:budget_teilzahlungen(betrag_teilzahlung)"
        )
        .eq("user_id", userId)
        .gte("datum", heuteString)
        .order("datum", { ascending: true })
        .limit(3);
      const deadlines = [];
      (deadlineTodos || []).forEach((item) =>
        deadlines.push({
          id: `todo-${item.id}`,
          beschreibung: item.beschreibung,
          datum: item.faelligkeitsdatum,
          typ: "To-Do",
          link: "/todos",
        })
      );
      (deadlineBudgetsFromDB || []).forEach((item) => {
        const summeBezahlt = item.teilzahlungen.reduce(
          (sum, tz) => sum + tz.betrag_teilzahlung,
          0
        );
        if (item.betrag > summeBezahlt) {
          deadlines.push({
            id: `budget-${item.id}`,
            beschreibung: `${item.beschreibung} (Budget)`,
            datum: item.datum,
            typ: "Zahlung",
            link: "/budget",
          });
        }
      });
      deadlines.sort((a, b) => new Date(a.datum) - new Date(b.datum));
      setNaechsteDeadlines(deadlines.slice(0, 3));
      const offene = (todosDataRes || [])
        .filter((todo) => !todo.erledigt)
        .sort(
          (a, b) =>
            (b.prioritaet === "Hoch" ? 1 : -1) -
              (a.prioritaet === "Hoch" ? 1 : -1) ||
            new Date(a.faelligkeitsdatum) - new Date(b.faelligkeitsdatum)
        )
        .slice(0, 3);
      setOffeneTodosWichtig(offene);
      const { data: alleBudgetPosten, error: budgetPostenError } =
        await supabase
          .from("budget_posten")
          .select(
            "kategorie, teilzahlungen:budget_teilzahlungen(betrag_teilzahlung)"
          )
          .eq("user_id", userId);
      if (budgetPostenError) throw budgetPostenError;
      let totalAusgegebenFürDiagramm = 0;
      const ausgabenProKategorie = {};
      if (alleBudgetPosten) {
        alleBudgetPosten.forEach((posten) => {
          const kategorie = posten.kategorie || "Sonstiges";
          const summePosten = posten.teilzahlungen.reduce(
            (sum, tz) => sum + (parseFloat(tz.betrag_teilzahlung) || 0),
            0
          );
          totalAusgegebenFürDiagramm += summePosten;
          if (summePosten > 0) {
            ausgabenProKategorie[kategorie] =
              (ausgabenProKategorie[kategorie] || 0) + summePosten;
          }
        });
      }
      setBudgetAusgegeben(totalAusgegebenFürDiagramm);
      if (Object.keys(ausgabenProKategorie).length > 0) {
        const labels = Object.keys(ausgabenProKategorie);
        const dataValues = Object.values(ausgabenProKategorie);

        const currentKategorieFarben =
          theme === "dark" ? kategorieFarbenDark : kategorieFarbenLight;
        const currentDefaultColors =
          theme === "dark" ? defaultChartColorsDark : defaultChartColorsLight;

        const backgroundColors = labels.map(
          (label, index) =>
            currentKategorieFarben[label] ||
            currentDefaultColors[index % currentDefaultColors.length]
        );
        const borderColors = backgroundColors.map(
          (color) => color.replace(/0\.[5-7]/, "1") // Ersetzt Opazität wie 0.7, 0.6, 0.5 durch 1
        );
        setKostenNachKategorie({
          labels: labels,
          datasets: [
            {
              label: "Ausgaben nach Kategorie",
              data: dataValues,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        });
      } else {
        setKostenNachKategorie(null);
      }
    } catch (err) {
      console.error("Fehler Dashboard:", err);
      setError("Dashboard nicht geladen.");
    } finally {
      setLoading(false);
    }
  }, [userId, theme]); // 'theme' zur Dependency-Array hinzugefügt

  useEffect(() => {
    if (userId) fetchData();
    else setLoading(false);
    const handleStorageChange = (event) => {
      if (event.key === `umzugsBudgetGesamt_${userId}` && userId) {
        const savedBudget = localStorage.getItem(
          `umzugsBudgetGesamt_${userId}`
        );
        setGesamtbudget(savedBudget ? parseFloat(savedBudget) : 0);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchData, userId]);
  const budgetProzent =
    gesamtbudget > 0 ? (budgetAusgegeben / gesamtbudget) * 100 : 0;
  const todosProzent =
    todosGesamt > 0 ? (todosErledigt / todosGesamt) * 100 : 0;
  const kistenGepacktProzent =
    kistenGesamtCount > 0 ? (kistenGepacktCount / kistenGesamtCount) * 100 : 0;
  useEffect(() => {
    let progressSum = 0;
    let progressCount = 0;
    if (todosGesamt > 0) {
      progressSum += todosProzent;
      progressCount++;
    }
    if (kistenGesamtCount > 0) {
      progressSum += kistenGepacktProzent;
      progressCount++;
    }
    setGesamtFortschrittProzent(
      progressCount > 0 ? Math.round(progressSum / progressCount) : 0
    );
  }, [todosProzent, kistenGepacktProzent, todosGesamt, kistenGesamtCount]);
  const heuteStringFürHinweise = new Date().toISOString().split("T")[0];
  const aufgabenHeuteFaellig = naechsteDeadlines.filter(
    (d) => d.typ === "To-Do" && d.datum === heuteStringFürHinweise
  ).length;
  const budgetWarnungAktiv = gesamtbudget > 0 && budgetProzent >= 80;
  // KachelBasisStyle wird jetzt dynamisch für Hell/Dunkel-Modus sein
  const kachelBasisStyle =
    "p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col self-start bg-light-card-bg dark:bg-dark-card-bg border border-light-border dark:border-dark-border";
  const linkStyle = "block";
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setUTCHours(12);
    const options = { weekday: "short", day: "numeric", month: "short" };
    return date.toLocaleDateString("de-DE", options);
  };

  if (loading)
    return (
      <div className="text-center py-8">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Lade Dashboard...
        </p>
      </div>
    );
  if (error)
    return (
      <div className="text-center py-8 flex flex-col items-center">
        <AlertTriangle size={40} className="text-red-500 mb-2" />
        <p className="text-red-500">{error}</p>{" "}
        {/* Fehlerfarbe kann bleiben oder thematisiert werden */}
        <button
          onClick={fetchData}
          className="mt-3 px-3 py-1.5 bg-light-accent-purple dark:bg-dark-accent-purple text-white dark:text-dark-text-main rounded-md text-sm"
        >
          Erneut versuchen
        </button>
      </div>
    );

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: { color: theme === "dark" ? "#D1D5DB" : "#374151" }, // dark:text-dark-text-main light:text-light-text-main
      },
      tooltip: {
        bodyColor: theme === "dark" ? "#D1D5DB" : "#374151",
        titleColor: theme === "dark" ? "#9CA3AF" : "#6B7280",
        backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF", // dark:bg-dark-card-bg light:bg-light-card-bg
        borderColor: theme === "dark" ? "#374151" : "#E5E7EB", // dark:border-dark-border light:border-light-border
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
              }).format(context.parsed);
            }
            return label;
          },
        },
      },
      title: {
        display: true,
        text: "Ausgaben nach Kategorie",
        font: { size: 13 },
        color: theme === "dark" ? "#D1D5DB" : "#374151", // dark:text-dark-text-main light:text-light-text-main
        padding: { top: 5, bottom: 8 },
      },
    },
    cutout: "65%",
  };

  return (
    <div className="p-3 md:p-4 lg:p-5 space-y-4">
      <div className="bg-light-card-bg dark:bg-dark-card-bg p-4 rounded-lg shadow-md border border-light-border dark:border-dark-border">
        <div className="flex justify-between items-center mb-0.5">
          <h1 className="text-xl md:text-2xl font-bold text-light-text-main dark:text-dark-text-main">
            Willkommen zurück!
          </h1>
          {/* Theme-Umschalter wurde in die Navbar verschoben */}
        </div>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2 text-xs">
          Dein Umzugs-Dashboard im Überblick.
        </p>
        <div>
          <div className="flex justify-between text-xs font-medium text-light-text-main dark:text-dark-text-main mb-0.5">
            <span>Gesamtfortschritt</span>
            <span>{gesamtFortschrittProzent}%</span>
          </div>
          <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-light-accent-green dark:from-dark-accent-green to-light-accent-purple dark:to-dark-accent-purple h-2.5 rounded-full"
              style={{ width: `${gesamtFortschrittProzent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {(budgetWarnungAktiv || aufgabenHeuteFaellig > 0) && (
        <div className="p-3 rounded-lg shadow-md bg-orange-500/10 dark:bg-dark-accent-orange/10 border border-orange-500/30 dark:border-dark-accent-orange/30">
          <div className="flex items-center text-orange-600 dark:text-dark-accent-orange">
            <Zap size={20} className="mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Wichtige Hinweise:</h3>
              <ul className="list-disc list-inside text-xs">
                {budgetWarnungAktiv && (
                  <li>Budget zu {budgetProzent.toFixed(0)}% ausgeschöpft!</li>
                )}
                {aufgabenHeuteFaellig > 0 && (
                  <li>
                    {aufgabenHeuteFaellig} Aufgabe
                    {aufgabenHeuteFaellig > 1 ? "n sind" : " ist"} heute fällig!
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-3">
          {" "}
          {/* Spalte 1 */}
          <Link to="/kontakte" className={linkStyle}>
            <div className={`${kachelBasisStyle}`}>
              <div className="flex items-center text-light-accent-purple dark:text-dark-accent-purple mb-1">
                <Users size={16} className="mr-1.5" />
                <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  Kontakte
                </h2>
              </div>
              <p className="text-lg font-bold text-light-text-main dark:text-dark-text-main">
                {kontakteCount}
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Gespeichert
              </p>
            </div>
          </Link>
          <Link to="/packliste" className={linkStyle}>
            <div className={`${kachelBasisStyle}`}>
              <div className="flex items-center text-light-accent-purple dark:text-dark-accent-purple mb-1">
                <Archive size={16} className="mr-1.5" />
                <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  Kistenstatus
                </h2>
              </div>
              <p className="text-lg font-bold text-light-text-main dark:text-dark-text-main">
                {kistenGepacktCount} / {kistenGesamtCount}
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary -mt-0.5">
                Gepackt
              </p>
              {kistenGesamtCount > 0 && (
                <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-1.5 mt-1">
                  <div
                    className="bg-light-accent-purple dark:bg-dark-accent-purple h-1.5 rounded-full"
                    style={{ width: `${kistenGepacktProzent}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                {packlisteItemsCount} Items
              </p>
            </div>
          </Link>
          <div className={`${kachelBasisStyle} min-h-[150px]`}>
            <div className="flex items-center text-danger-color mb-1">
              {" "}
              {/* danger-color kann bleiben */}
              <CalendarClock size={16} className="mr-1.5" />
              <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                Nächste Deadlines
              </h2>
            </div>
            {naechsteDeadlines.length > 0 ? (
              <ul className="space-y-1 text-xs mt-0.5">
                {naechsteDeadlines.map((item) => (
                  <li
                    key={item.id}
                    className="p-1 bg-red-500/10 rounded hover:bg-red-500/20" // Hintergrund kann bleiben oder angepasst werden
                  >
                    <Link
                      to={item.link}
                      className="flex justify-between items-center text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-main dark:hover:text-dark-text-main"
                    >
                      <span>
                        {item.beschreibung.substring(0, 25)}
                        {item.beschreibung.length > 25 ? "..." : ""}{" "}
                        <span className="text-danger-color">({item.typ})</span>
                      </span>
                      <span className="font-medium text-danger-color whitespace-nowrap">
                        {formatDate(item.datum)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Keine Deadlines.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {" "}
          {/* Spalte 2 */}
          <Link to="/budget" className={linkStyle}>
            <div className={`${kachelBasisStyle}`}>
              <div className="flex items-center text-light-accent-green dark:text-dark-accent-green mb-1">
                <DollarSign size={16} className="mr-1.5" />
                <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  Budget
                </h2>
              </div>
              <p className="text-sm font-bold text-light-text-main dark:text-dark-text-main">
                {formatGermanCurrency(budgetAusgegeben)} € /{" "}
                {formatGermanCurrency(gesamtbudget)} €
              </p>
              <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-1.5 mt-1">
                <div
                  className="bg-light-accent-green dark:bg-dark-accent-green h-1.5 rounded-full"
                  style={{
                    width: `${budgetProzent > 100 ? 100 : budgetProzent}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                {budgetProzent.toFixed(0)}% verbraucht
              </p>
            </div>
          </Link>
          <div className={`${kachelBasisStyle}`}>
            <div className="flex items-center text-light-accent-purple dark:text-dark-accent-purple mb-1">
              <PieChart size={16} className="mr-1.5" />
              <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                Kostenübersicht
              </h2>
            </div>
            <div className="h-36 md:h-40 lg:h-36 relative mt-1">
              {kostenNachKategorie &&
              Object.keys(kostenNachKategorie.labels).length > 0 ? (
                <Doughnut
                  data={kostenNachKategorie}
                  options={doughnutOptions}
                />
              ) : (
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center mt-8 pt-4">
                  Keine Ausgaben.
                </p>
              )}
            </div>
          </div>
          <div className={`${kachelBasisStyle}`}>
            <div className="flex items-center text-light-accent-purple dark:text-dark-accent-purple mb-1">
              <GesamtFortschrittIcon size={16} className="mr-1.5" />
              <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                Umzugsfortschritt
              </h2>
            </div>
            <p className="text-lg font-bold text-light-text-main dark:text-dark-text-main">
              {gesamtFortschrittProzent}%
            </p>
            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-light-accent-green dark:from-dark-accent-green to-light-accent-purple dark:to-dark-accent-purple h-2 rounded-full"
                style={{ width: `${gesamtFortschrittProzent}%` }}
              ></div>
            </div>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
              Aufgaben & Kisten
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {" "}
          {/* Spalte 3 */}
          <Link to="/todos" className={linkStyle}>
            <div className={`${kachelBasisStyle}`}>
              <div className="flex items-center text-light-accent-orange dark:text-dark-accent-orange mb-1">
                <ListChecks size={16} className="mr-1.5" />
                <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  To-Do Status
                </h2>
              </div>
              <p className="text-lg font-bold text-light-text-main dark:text-dark-text-main">
                {todosErledigt} / {todosGesamt}
              </p>
              <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-1.5 mt-1">
                <div
                  className="bg-light-accent-orange dark:bg-dark-accent-orange h-1.5 rounded-full"
                  style={{ width: `${todosProzent}%` }}
                ></div>
              </div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                {todosProzent.toFixed(0)}% erledigt
              </p>
            </div>
          </Link>
          <div className={`${kachelBasisStyle} min-h-[150px]`}>
            <div className="flex items-center text-light-accent-orange dark:text-dark-accent-orange mb-1">
              <ClipboardList size={16} className="mr-1.5" />
              <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                Wichtige Aufgaben
              </h2>
            </div>
            {offeneTodosWichtig.length > 0 ? (
              <ul className="space-y-1 text-xs mt-0.5">
                {offeneTodosWichtig.map((todo) => (
                  <li
                    key={todo.id}
                    className="p-1 bg-orange-500/10 dark:bg-dark-accent-orange/10 rounded hover:bg-orange-500/20 dark:hover:bg-dark-accent-orange/20"
                  >
                    <Link
                      to="/todos"
                      className="flex justify-between items-center text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-main dark:hover:text-dark-text-main"
                    >
                      <span>
                        {todo.beschreibung.substring(0, 25)}
                        {todo.beschreibung.length > 25 ? "..." : ""}{" "}
                        {todo.prioritaet === "Hoch" && (
                          <span className="text-red-500 font-bold">
                            (Hoch!)
                          </span>
                        )}
                      </span>
                      {todo.faelligkeitsdatum && (
                        <span className="text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
                          {formatDate(todo.faelligkeitsdatum)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Alle wichtigen To-Dos erledigt!
              </p>
            )}
          </div>
          <Link to="/renovierung" className={linkStyle}>
            <div className={`${kachelBasisStyle}`}>
              <div className="flex items-center text-light-accent-green dark:text-dark-accent-green mb-1">
                <Paintbrush size={16} className="mr-1.5" />
                <h2 className="text-sm font-semibold text-light-text-main dark:text-dark-text-main">
                  Renovierung
                </h2>
              </div>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs mt-1">
                Status: Planung
              </p>
              <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-1.5 mt-1">
                <div
                  className="bg-light-accent-green dark:bg-dark-accent-green h-1.5 rounded-full"
                  style={{ width: "30%" }}
                ></div>
              </div>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                30% erledigt
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
