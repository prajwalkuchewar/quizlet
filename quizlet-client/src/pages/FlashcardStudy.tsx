import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Loader } from "../components/Loader";
import {
  getFlashcardProgress,
  getFlashcardSet,
  reviewFlashcard,
} from "../api/flashcardService";
import { handleError } from "../helper/ErrorHandler";
import { FlashcardProgress, FlashcardSet } from "../models/Study";

const buttonClass =
  "px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";

const FlashcardStudy = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const id = Number(setId);

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [progress, setProgress] = useState<FlashcardProgress | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          getFlashcardSet(id),
          getFlashcardProgress(id),
        ]);
        setSet(s);
        setProgress(p);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(id)) load();
    else setLoading(false);
  }, [id]);

  const cards = set?.flashcards ?? [];
  const current = cards[index];
  const done = cards.length > 0 && index >= cards.length;

  const grade = async (remembered: boolean) => {
    if (!current) return;
    setBusy(true);
    try {
      await reviewFlashcard(id, current.id, remembered);
      setProgress(await getFlashcardProgress(id));
      setFlipped(false);
      setIndex((i) => i + 1);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
        <Header />
        <Loader label="Loading flashcards..." className="p-10" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
        <Header />
        <p className="p-10">This flashcard set could not be loaded.</p>
        <div className="flex justify-center">
          <div className={buttonClass} onClick={() => navigate("/flashcards")}>
            Back to flashcards
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-3xl">
        <h1 className="mb-2 text-4xl font-extrabold text-blue-200 uppercase">
          {set.title}
        </h1>
        <p className="mb-6 text-blue-950">
          {progress
            ? `${progress.remembered} remembered · ${progress.needsPractice} need practice · ${progress.reviews} reviews`
            : ""}
        </p>

        {done ? (
          <div className="p-10 space-y-6 bg-blue-100 border-4 border-blue-200">
            <h2 className="text-3xl font-bold text-blue-850">Set complete</h2>
            <div className="flex justify-center gap-4">
              <div className={buttonClass} onClick={restart}>
                Study again
              </div>
              <div className={buttonClass} onClick={() => navigate("/flashcards")}>
                New set
              </div>
            </div>
          </div>
        ) : current ? (
          <div className="space-y-6">
            <div className="text-blue-950">
              Card {index + 1} of {cards.length}
            </div>
            <div
              onClick={() => setFlipped((f) => !f)}
              className="flex items-center justify-center min-h-64 p-10 text-2xl font-bold bg-white border-4 cursor-pointer select-none border-blue-200 text-blue-950 hover:border-yellow-500"
            >
              {flipped ? current.back : current.front}
            </div>
            <p className="text-sm text-blue-950">
              {flipped ? "Answer" : "Question"} · click the card to flip
            </p>
            {flipped && (
              <div className="flex justify-center gap-4">
                <button
                  disabled={busy}
                  onClick={() => grade(false)}
                  className="px-6 py-3 font-extrabold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  Needs practice
                </button>
                <button
                  disabled={busy}
                  onClick={() => grade(true)}
                  className="px-6 py-3 font-extrabold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  Remembered
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>This set has no cards.</p>
        )}

        <div className="mt-8">
          <div className={buttonClass} onClick={() => navigate("/flashcards")}>
            Back to flashcards
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FlashcardStudy;
