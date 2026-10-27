import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { fetchQuizQuestions, submitQuizAttempt } from "../api/quizService"; // assuming this service will fetch questions based on quiz ID
import { QuizQuestions, QuizResponse } from "../models/Quiz";
import { handleError } from "../helper/ErrorHandler";
import { PageLoader } from "./Loader";

type Props = {
  quizId: number;
  quizTitle?: string;
};

// type QuizQuestion = {
//   id: number;
//   questionTitle: string;
//   option1: string;
//   option2: string;
//   option3: string;
//   option4: string;
// };

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  answers: Yup.array()
    .of(Yup.string().required("You must select an answer for each question"))
    .required("Answers are required"),
});

const AttemptQuiz = ({ quizId, quizTitle }: Props) => {
  const [questions, setQuestions] = useState<QuizQuestions[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  // Fetch questions when the component mounts
  useEffect(() => {
    const loadQuizQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedQuestions = await fetchQuizQuestions(quizId); // Call your API to get quiz questions
        setQuestions(fetchedQuestions?.data ?? []);
      } catch (err) {
        setError("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    loadQuizQuestions();
  }, []);

  // Handle quiz submission
  const onSubmit = async (data) => {
    const userResponses: QuizResponse[] = questions.map((q, index) => ({
      id: q.id,
      response: data.answers[index],
    }));

    try {
      const attempt = await submitQuizAttempt(quizId, userResponses);
      setResult({ score: attempt.score, total: attempt.total });
    } catch (err) {
      handleError(err);
    }
  };

  if (loading) {
    return <PageLoader label="Loading quiz..." />;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto text-center">
        <h2 className="mb-12 text-3xl font-bold">Solve Quiz</h2>

        {questions.length > 0 ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-2/3 mx-auto space-y-6 border-8 border-blue-200"
          >
            {questions.map((question, index) => (
              <div key={question.id} className="p-4 m-2 ">
                <h3 className="mb-2 text-xl font-semibold text-left">
                  {index + 1}. {question.questionTitle}
                </h3>
                <div className="px-4 mx-4 border-4 border-blue-200">
                  <label
                    key={question.option1}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="radio"
                      value={question.option1}
                      {...register(`answers.${index}`)}
                      className="w-4 h-4 text-blue-600 form-radio"
                    />
                    <span>{question.option1}</span>
                  </label>

                  <label
                    key={question.option2}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="radio"
                      value={question.option2}
                      {...register(`answers.${index}`)}
                      className="w-4 h-4 text-blue-600 form-radio"
                    />
                    <span>{question.option2}</span>
                  </label>

                  <label
                    key={question.option3}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="radio"
                      value={question.option3}
                      {...register(`answers.${index}`)}
                      className="w-4 h-4 text-blue-600 form-radio"
                    />
                    <span>{question.option3}</span>
                  </label>

                  <label
                    key={question.option4}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="radio"
                      value={question.option4}
                      {...register(`answers.${index}`)}
                      className="w-4 h-4 text-blue-600 form-radio"
                    />
                    <span>{question.option4}</span>
                  </label>
                </div>
                {errors.answers && errors.answers[index] && (
                  <p className="text-sm text-red-500">
                    {errors.answers[index]?.message}
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Submit Quiz
            </button>
          </form>
        ) : (
          <p>No questions available for this quiz.</p>
        )}

        {result !== null && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold">
              Your Score: {result.score}/{result.total}
            </h3>
            <p className="mt-2 text-gray-700">
              Saved to your history{quizTitle ? ` as "${quizTitle}"` : ""}.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AttemptQuiz;
