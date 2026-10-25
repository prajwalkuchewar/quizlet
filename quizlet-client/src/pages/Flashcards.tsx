import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { generateFlashcards, listFlashcardSets } from "../api/flashcardService";
import { listMaterials } from "../api/materialService";
import { handleError } from "../helper/ErrorHandler";
import { getStudyPrefs } from "../helper/preferences";
import { Difficulty, FlashcardSetSummary, Material } from "../models/Study";

const buttonClass =
  "px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";
const inputClass =
  "w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-blue-950";

const Flashcards = () => {
  const navigate = useNavigate();
  const defaults = getStudyPrefs();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(defaults.defaultCount);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    defaults.defaultDifficulty,
  );
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<FlashcardSetSummary[]>([]);

  useEffect(() => {
    listMaterials()
      .then(setMaterials)
      .catch(handleError);
    listFlashcardSets()
      .then((sets) => setRecent(sets.slice(0, 10)))
      .catch(handleError);
  }, []);

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const onGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const set = await generateFlashcards({
        prompt: prompt.trim() || "Create study flashcards from the selected materials",
        materialIds: selected,
        count,
        difficulty,
        title: title.trim() || undefined,
      });
      navigate(`/flashcards/${set.id}`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-5xl">
        <h1 className="mb-8 text-4xl font-extrabold text-blue-200 uppercase">
          Flashcards
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <form
            onSubmit={onGenerate}
            className="p-6 space-y-4 text-left bg-blue-100 border-4 border-blue-200"
          >
            <h2 className="text-2xl font-bold text-blue-850">Generate a set</h2>

            {materials.length === 0 ? (
              <p>
                No materials yet.{" "}
                <span
                  className="font-bold underline cursor-pointer"
                  onClick={() => navigate("/materials")}
                >
                  Add some first
                </span>
                .
              </p>
            ) : (
              <fieldset className="space-y-1">
                <legend className="font-bold">Materials</legend>
                {materials.map((m) => (
                  <label key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggle(m.id)}
                    />
                    {m.title}
                  </label>
                ))}
              </fieldset>
            )}

            <input
              className={inputClass}
              placeholder="Set title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={inputClass}
              rows={3}
              placeholder="What should the cards focus on? (optional)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex gap-4">
              <label className="flex-1">
                <span className="block font-bold">Cards (1-40)</span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  className={inputClass}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </label>
              <label className="flex-1">
                <span className="block font-bold">Difficulty</span>
                <select
                  className={inputClass}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={busy || selected.length === 0 || count < 1 || count > 40}
              className={buttonClass}
            >
              {busy ? "Generating..." : "Generate"}
            </button>
            {busy && (
              <p className="text-sm text-blue-800">
                This can take up to a minute while the AI writes the cards.
              </p>
            )}
          </form>

          <section className="p-6 space-y-3 text-left bg-blue-100 border-4 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-850">Recent sets</h2>
            {recent.length === 0 ? (
              <p>No sets yet. Generate one to start studying.</p>
            ) : (
              recent.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/flashcards/${r.id}`)}
                  className="flex items-center justify-between p-3 bg-white border-2 cursor-pointer border-blue-200 hover:bg-yellow-500"
                >
                  <span className="font-bold text-blue-950">{r.title}</span>
                  <span className="text-sm text-blue-800">{r.cardCount} cards</span>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Flashcards;
