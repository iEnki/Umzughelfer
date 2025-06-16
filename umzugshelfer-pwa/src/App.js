import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  // BrowserRouter as Router, // Entfernt, da nicht mehr direkt hier verwendet
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ThemeProvider } from "./contexts/ThemeContext"; // ThemeProvider importieren

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import KontaktManager from "./components/KontaktManager";
import BudgetTracker from "./components/BudgetTracker"; // Import wieder aktivieren
import TodoListenManager from "./components/TodoListenManager";
import PacklisteManager from "./components/PacklisteManager";
import Materialplaner from "./components/Materialplaner"; // Angepasst
// import BedarfsrechnerFarbe from "./components/BedarfsrechnerFarbe"; // Wird jetzt von BedarfsrechnerPage importiert
import BedarfsrechnerPage from "./components/BedarfsrechnerPage";
import UmzugsplanerSeite from "./components/UmzugsplanerSeite"; // NEU für Umzugsplaner
import HomePage from "./components/LoginPage"; // Umbenannt, da LoginPage jetzt HomePage ist
import RegisterPage from "./components/RegisterPage";
import UmzugsZeitstrahl from "./components/UmzugsZeitstrahl"; // Importiert
import DokumentenManager from "./components/DokumentenManager"; // NEU für Dokumentenablage
import UpdatePasswordPage from "./components/UpdatePasswordPage"; // NEU für Passwort Reset
import TodoListenFeaturePage from "./components/featurepages/TodoListenFeaturePage"; // NEU
import PacklisteFeaturePage from "./components/featurepages/PacklisteFeaturePage"; // NEU
import BudgetTrackerFeaturePage from "./components/featurepages/BudgetTrackerFeaturePage"; // NEU
import KontaktManagerFeaturePage from "./components/featurepages/KontaktManagerFeaturePage"; // NEU
import TransportFeaturePage from "./components/featurepages/TransportFeaturePage"; // NEU
import RenovierungsplanerFeaturePage from "./components/featurepages/RenovierungsplanerFeaturePage"; // NEU
import ZeitstrahlFeaturePage from "./components/featurepages/ZeitstrahlFeaturePage"; // NEU
import KiAssistentenFeaturePage from "./components/featurepages/KiAssistentenFeaturePage"; // NEU
import QrCodeFeaturePage from "./components/featurepages/QrCodeFeaturePage"; // NEU

function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // const currentSession = supabase.auth.getSession(); // Entfernt, da nicht verwendet
    // .then(({ data: { session } }) => { // Alte Methode, getSession ist jetzt synchroner
    //   setSession(session);
    //   setLoadingAuth(false);
    // });
    // Korrektur für Supabase v2: getSession() ist nicht mehr async direkt, aber onAuthStateChange ist besser

    // Initialen Session-Status prüfen
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (_event === "INITIAL_SESSION") {
          setLoadingAuth(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Hilfskomponente für geschützte Routen
  const ProtectedRoute = ({ children }) => {
    if (loadingAuth) {
      return (
        <div className="text-center py-20 text-dark-text-main">
          {" "}
          {/* Dark Theme Textfarbe */} Authentifizierung wird geladen...
        </div>
      ); // Oder ein Spinner
    }
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Hilfskomponente für öffentliche Routen (Login/Register), leitet weiter wenn eingeloggt
  const PublicRoute = ({ children }) => {
    if (loadingAuth) {
      return (
        <div className="text-center py-20 text-dark-text-main">
          {" "}
          {/* Dark Theme Textfarbe */} Authentifizierung wird geladen...
        </div>
      );
    }
    if (session) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <ThemeProvider>
      {" "}
      {/* ThemeProvider umschließt den gesamten App-Inhalt */}
      {/* <Router> wurde entfernt, da es wahrscheinlich in index.js ist */}
      <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg">
        {" "}
        {/* Standard-Hintergrundfarben hier setzen */}
        {session && <Navbar session={session} setSession={setSession} />}{" "}
        {/* Navbar nur anzeigen, wenn eingeloggt */}
        <main className="flex-grow">
          <Routes>
            <Route
              path="/login" // Diese Route dient jetzt als Alias für die Startseite oder kann entfernt werden, wenn / der Einstiegspunkt ist
              element={<HomePage setSession={setSession} />}
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            <Route
              path="/"
              element={
                session ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <HomePage setSession={setSession} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard session={session} />{" "}
                  {/* Dashboard bleibt für /dashboard */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <BudgetTracker session={session} />{" "}
                  {/* BudgetTracker für /budget sicherstellen */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/kontakte"
              element={
                <ProtectedRoute>
                  <KontaktManager session={session} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/todos"
              element={
                <ProtectedRoute>
                  <TodoListenManager session={session} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packliste"
              element={
                <ProtectedRoute>
                  <PacklisteManager session={session} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/materialplaner" // Pfad geändert
              element={
                <ProtectedRoute>
                  <Materialplaner session={session} /> {/* Angepasst */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/bedarfsrechner" // NEUE ROUTE
              element={
                <ProtectedRoute>
                  <BedarfsrechnerPage /> {/* Bleibt für Material-Rechner */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/umzugsplaner" // NEUE ROUTE für Umzugsplaner
              element={
                <ProtectedRoute>
                  <UmzugsplanerSeite />
                </ProtectedRoute>
              }
            />
            <Route
              path="/zeitstrahl"
              element={
                <ProtectedRoute>
                  <UmzugsZeitstrahl session={session} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dokumente"
              element={
                <ProtectedRoute>
                  <DokumentenManager session={session} />
                </ProtectedRoute>
              }
            />

            {/* Fallback für nicht gefundene Routen, optional */}
            <Route
              path="*"
              element={
                <Navigate to={session ? "/dashboard" : "/"} replace /> // Leitet auf die neue HomePage um, wenn nicht eingeloggt
              }
            />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route
              path="/features/todo-listen"
              element={<TodoListenFeaturePage />}
            />
            <Route
              path="/features/packliste"
              element={<PacklisteFeaturePage />}
            />
            <Route
              path="/features/budget-tracker"
              element={<BudgetTrackerFeaturePage />}
            />
            <Route
              path="/features/kontakt-manager"
              element={<KontaktManagerFeaturePage />}
            />
            <Route
              path="/features/transport-planer"
              element={<TransportFeaturePage />}
            />
            <Route
              path="/features/renovierungsplaner"
              element={<RenovierungsplanerFeaturePage />}
            />
            <Route
              path="/features/zeitstrahl"
              element={<ZeitstrahlFeaturePage />}
            />
            <Route
              path="/features/ki-assistenten"
              element={<KiAssistentenFeaturePage />}
            />
            <Route
              path="/features/qr-code-system"
              element={<QrCodeFeaturePage />}
            />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
