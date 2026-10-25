import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listQuiz } from "../api/quizService";
import { QuizCreated } from "../models/Quiz";

const ListQuiz = () => {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizCreated[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz when the component mounts
  useEffect(() => {
    const loadQuizQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedQuiz = await listQuiz();
        setQuiz(fetchedQuiz!.data || []); // Update state with data
      } catch (err) {
        setError("Failed to load quiz: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    loadQuizQuestions();
  }, []);

  // Conditional rendering based on state
  if (loading) return <p>Loading...</p>;

  if (error) return <p>{error}</p>;

  return (
    <section className="p-20">
      <div className="container mx-auto text-center">
        {error ? (
          <p>{error}</p>
        ) : (
          <>
            <h2 className="mb-12 text-3xl font-bold">
              Solve these pre-configured quizes
            </h2>
            {quiz.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                {quiz.map((q) => (
                  <div
                    key={q.id}
                    className="grid grid-cols-3 p-2 border-4 border-blue-200"
                  >
                    <div className="col-span-3 text-2xl font-extrabold text-left capitalize text-blue-850">
                      {q.title}
                    </div>
                    <p className="col-span-3 text-blue-850 w-fit rounded-xl">
                      Items: {q.questionIds.length}
                    </p>
                    <div className="flex justify-end col-span-3">
                      <div
                        onClick={() =>
                          navigate("/attempt", {
                            state: { id: q.id, title: q.title },
                          })
                        }
                        className="p-2 font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl "
                      >
                        Solve
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No quiz available</p>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ListQuiz;
