import React, { useState } from "react";
import { Link } from "react-router-dom";
import LoginForm from "./LoginForm"; // Importiere die neue LoginForm Komponente
import { useTheme } from "../contexts/ThemeContext"; // useTheme importieren
import { Sun, Moon } from "lucide-react"; // Sun und Moon Icons importieren

// Icons für Feature-Sektion (Beispiele)
import {
  ListChecks,
  Package,
  DollarSign,
  Users,
  Palette,
  CalendarClock,
  Truck,
  BrainCircuit,
  QrCode, // Hinzugefügt
} from "lucide-react";

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow-lg border border-light-border dark:border-dark-border hover:shadow-light-accent-green/20 dark:hover:shadow-dark-accent-green/20 transition-shadow">
    <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-full bg-light-accent-green text-light-bg dark:bg-dark-accent-green dark:text-dark-bg">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-light-text-main dark:text-dark-text-main">
      {title}
    </h3>
    <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
      {description}
    </p>
  </div>
);

const HomePage = ({ setSession }) => {
  // Umbenannt zu HomePage, da es jetzt die Startseite ist
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { theme, toggleTheme } = useTheme(); // Theme-Zustand und Umschaltfunktion

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Navigation zum Dashboard geschieht innerhalb von LoginForm
  };

  return (
    // Die Haupt-Hintergrundfarbe wird von App.js (bg-light-bg dark:bg-dark-bg) übernommen.
    // Textfarbe wird hier für den gesamten HomePage-Kontext gesetzt.
    <div className="text-light-text-main dark:text-dark-text-main min-h-screen">
      {/* Navbar Placeholder - kann später durch die existierende Navbar ersetzt werden */}
      <nav className="bg-light-bg dark:bg-dark-bg shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-light-accent-green dark:text-dark-accent-green hover:opacity-80"
          >
            Umzugsplaner
          </Link>
          {/* Angepasster Container für die Buttons */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 items-center">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto bg-light-accent-green text-white dark:bg-dark-accent-green dark:text-dark-bg font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-colors text-sm"
            >
              Anmelden
            </button>
            <Link
              to="/register"
              className="w-full sm:w-auto bg-light-border text-light-text-main dark:bg-dark-border dark:text-dark-text-main font-semibold py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm text-center block"
            >
              Registrieren
            </Link>
            {/* Theme-Umschalter */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary transition-colors ml-0 sm:ml-2 mt-2 sm:mt-0"
              title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-light-card-bg/80 dark:bg-dark-card-bg/50 py-20 px-6 text-center border-b border-light-border dark:border-dark-border">
        <div className="container mx-auto">
          <h1 className="text-5xl font-extrabold text-light-text-main dark:text-dark-text-main mb-4">
            Dein smarter{" "}
            <span className="text-light-accent-green dark:text-dark-accent-green">
              Umzugsplaner
            </span>
          </h1>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary mb-8 max-w-2xl mx-auto">
            Plane, organisiere und meistere deinen Umzug stressfrei – alles an
            einem Ort. Von intelligenten Packlisten bis zur Budgetverwaltung.
          </p>
          <button
            onClick={() => setShowLoginModal(true)} // Oder Link zu /register
            className="bg-light-accent-green text-white dark:bg-dark-accent-green dark:text-dark-bg font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-transform transform hover:scale-105 shadow-lg"
          >
            Jetzt loslegen
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-light-text-main dark:text-dark-text-main mb-12">
            Alles was du für deinen Umzug brauchst
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link to="/features/todo-listen" className="no-underline">
              <FeatureCard
                icon={<ListChecks size={24} />}
                title="Smarte To-Do Listen"
                description="Behalte den Überblick über alle Aufgaben. Automatische Kategorisierung und Priorisierung helfen dir dabei."
              />
            </Link>
            <Link to="/features/packliste" className="no-underline">
              <FeatureCard
                icon={<Package size={24} />}
                title="Intelligente Packlisten"
                description="Organisiere dein Hab und Gut. Mit QR-Codes, Fotos und KI-Unterstützung für schnelles Finden."
              />
            </Link>
            <Link to="/features/budget-tracker" className="no-underline">
              <FeatureCard
                icon={<DollarSign size={24} />}
                title="Budget Tracker"
                description="Verwalte deine Umzugskosten. Behalte Einnahmen und Ausgaben im Blick und vermeide böse Überraschungen."
              />
            </Link>
            <Link to="/features/kontakt-manager" className="no-underline">
              <FeatureCard
                icon={<Users size={24} />}
                title="Kontakt Manager"
                description="Speichere wichtige Kontakte – von Helfern bis zu Handwerkern – alles an einem zentralen Ort."
              />
            </Link>
            <Link to="/features/transport-planer" className="no-underline">
              <FeatureCard
                icon={<Truck size={24} />}
                title="Transport & Volumen Planer"
                description="Berechne das benötigte Ladevolumen und die Transportkosten für deinen Umzug."
              />
            </Link>
            <Link to="/features/renovierungsplaner" className="no-underline">
              <FeatureCard
                icon={<Palette size={24} />}
                title="Renovierungsplaner"
                description="Plane Material und Kosten für Renovierungsarbeiten wie Streichen, Tapezieren oder Bodenlegen."
              />
            </Link>
            <Link to="/features/zeitstrahl" className="no-underline">
              <FeatureCard
                icon={<CalendarClock size={24} />}
                title="Umzugs-Zeitstrahl"
                description="Visualisiere deinen Umzugsprozess und verpasse keine wichtigen Fristen mehr."
              />
            </Link>
            <Link to="/features/ki-assistenten" className="no-underline">
              <FeatureCard
                icon={<BrainCircuit size={24} />}
                title="KI-Assistenten"
                description="Lass dir von unseren intelligenten Assistenten beim Erstellen von Pack- und To-Do-Listen helfen."
              />
            </Link>
            <Link to="/features/qr-code-system" className="no-underline">
              <FeatureCard
                icon={<QrCode size={24} />}
                title="QR-Code System"
                description="Generiere und scanne QR-Codes für deine Kisten, um den Inhalt schnell zu identifizieren."
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-light-card-bg/80 dark:bg-dark-card-bg/50 py-16 px-6 text-center border-t border-light-border dark:border-dark-border">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-light-text-main dark:text-dark-text-main mb-6">
            Bereit für einen stressfreien Umzug?
          </h2>
          <Link
            to="/register"
            className="bg-light-accent-green text-white dark:bg-dark-accent-green dark:text-dark-bg font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-transform transform hover:scale-105 shadow-lg"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="bg-light-bg dark:bg-dark-bg py-8 text-center text-light-text-secondary dark:text-dark-text-secondary text-sm border-t border-light-border dark:border-dark-border">
        <p>
          &copy; {new Date().getFullYear()} Umzugsplaner. Alle Rechte
          vorbehalten.
        </p>
        <p className="mt-1">Entwickelt mit ❤️ für einen einfacheren Umzug.</p>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* LoginForm wird hier gerendert, wenn das Modal sichtbar ist */}
          <LoginForm
            setSession={setSession}
            onLoginSuccess={handleLoginSuccess}
            closeLoginModal={() => setShowLoginModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default HomePage; // Umbenannt zu HomePage
