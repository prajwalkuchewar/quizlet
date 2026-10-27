import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { Loader } from "../components/Loader";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import {
  deleteQuestion,
  getAllQuestions,
  QuestionItem,
} from "../api/questionService";
import { handleError } from "../helper/ErrorHandler";

const buttonClass =
  "px-4 py-2 font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl";

const QuestionDashboard = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getAllQuestions()
      .then(setQuestions)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const onDelete = async (id: number) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      handleError(err);
    }
  };

  const shown = questions.filter((q) =>
    `${q.questionTitle} ${q.category}`
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  );

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-200">
      <Header />
      <main className="px-6 pb-16 mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-extrabold text-blue-200 uppercase">
          Question bank
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div
            onClick={() => navigate("/addque")}
            className="px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer md:text-2xl w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl"
          >
            Add question
          </div>
          <input
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Filter by title or category"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {loading ? (
          <Loader label="Loading questions..." />
        ) : shown.length === 0 ? (
          <p>No questions found.</p>
        ) : (
          <ul className="space-y-3 text-left">
            {shown.map((q) => (
              <li
                key={q.id}
                className="flex flex-col gap-3 p-4 bg-blue-100 border-4 border-blue-200 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-bold text-blue-950">{q.questionTitle}</div>
                  <div className="text-sm text-blue-800">
                    {q.category} · answer: {q.rightAnswer}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={buttonClass}
                    onClick={() =>
                      navigate("/addque", { state: { question: q } })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 font-extrabold text-white bg-red-600 hover:bg-red-700"
                    onClick={() => onDelete(q.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default QuestionDashboard;
