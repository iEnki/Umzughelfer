/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Dark Mode basierend auf Klasse aktivieren
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  safelist: [
    "bg-blue-500/30",
    "text-blue-300",
    "bg-indigo-500/30",
    "text-indigo-300",
    "bg-green-500/30",
    "text-green-300",
    "bg-pink-500/30",
    "text-pink-300",
    "bg-purple-500/30",
    "text-purple-300",
    "bg-yellow-500/30",
    "text-yellow-300",
    "bg-amber-500/40",
    "text-amber-200",
    "bg-teal-500/30",
    "text-teal-300",
    "bg-red-500/30",
    "text-red-300",
    "bg-orange-500/30",
    "text-orange-300",
    "bg-lime-500/30",
    "text-lime-300",
    "bg-sky-600/40",
    "text-sky-200",
    // Füge hier bei Bedarf weitere Klassen hinzu, die dynamisch generiert werden
  ],
  theme: {
    extend: {
      colors: {
        primary: "#27ae60", // Behalten wir vorerst, könnte durch ui-accent-mint ersetzt werden
        "primary-dark": "#229954",
        secondary: "#2c3e50", // Ähnlich zu ui-contrast-blue
        accent: "#2ecc71", // Identisch zu ui-accent-mint
        "neutral-light": "#ecf0f1",
        "neutral-medium": "#bdc3c7",
        "neutral-dark": "#95a5a6",
        "card-background": "#ffffff", // Wird durch ui-card-bg ersetzt
        "text-color": "#2c3e50", // Wird durch ui-text-main ersetzt
        "text-color-light": "#7f8c8d", // Wird durch ui-icon-text-light ersetzt
        "danger-color": "#e74c3c",
        "danger-color-dark": "#c0392b",
        "info-blue": "#3498db",
        "prio-high": "#e74c3c",
        "prio-medium": "#f39c12",
        "prio-low": "#3498db",
        "orange-500": "#f39c12",
        "red-700": "#c0392b",
        "green-500": "#27ae60", // Wird durch dark-accent-green abgedeckt

        // Dark Theme Farbpalette
        "dark-bg": "#111827", // Tailwind gray-900
        "dark-card-bg": "#1f2937", // Tailwind gray-800
        "dark-text-main": "#e5e7eb", // Tailwind gray-200
        "dark-text-secondary": "#9ca3af", // Tailwind gray-400
        "dark-accent-green": "#2ecc71", // Behält das Mintgrün
        "dark-accent-purple": "#8b5cf6", // Tailwind purple-500
        "dark-accent-orange": "#f97316", // Tailwind orange-500
        "dark-border": "#374151", // Tailwind gray-700

        // Helle Theme Farbpalette (Standard)
        // Diese werden verwendet, wenn die 'dark' Klasse NICHT auf dem HTML-Element gesetzt ist.
        // Wir definieren sie hier explizit für Klarheit, auch wenn einige Tailwind-Standardfarben ähneln.
        "light-bg": "#f9fafb", // Tailwind gray-50
        "light-card-bg": "#ffffff", // Tailwind white
        "light-text-main": "#1f2937", // Tailwind gray-800
        "light-text-secondary": "#6b7280", // Tailwind gray-500
        "light-accent-green": "#10b981", // Tailwind emerald-500 (etwas gedämpfter als das dunkle Mint)
        "light-accent-purple": "#8b5cf6", // Tailwind violet-500 (kann gleich bleiben oder heller)
        "light-accent-orange": "#f59e0b", // Tailwind amber-500 (etwas gedämpfter)
        "light-border": "#d1d5db", // Tailwind gray-300
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 6px 16px rgba(0, 0, 0, 0.12)",
        button: "0 2px 8px rgba(0,0,0,0.1)",
      },
      animation: {
        // Animation hier definieren
        "pulse-once": "pulse-once 1s ease-out forwards", // 'forwards' hält den Endzustand
      },
      keyframes: {
        // Keyframes hier definieren
        "pulse-once": {
          "0%": { opacity: "0.5", transform: "scale(0.95)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
