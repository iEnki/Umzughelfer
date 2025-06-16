import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Menu, X, LogOut, Sun, Moon } from "lucide-react"; // Sun und Moon importieren
import styles from "./Navbar.module.css";
import { useTheme } from "../contexts/ThemeContext"; // useTheme importieren

const Navbar = ({ session, setSession }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // Theme-Zustand und Umschaltfunktion

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    setIsOpen(false);
    const { error } = await supabase.auth.signOut();

    // Logge den Fehler, falls vorhanden
    if (error) {
      console.error("Error logging out:", error.message);
      // Auch wenn ein Fehler auftritt (z.B. "Auth session missing!"),
      // wollen wir die clientseitige Session bereinigen und navigieren.
    }

    // Diese Aktionen sollten immer ausgeführt werden, um den Client-Zustand zu bereinigen.
    if (setSession) {
      setSession(null);
    }
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Kontakte", path: "/kontakte" },
    { name: "Budget", path: "/budget" },
    { name: "To-Dos", path: "/todos" },
    { name: "Packliste", path: "/packliste" },
    { name: "Materialplaner", path: "/materialplaner" },
    { name: "Bedarfsrechner", path: "/bedarfsrechner" }, // Behält Materialrechner
    { name: "Umzugsplaner", path: "/umzugsplaner" }, // NEUER LINK für Volumen, Transport etc.
    { name: "Zeitstrahl", path: "/zeitstrahl" },
    { name: "Dokumente", path: "/dokumente" }, // NEUER LINK für Dokumentenablage
  ];

  // Hilfsfunktion für Desktop NavLink Klassen
  const getDesktopNavLinkClasses = ({ isActive }) => {
    const baseClasses = [
      styles.navLink,
      "px-3",
      "py-2",
      "rounded-md",
      "text-sm",
      "font-medium",
      "transition-colors",
    ];
    if (isActive) {
      // Hell: text-light-accent-green, Dunkel: text-dark-accent-green
      baseClasses.push(
        styles.activeNavLink,
        "text-light-accent-green",
        "dark:text-dark-accent-green"
      );
    } else {
      baseClasses.push(
        styles.inactiveNavLink,
        "text-light-text-secondary", // Hellmodus Text
        "dark:text-dark-text-secondary", // Dunkelmodus Text
        "hover:text-light-text-main", // Hellmodus Hover
        "dark:hover:text-dark-text-main" // Dunkelmodus Hover
      );
    }
    return baseClasses.join(" ");
  };

  // Hilfsfunktion für Mobile NavLink Klassen
  const getMobileNavLinkClasses = ({ isActive }) => {
    const baseClasses = [
      styles.navLink,
      "block",
      "px-3",
      "py-2",
      "rounded-md",
      "text-base",
      "font-medium",
      "w-full",
      "text-center",
      "transition-colors",
    ];
    if (isActive) {
      // Hell: text-light-accent-green, Dunkel: text-dark-accent-green
      baseClasses.push(
        styles.activeNavLink,
        "text-light-accent-green",
        "dark:text-dark-accent-green"
      );
    } else {
      baseClasses.push(
        styles.inactiveNavLink,
        "text-light-text-secondary", // Hellmodus Text
        "dark:text-dark-text-secondary", // Dunkelmodus Text
        "hover:text-light-text-main", // Hellmodus Hover
        "dark:hover:text-dark-text-main" // Dunkelmodus Hover
      );
    }
    return baseClasses.join(" ");
  };

  return (
    <nav
      className={`${styles.navbar} bg-light-card-bg dark:bg-dark-card-bg sticky top-0 z-40 shadow-md`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        {/* Linker Bereich: Logout-Button und App-Name */}
        <div className="flex items-center">
          {session && (
            <button
              onClick={handleLogout}
              className={`${styles.navLink} ${styles.inactiveNavLink} text-light-text-secondary dark:text-dark-text-secondary hover:text-danger-color p-2 rounded-md text-sm font-medium transition-colors flex items-center mr-2 sm:mr-4`}
              title="Ausloggen"
            >
              <LogOut size={22} />
            </button>
          )}
          <NavLink
            to={session ? "/dashboard" : "/login"}
            className="text-xl sm:text-2xl font-bold text-light-accent-green dark:text-dark-accent-green hover:opacity-80 transition-colors whitespace-nowrap"
          >
            Umzugplaner
          </NavLink>
        </div>

        {/* Rechter Bereich: Desktop-Navigation oder Mobile Burger-Menü */}
        <div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)} // Schließt mobiles Menü, falls offen
                className={getDesktopNavLinkClasses}
              >
                {item.name}
              </NavLink>
            ))}
            {/* Theme-Umschalter für Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary transition-colors ml-2"
              title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Logout-Button für Desktop ist jetzt links, hier nicht mehr nötig */}
          </div>

          {/* Mobile Burger Menu Button */}
          {session && ( // Burger-Menü nur anzeigen, wenn eingeloggt (da NavItems nur für eingeloggte User sind)
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className={`${styles.menuButton} text-light-text-main dark:text-dark-text-main p-2`}
                aria-label="Menü öffnen/schließen"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ausklappbares Mobile Menü */}
      {session && isOpen && (
        <div className="md:hidden bg-light-card-bg dark:bg-dark-card-bg absolute w-full shadow-lg pb-4 z-50">
          {" "}
          {/* Nur auf md:hidden */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={toggleMenu}
                className={getMobileNavLinkClasses}
              >
                {item.name}
              </NavLink>
            ))}
            {/* Theme-Umschalter für Mobile */}
            <button
              onClick={() => {
                toggleTheme();
                toggleMenu(); // Menü nach Klick schließen
              }}
              className="w-full flex items-center justify-center px-3 py-2 rounded-md text-base font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-main dark:hover:text-dark-text-main hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
            >
              {theme === "dark" ? (
                <Sun size={20} className="mr-2" />
              ) : (
                <Moon size={20} className="mr-2" />
              )}
              <span>{theme === "dark" ? "Hell" : "Dunkel"}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
