import React, { useState } from "react";
import {
  LayoutDashboard, Users, DollarSign, ListChecks, Archive,
  Paintbrush, Calculator, CalendarClock, FolderOpen,
  Package, ShoppingCart, Wrench, CheckSquare, ShoppingBag,
  Search, BookOpen, History, LogOut, Truck, Home,
  Menu, X,
} from "lucide-react";

// ── Nav-Gruppen Umzugsmodus ─────────────────────────────────────────────────────
const umzugGruppen = [
  {
    label: null,
    items: [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Planung",
    items: [
      { name: "Kontakte",    path: "/kontakte",  icon: Users },
      { name: "Budget",      path: "/budget",    icon: DollarSign },
      { name: "To-Dos",      path: "/todos",     icon: ListChecks },
      { name: "Packliste",   path: "/packliste", icon: Archive },
    ],
  },
  {
    label: "Werkzeuge",
    items: [
      { name: "Materialplaner",  path: "/materialplaner",  icon: Paintbrush },
      { name: "Bedarfsrechner",  path: "/bedarfsrechner",  icon: Calculator },
      { name: "Zeitstrahl",      path: "/zeitstrahl",      icon: CalendarClock },
      { name: "Dokumente",       path: "/dokumente",       icon: FolderOpen },
    ],
  },
];

// ── Nav-Gruppen Home Organizer ──────────────────────────────────────────────────
const homeGruppen = [
  {
    label: null,
    items: [{ name: "Home", path: "/home", icon: LayoutDashboard }],
  },
  {
    label: "Haushalt",
    items: [
      { name: "Inventar",  path: "/home/inventar",  icon: Package },
      { name: "Vorräte",   path: "/home/vorraete",  icon: ShoppingCart },
      { name: "Geräte",    path: "/home/geraete",   icon: Wrench },
    ],
  },
  {
    label: "Aktionen",
    items: [
      { name: "Einkauf",   path: "/home/einkaufliste", icon: ShoppingBag },
      { name: "Aufgaben",  path: "/home/aufgaben",     icon: CheckSquare },
      { name: "Projekte",  path: "/home/projekte",     icon: FolderOpen },
    ],
  },
  {
    label: "Mehr",
    items: [
      { name: "Budget",   path: "/home/budget",   icon: DollarSign },
      { name: "Suche",    path: "/home/suche",    icon: Search },
      { name: "Wissen",   path: "/home/wissen",   icon: BookOpen },
      { name: "Verlauf",  path: "/home/verlauf",  icon: History },
    ],
  },
];

// ── Sidebar ─────────────────────────────────────────────────────────────────────
const Sidebar = ({ activeRoute, onNavigate, onLogout, appMode, onToggleMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const gruppen  = appMode === "home" ? homeGruppen : umzugGruppen;
  const LogoIcon = appMode === "home" ? Home : Truck;

  // Eine Route ist aktiv, wenn sie exakt übereinstimmt (für /home, /dashboard)
  // oder der activeRoute mit dem Pfad beginnt (für alle anderen).
  const isActive = (path) => {
    if (path === "/home")      return activeRoute === "/home";
    if (path === "/dashboard") return activeRoute === "/dashboard";
    return activeRoute.startsWith(path);
  };

  const handleNavigate = (path) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  // ── Gemeinsamer Inhalt für Desktop und Mobile ─────────────────────────────────
  const NavContent = () => (
    <div className="flex flex-col items-center h-full py-4 gap-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
      {/* Logo / Modus-Toggle-Tile */}
      <button
        onClick={onToggleMode}
        title={appMode === "home" ? "Zum Umzugsplaner wechseln" : "Zum Home Organizer wechseln"}
        className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center
                   shadow-glow-primary mb-3 shrink-0 hover:bg-primary-600
                   transition-all duration-200 active:scale-95"
      >
        <LogoIcon size={22} className="text-white" />
      </button>

      {/* Nav-Gruppen */}
      {gruppen.map((gruppe, gi) => (
        <React.Fragment key={gi}>
          {gruppe.label && (
            <div className="w-8 h-px bg-dark-border/60 my-1 shrink-0" />
          )}
          {gruppe.items.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                title={item.name}
                onClick={() => handleNavigate(item.path)}
                className={`w-12 h-12 rounded-sidebar-tile flex items-center justify-center
                            transition-all duration-200 shrink-0
                            ${active
                              ? "bg-canvas-4 border border-primary-500/30 shadow-sidebar-active text-primary-400"
                              : "border border-transparent text-dark-text-secondary hover:bg-canvas-3 hover:text-dark-text-main"
                            }`}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </React.Fragment>
      ))}

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Logout — pinned to bottom */}
      <button
        onClick={onLogout}
        title="Ausloggen"
        className="w-12 h-12 rounded-sidebar-tile flex items-center justify-center
                   border border-transparent text-dark-text-secondary
                   hover:bg-canvas-3 hover:text-accent-danger
                   transition-all duration-200 shrink-0"
      >
        <LogOut size={20} />
      </button>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-20 flex-col
                        bg-canvas-1 border-r border-dark-border">
        <NavContent />
      </aside>

      {/* ── Mobile Hamburger Trigger ───────────────────────────────────────────── */}
      <button
        className="fixed top-4 left-4 z-[60] lg:hidden w-10 h-10 rounded-sidebar-tile
                   bg-canvas-2 border border-dark-border text-dark-text-secondary
                   flex items-center justify-center shadow-elevation-1
                   hover:bg-canvas-3 transition-all duration-150"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menü öffnen/schließen"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Mobile Overlay ────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-canvas-0/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-20 flex-col
                    bg-canvas-1 border-r border-dark-border
                    transition-transform duration-[250ms] ease-in-out
                    lg:hidden
                    ${mobileOpen ? "flex translate-x-0" : "flex -translate-x-full"}`}
      >
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
