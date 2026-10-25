import React, { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../context/useAuth";
import { getStudyPrefs, saveStudyPrefs, StudyPrefs } from "../helper/preferences";
import { Difficulty } from "../models/Study";

const inputClass =
  "w-full p-2 font-bold bg-white border-4 border-blue-200 text-blue-950 focus:outline-none focus:border-yellow-600";

const Settings = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<StudyPrefs>(getStudyPrefs);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudyPrefs({
      ...prefs,
      defaultCount: Math.min(40, Math.max(1, Number(prefs.defaultCount) || 1)),
    });
    setSaved(true);
  };

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-extrabold text-blue-200 uppercase">
          Settings
        </h1>

        <section className="p-6 mb-8 text-left bg-blue-100 border-4 border-blue-200">
          <h2 className="mb-4 text-2xl font-extrabold text-blue-950">Account</h2>
          <p className="text-blue-950">
            <span className="font-bold">Name:</span>{" "}
            {user ? `${user.firstname} ${user.lastname}` : "—"}
          </p>
          <p className="text-blue-950">
            <span className="font-bold">Username:</span> {user?.username ?? "—"}
          </p>
          <p className="text-blue-950">
            <span className="font-bold">Role:</span> {user?.role ?? "—"}
          </p>
        </section>

        <form
          onSubmit={handleSave}
          className="p-6 space-y-4 text-left bg-blue-100 border-4 border-blue-200"
        >
          <h2 className="text-2xl font-extrabold text-blue-950">
            Study defaults
          </h2>
          <label className="block">
            <span className="font-bold text-blue-950">Flashcards per set (1–40)</span>
            <input
              type="number"
              min={1}
              max={40}
              className={inputClass}
              value={prefs.defaultCount}
              onChange={(e) => {
                setSaved(false);
                setPrefs({ ...prefs, defaultCount: Number(e.target.value) });
              }}
            />
          </label>
          <label className="block">
            <span className="font-bold text-blue-950">Default difficulty</span>
            <select
              className={inputClass}
              value={prefs.defaultDifficulty}
              onChange={(e) => {
                setSaved(false);
                setPrefs({
                  ...prefs,
                  defaultDifficulty: e.target.value as Difficulty,
                });
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="px-6 py-2 font-extrabold transition duration-300 bg-blue-200 shadow-lg text-blue-950 hover:bg-yellow-600"
            >
              Save
            </button>
            {saved && <span className="font-bold text-blue-950">Saved ✅</span>}
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
