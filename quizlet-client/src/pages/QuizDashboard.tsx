import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ListQuiz from "../components/ListQuiz";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";

const tileClass =
  "px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer md:text-3xl w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl";

const QuizDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-lvh text-center bg-gradient-to-br from-blue-500 to-cyan-400">
      <Header />
      <div className="flex flex-wrap justify-center gap-6 mx-auto">
        <div onClick={() => navigate("/materials")} className={tileClass}>
          study materials
        </div>
        <div onClick={() => navigate("/flashcards")} className={tileClass}>
          flashcards
        </div>
        {isAdmin() && (
          <>
            <div onClick={() => navigate("/generate")} className={tileClass}>
              formulate a quiz
            </div>
            <div onClick={() => navigate("/addque")} className={tileClass}>
              cook a question
            </div>
            <div onClick={() => navigate("/question")} className={tileClass}>
              question bank
            </div>
          </>
        )}
      </div>
      <ListQuiz />
      <Footer />
    </div>
  );
};

export default QuizDashboard;
