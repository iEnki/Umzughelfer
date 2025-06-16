import React, { useState } from "react";
import BedarfsrechnerFarbe from "./BedarfsrechnerFarbe";
import BedarfsrechnerBoden from "./BedarfsrechnerBoden";
import BedarfsrechnerTapete from "./BedarfsrechnerTapete";
import BedarfsrechnerDaemmstoff from "./BedarfsrechnerDaemmstoff"; // NEU
import {
  Calculator,
  PaintBucket,
  Layers,
  Wallpaper,
  ThermometerSnowflake,
} from "lucide-react"; // Icon hinzugefügt
import { useTheme } from "../contexts/ThemeContext"; // Import hinzugefügt

const BedarfsrechnerPage = () => {
  const [activeCalculator, setActiveCalculator] = useState("farbe");
  const { theme } = useTheme(); // Theme holen

  const calculatorTypes = [
    {
      id: "farbe",
      name: "Wandfarbe",
      Icon: PaintBucket,
      lightColor: "text-light-accent-green",
      darkColor: "text-dark-accent-green",
      lightBgActive: "bg-green-100", // Beispiel für aktiven hellen Hintergrund
      darkBgActive: "bg-dark-bg",
    },
    {
      id: "boden",
      name: "Bodenbelag",
      Icon: Layers,
      lightColor: "text-light-accent-purple",
      darkColor: "text-dark-accent-purple",
      lightBgActive: "bg-purple-100",
      darkBgActive: "bg-dark-bg",
    },
    {
      id: "tapete",
      name: "Tapete",
      Icon: Wallpaper,
      lightColor: "text-blue-600", // Helleres Blau für Light Mode
      darkColor: "text-blue-400",
      lightBgActive: "bg-blue-100",
      darkBgActive: "bg-dark-bg",
    },
    {
      id: "daemmstoff",
      name: "Dämmstoff",
      Icon: ThermometerSnowflake,
      lightColor: "text-sky-600", // Helleres Sky für Light Mode
      darkColor: "text-sky-400",
      lightBgActive: "bg-sky-100",
      darkBgActive: "bg-dark-bg",
    },
  ];

  const renderActiveCalculator = () => {
    switch (activeCalculator) {
      case "farbe":
        return <BedarfsrechnerFarbe />;
      case "boden":
        return <BedarfsrechnerBoden />;
      case "tapete":
        return <BedarfsrechnerTapete />;
      case "daemmstoff": // NEU
        return <BedarfsrechnerDaemmstoff />; // NEU
      default:
        return <BedarfsrechnerFarbe />; // Fallback
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-light-text-main dark:text-dark-text-main flex items-center mb-3 sm:mb-0">
          <Calculator
            size={30}
            className="mr-3 text-light-accent-green dark:text-dark-accent-green"
          />
          Bedarfsrechner (Material)
        </h1>
        <div className="flex flex-wrap gap-2 border border-light-border dark:border-dark-border p-1 rounded-lg justify-center">
          {calculatorTypes.map((calc) => {
            const isActive = activeCalculator === calc.id;
            const textColor =
              theme === "dark" ? calc.darkColor : calc.lightColor;
            const activeBg =
              theme === "dark" ? calc.darkBgActive : calc.lightBgActive;

            return (
              <button
                key={calc.id}
                onClick={() => setActiveCalculator(calc.id)}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${
                    isActive
                      ? `${textColor} ${activeBg} shadow-sm`
                      : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border hover:text-light-text-main dark:hover:text-dark-text-main"
                  }`}
              >
                <calc.Icon
                  size={16}
                  className={`mr-2 ${isActive ? textColor : ""}`}
                />{" "}
                {/* Icon Farbe auch anpassen wenn aktiv */}
                {calc.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>{renderActiveCalculator()}</div>
    </div>
  );
};

export default BedarfsrechnerPage;
