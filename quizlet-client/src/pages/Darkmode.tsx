import React, { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { applyTheme, getTheme, Theme } from "../helper/preferences";

const options: { value: Theme; label: string }[] = [
  { value: "light", label: "Light ☀️" },
  { value: "dark", label: "Dark 🌙" },
];

const Darkmode = () => {
  const [theme, setTheme] = useState<Theme>(getTheme);

  const choose = (value: Theme) => {
    applyTheme(value);
    setTheme(value);
  };

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-extrabold text-blue-200 uppercase">
          Appearance
        </h1>
        <div className="p-6 bg-blue-100 border-4 border-blue-200">
          <p className="mb-6 font-bold text-blue-950">
            Current theme: {theme === "dark" ? "Dark" : "Light"}
          </p>
          <div className="flex justify-center gap-4">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => choose(o.value)}
                aria-pressed={theme === o.value}
                className={`px-6 py-3 text-xl font-extrabold shadow-lg transition duration-300 text-blue-950 hover:bg-yellow-600 ${
                  theme === o.value
                    ? "bg-yellow-600 ring-4 ring-blue-950"
                    : "bg-blue-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Darkmode;
