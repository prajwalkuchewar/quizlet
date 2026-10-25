import React from "react";
import { Route, Routes as Router, useLocation } from "react-router-dom";
import AttemptQuiz from "../components/AttemptQuiz";
import CreateQuiz from "../components/CreateQuiz";
import Layout from "../components/Layout";
import Missing from "../components/Missing";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Materials from "../pages/Materials";
import Flashcards from "../pages/Flashcards";
import FlashcardStudy from "../pages/FlashcardStudy";
import Achievements from "../pages/Achievements";
import History from "../pages/History";
import Settings from "../pages/Settings";
import Darkmode from "../pages/Darkmode";
import QuestionDashboard from "../pages/QuestionDashboard";
import QuizDashboard from "../pages/QuizDashboard";
import Register from "../pages/Register";
import Unauthorized from "../pages/Unauthorized";
import ProtectedRoute from "./ProtectedRoute";
import AddQuestion from "../components/AddQuestion";
import { ToastContainer } from "react-toastify";

// const ROLES = {
//   User: "USER",
//   Admin: "ADMIN",
// };

const Routes = () => {
  const location = useLocation();
  const { id } = location.state || {};

  return (
    <>
      <ToastContainer />
      <Router>
        <Route path="/" element={<Layout />}>
          {/* public routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <QuizDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attempt"
            element={
              <ProtectedRoute>
                <AttemptQuiz
                  quizId={id}
                  quizTitle={location.state?.title}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generate"
            element={
              <ProtectedRoute adminOnly>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addQue"
            element={
              <ProtectedRoute adminOnly>
                <AddQuestion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/question"
            element={
              <ProtectedRoute adminOnly>
                <QuestionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <Flashcards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards/:setId"
            element={
              <ProtectedRoute>
                <FlashcardStudy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/darkmode"
            element={
              <ProtectedRoute>
                <Darkmode />
              </ProtectedRoute>
            }
          />

          {/* catch all */}
          <Route path="*" element={<Missing />} />
        </Route>
      </Router>
    </>
  );
};

export default Routes;
