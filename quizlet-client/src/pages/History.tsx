import React, { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Loader } from "../components/Loader";
import { listFlashcardSets } from "../api/flashcardService";
import { listQuizAttempts } from "../api/quizService";
import { handleError } from "../helper/ErrorHandler";
import { FlashcardSetSummary } from "../models/Study";
import { QuizAttempt } from "../models/Quiz";

type HistoryItem = {
  key: string;
  label: string;
  detail: string;
  at: string | null;
};

const History = () => {
  const [sets, setSets] = useState<FlashcardSetSummary[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([listFlashcardSets(), listQuizAttempts()])
      .then(([s, a]) => {
        setSets(s);
        setAttempts(a);
      })
      .catch(handleError)
      .finally(() => setLoaded(true));
  }, []);

  const items = useMemo<HistoryItem[]>(() => {
    const quizItems = attempts.map((a) => ({
      key: `quiz-${a.id}`,
      label: `Quiz: ${a.quizTitle}`,
      detail: `${a.score}/${a.total}`,
      at: a.createdAt,
    }));
    const setItems = sets.map((s) => ({
      key: `set-${s.id}`,
      label: `Flashcards: ${s.title}`,
      detail: `${s.cardCount} cards`,
      at: s.createdAt,
    }));
    const time = (at: string | null) => (at ? new Date(at).getTime() : 0);
    return [...quizItems, ...setItems].sort((a, b) => time(b.at) - time(a.at));
  }, [attempts, sets]);

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-extrabold text-blue-200 uppercase">
          History
        </h1>
        {!loaded ? (
          <Loader label="Loading history..." />
        ) : items.length === 0 ? (
          <p className="text-blue-950">
            Nothing yet. Generate flashcards or solve a quiz to see it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li
                key={a.key}
                className="flex items-center justify-between p-4 text-left bg-blue-100 border-4 border-blue-200"
              >
                <div>
                  <div className="font-bold text-blue-950">{a.label}</div>
                  <div className="text-sm text-blue-800">
                    {a.at ? new Date(a.at).toLocaleString() : "Date not recorded"}
                  </div>
                </div>
                <div className="font-extrabold text-blue-850">{a.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default History;
