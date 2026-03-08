import React, { useState, useRef, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import ThemeSwitch from "../ThemeSwitch";

/**
 * Premium Topbar — sticky, glassmorphism, Suche + User-Avatar + ThemeSwitch.
 *
 * Props:
 *  pageTitle          – Aktueller Seitentitel (aus ROUTE_TITLES)
 *  session            – Supabase-Session (für E-Mail / Name / Initiale)
 *  searchValue        – Kontrollierter Suchwert (State liegt in App.js)
 *  onSuche            – Handler für Sucheingabe (val: string)
 *  searchResults      – Array von { modul, text, sub, link }
 *  onSearchResultClick– Handler bei Klick auf Suchergebnis (link: string)
 */
const Topbar = ({
  pageTitle,
  session,
  searchValue,
  onSuche,
  searchResults,
  onSearchResultClick,
}) => {
  const [suchOffen, setSuchOffen] = useState(false);
  const suchContainerRef = useRef(null);

  const email   = session?.user?.email || "";
  const name    = session?.user?.user_metadata?.full_name || email.split("@")[0] || "Nutzer";
  const initiale = name.charAt(0).toUpperCase();

  // Dropdown öffnen/schließen basierend auf Ergebnissen
  useEffect(() => {
    setSuchOffen(searchResults.length > 0 && searchValue.length >= 2);
  }, [searchResults, searchValue]);

  // Click-Outside schließt Dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suchContainerRef.current && !suchContainerRef.current.contains(e.target)) {
        setSuchOffen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    onSuche(e.target.value);
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-4 pl-14 pr-4 sm:pr-6 lg:pl-6 h-[72px]
                 bg-light-surface-1/80 dark:bg-canvas-2/80 backdrop-blur-md
                 border-b border-light-border dark:border-dark-border shrink-0"
    >
      {/* Seitentitel */}
      <h1 className="text-xl font-semibold text-light-text-main dark:text-dark-text-main
                     shrink-0 hidden sm:block truncate">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Suchfeld (md+) */}
      <div
        className="relative hidden md:flex items-center max-w-[380px] w-full"
        ref={suchContainerRef}
      >
        <Search
          size={15}
          className="absolute left-3 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none z-10"
        />
        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          onFocus={() => searchResults.length > 0 && setSuchOffen(true)}
          placeholder="Suchen… (⌘K)"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-pill
                     bg-light-bg dark:bg-canvas-1
                     border border-light-border dark:border-dark-border
                     text-light-text-main dark:text-dark-text-main
                     placeholder-light-text-secondary dark:placeholder-dark-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-secondary-500
                     transition-all duration-150"
        />

        {/* Suchergebnisse-Dropdown */}
        {suchOffen && searchResults.length > 0 && (
          <div
            className="absolute top-full mt-1 w-full rounded-card-sm
                       bg-light-card-bg dark:bg-canvas-3
                       border border-light-border dark:border-dark-border
                       shadow-elevation-2 z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {searchResults.map((r, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSearchResultClick(r.link);
                  setSuchOffen(false);
                }}
                className="w-full text-left px-3 py-2.5
                           hover:bg-light-surface-1 dark:hover:bg-canvas-4
                           flex items-start gap-2.5
                           border-b border-light-border/50 dark:border-dark-border/50 last:border-0
                           transition-colors duration-100"
              >
                <span
                  className="text-xs px-1.5 py-0.5 rounded
                             bg-primary-500/10 text-primary-600 dark:text-primary-400
                             font-medium flex-shrink-0 mt-0.5 whitespace-nowrap"
                >
                  {r.modul}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-light-text-main dark:text-dark-text-main truncate">
                    {r.text}
                  </p>
                  {r.sub && (
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
                      {r.sub}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rechte Aktionsgruppe */}
      <div className="flex items-center gap-2 ml-2">
        <ThemeSwitch />

        {/* Benachrichtigungs-Button */}
        <button
          className="w-10 h-10 rounded-sidebar-tile flex items-center justify-center
                     bg-light-surface-1 dark:bg-canvas-3
                     border border-light-border dark:border-dark-border
                     text-light-text-secondary dark:text-dark-text-secondary
                     hover:bg-light-hover dark:hover:bg-canvas-4
                     transition-all duration-150"
          title="Benachrichtigungen"
        >
          <Bell size={18} />
        </button>

        {/* User-Avatar + Name/E-Mail (md+) */}
        <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-light-border dark:border-dark-border ml-1">
          <div
            className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center
                       text-white text-sm font-semibold shadow-glow-primary shrink-0"
          >
            {initiale}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-light-text-main dark:text-dark-text-main leading-none">
              {name}
            </p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5 truncate max-w-[140px]">
              {email}
            </p>
          </div>
        </div>

        {/* Nur Avatar auf Mobile */}
        <div
          className="md:hidden w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center
                     text-white text-sm font-semibold shrink-0"
        >
          {initiale}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
