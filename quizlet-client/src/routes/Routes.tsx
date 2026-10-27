import React, { lazy } from "react";
import { Route, Routes as Router, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import { ToastContainer } from "react-toastify";

// Routes are code-split; Layout shows a loading page while a chunk is fetched.
const AttemptQuiz = lazy(() => import("../components/AttemptQuiz"));
const CreateQuiz = lazy(() => import("../components/CreateQuiz"));
const Missing = lazy(() => import("../components/Missing"));
const AddQuestion = lazy(() => import("../components/AddQuestion"));
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Materials = lazy(() => import("../pages/Materials"));
const Flashcards = lazy(() => import("../pages/Flashcards"));
const FlashcardStudy = lazy(() => import("../pages/FlashcardStudy"));
const Achievements = lazy(() => import("../pages/Achievements"));
const History = lazy(() => import("../pages/History"));
const Settings = lazy(() => import("../pages/Settings"));
const Darkmode = lazy(() => import("../pages/Darkmode"));
const QuestionDashboard = lazy(() => import("../pages/QuestionDashboard"));
const QuizDashboard = lazy(() => import("../pages/QuizDashboard"));
const Register = lazy(() => import("../pages/Register"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));

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
