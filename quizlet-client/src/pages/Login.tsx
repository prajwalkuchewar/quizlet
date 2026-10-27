import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { ButtonLabel } from "../components/Loader";
import { useAuth } from "../context/useAuth";

type LoginFormsInputs = {
  username: string;
  password: string;
};

const validation = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const { loginUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormsInputs>({ resolver: yupResolver(validation) });

  const handleLogin = (form: LoginFormsInputs) =>
    loginUser(form.username, form.password);

  return (
    <section className="min-h-screen bg-gradient-to-r from-blue-300 to-cyan-300">
      <div className="grid items-center min-h-screen gap-10 px-6 py-8 mx-auto max-w-6xl lg:grid-cols-2">
        <aside className="text-blue-900">
          <img src="/logo.svg" alt="Quizlet logo" className="w-16 h-16 mb-6" />
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Turn your study materials into answers, flashcards and quizzes
          </h2>
          <ul className="mt-8 space-y-4">
            <li className="flex gap-3">
              <span aria-hidden="true">📄</span>
              <span>Upload notes, PDFs or Markdown and index them for search.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">💬</span>
              <span>Ask questions and get answers with sources from your own material.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">🧠</span>
              <span>Generate flashcard sets and quizzes from what you are studying.</span>
            </li>
          </ul>
          <p className="mt-8 text-sm text-blue-900/80">
            Your uploads stay in your current session. Signing out clears them.
          </p>
        </aside>
        <div className="flex justify-center">
          <div className="w-full bg-white rounded-lg shadow dark:border sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Sign in to your account
            </h1>
            <form
              className="space-y-4 md:space-y-6"
              onSubmit={handleSubmit(handleLogin)}
            >
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Username"
                  {...register("username")}
                />
                {errors.username ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                ) : (
                  ""
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                ) : (
                  ""
                )}
              </div>
              <div className="flex items-center justify-between">
                <a
                  href="#"
                  className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
                >
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white bg-lightGreen hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-60 disabled:cursor-not-allowed dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                <ButtonLabel loading={isSubmitting} loadingText="Signing in...">
                  Sign in
                </ButtonLabel>
              </button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Don’t have an account yet?{" "}
                <a
                  href="/register"
                  className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                >
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
