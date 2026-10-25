import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import {
  addTextMaterial,
  deleteMaterial,
  getLlmStatus,
  listMaterials,
  searchMaterials,
  uploadMaterial,
} from "../api/materialService";
import { handleError } from "../helper/ErrorHandler";
import {
  LlmStatus,
  Material,
  MaterialSearchResult,
} from "../models/Study";

const buttonClass =
  "px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";
const inputClass =
  "w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-blue-950";

const Materials = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MaterialSearchResult[] | null>(null);

  const refresh = async () => {
    try {
      setMaterials(await listMaterials());
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    getLlmStatus()
      .then(setStatus)
      .catch(() => setStatus({ available: false, baseUrl: "", chatModel: "", embeddingModel: "" }));
  }, []);

  const onAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    try {
      await addTextMaterial(title.trim(), content);
      setTitle("");
      setContent("");
      await refresh();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      await uploadMaterial(file, title.trim() || undefined);
      setFile(null);
      setTitle("");
      await refresh();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      handleError(err);
    }
  };

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    try {
      setResults(await searchMaterials(query.trim()));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-extrabold text-blue-200 uppercase">
          Study materials
        </h1>
        <p className="mb-6 text-blue-950">
          Add notes or documents. Flashcards are generated from these.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <span
            className={`px-4 py-2 font-bold border-4 ${
              status?.available
                ? "bg-green-200 border-green-600 text-green-900"
                : "bg-red-200 border-red-600 text-red-900"
            }`}
          >
            AI {status?.available ? "online" : "offline"}
            {status?.available && ` (${status.chatModel})`}
          </span>
          <div
            onClick={() => navigate("/flashcards")}
            className={buttonClass}
          >
            Go to flashcards
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="p-6 space-y-4 text-left bg-blue-100 border-4 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-850">Add text</h2>
            <form onSubmit={onAddText} className="space-y-3">
              <input
                className={inputClass}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className={inputClass}
                rows={6}
                placeholder="Paste notes here"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy || !title.trim() || !content.trim()}
                className={buttonClass}
              >
                Save text
              </button>
            </form>

            <h2 className="pt-4 text-2xl font-bold text-blue-850">
              Upload file
            </h2>
            <form onSubmit={onUpload} className="space-y-3">
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />
              <button
                type="submit"
                disabled={busy || !file}
                className={buttonClass}
              >
                Upload
              </button>
            </form>
          </section>

          <section className="p-6 space-y-4 text-left bg-blue-100 border-4 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-850">Your materials</h2>
            {loading ? (
              <p>Loading...</p>
            ) : materials.length === 0 ? (
              <p>No materials yet.</p>
            ) : (
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 p-3 bg-white border-2 border-blue-200"
                  >
                    <div>
                      <div className="font-bold text-blue-950">{m.title}</div>
                      <div className="text-sm text-blue-800">
                        {m.filename ?? "text"} · {m.chunkCount} chunks
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="px-3 py-1 font-bold text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="pt-4 text-2xl font-bold text-blue-850">Search</h2>
            <form onSubmit={onSearch} className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Ask about your materials"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy || !query.trim()}
                className="px-4 font-bold bg-blue-800 text-blue-200 hover:bg-yellow-500 hover:text-blue-800 disabled:opacity-50"
              >
                Search
              </button>
            </form>
            {results && (
              <ul className="space-y-2">
                {results.length === 0 && <p>No matches.</p>}
                {results.map((r) => (
                  <li key={r.chunkId} className="p-3 bg-white border-2 border-blue-200">
                    <div className="text-sm font-bold text-blue-800">
                      {r.title} · {(r.similarity * 100).toFixed(0)}%
                    </div>
                    <p className="text-blue-950">{r.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Materials;
