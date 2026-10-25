import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { listFlashcardSets } from "../api/flashcardService";
import { listQuizAttempts } from "../api/quizService";
import { handleError } from "../helper/ErrorHandler";
import { FlashcardSetSummary } from "../models/Study";
import { QuizAttempt } from "../models/Quiz";

const Achievements = () => {
  const navigate = useNavigate();
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

  const flashSets = sets;
  const quizzes = attempts;
  const cardsMade = flashSets.reduce((n, s) => n + s.cardCount, 0);
  const perfect = quizzes.filter((a) => a.total > 0 && a.score === a.total).length;
  const totalQ = quizzes.reduce((n, a) => n + a.total, 0);
  const totalCorrect = quizzes.reduce((n, a) => n + a.score, 0);
  const accuracy = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const badges = [
    { label: "First flashcard set", earned: flashSets.length >= 1 },
    { label: "Study 5 sets", earned: flashSets.length >= 5 },
    { label: "100 cards created", earned: cardsMade >= 100 },
    { label: "First quiz taken", earned: quizzes.length >= 1 },
    { label: "Perfect score", earned: perfect >= 1 },
    { label: "80% accuracy (10+ questions)", earned: totalQ >= 10 && accuracy >= 80 },
  ];

  const stats = [
    { label: "Flashcard sets", value: flashSets.length },
    { label: "Cards created", value: cardsMade },
    { label: "Quizzes taken", value: quizzes.length },
    { label: "Quiz accuracy", value: totalQ ? `${accuracy}%` : "—" },
  ];

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-5xl">
        <h1 className="mb-8 text-4xl font-extrabold text-blue-200 uppercase">
          Achievements
        </h1>
        {!loaded && <p className="mb-6 text-blue-950">Loading...</p>}

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="p-6 bg-blue-100 border-4 border-blue-200">
              <div className="text-3xl font-extrabold text-blue-850">{s.value}</div>
              <div className="text-blue-950">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 mb-6 text-3xl font-bold text-blue-200">Badges</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.label}
              className={`p-4 font-bold border-4 ${
                b.earned
                  ? "bg-yellow-400 border-yellow-600 text-blue-950"
                  : "bg-blue-100 border-blue-200 text-blue-800 opacity-60"
              }`}
            >
              {b.earned ? "★ " : ""}
              {b.label}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div
            onClick={() => navigate("/flashcards")}
            className="inline-block px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl"
          >
            Keep studying
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Achievements;
