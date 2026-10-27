import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { createQuiz } from "../api/quizService";
import { ButtonLabel } from "./Loader";

type CreateQuizInputs = {
  category: string;
  numQ: number;
  title: string;
};

const validation = Yup.object().shape({
  category: Yup.string().required("Category is required"),
  numQ: Yup.number()
    .typeError("Number of questions is required")
    .min(1, "At least 1 question")
    .max(100, "At most 100 questions")
    .required("Number of questions is required"),
  title: Yup.string().required("Title is required"),
});

const CreateQuiz = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateQuizInputs>({ resolver: yupResolver(validation) });

  const handleCreate = async (form: CreateQuizInputs) => {
    const created = await createQuiz(form.category, form.numQ, form.title);
    if (created) navigate("/quiz");
  };

  return (
    <section className="bg-gradient-to-r from-emerald-300 to-cyan-300">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 opacity-80">
        <h2 className="mb-6 text-3xl font-bold">Create a New Quiz</h2>
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
          <label className="block mb-2 text-lg font-semibold" htmlFor="title">
            Quiz Title
          </label>
          <input
            type="text"
            id="title"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quiz title"
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-white">{errors.title.message}</p>
          ) : (
            ""
          )}

          <label
            className="block mb-2 text-lg font-semibold"
            htmlFor="category"
          >
            Category
          </label>
          <select
            id="category"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("category")}
          >
            <option value="">Select a category</option>
            <option value="Python">Python</option>
            <option value="History">History</option>
            <option value="Math">Math</option>
            {/* Add more categories as needed */}
          </select>
          {errors.category ? (
            <p className="text-white">{errors.category.message}</p>
          ) : (
            ""
          )}
          <label className="block mb-2 text-lg font-semibold" htmlFor="numQ">
            Number of Questions
          </label>
          <input
            type="number"
            id="numQ"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter number of questions"
            min="1"
            {...register("numQ", { valueAsNumber: true })}
          />
          {errors.numQ ? (
            <p className="text-white">{errors.numQ.message}</p>
          ) : (
            ""
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ButtonLabel loading={isSubmitting} loadingText="Creating quiz...">
              Create Quiz
            </ButtonLabel>
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateQuiz;
