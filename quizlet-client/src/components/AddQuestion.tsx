import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import {
  addQuestion,
  QuestionItem,
  updateQuestion,
} from "../api/questionService";

type AddQuestionInputs = {
  questionTitle: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  rightAnswer: string;
  category: string;
};

const validation = Yup.object().shape({
  questionTitle: Yup.string().required("Question title is required"),
  option1: Yup.string().required("Option 1 is required"),
  option2: Yup.string().required("Option 2 is required"),
  option3: Yup.string().required("Option 3 is required"),
  option4: Yup.string().required("Option 4 is required"),
  rightAnswer: Yup.string().required("Right answer is required"),
  category: Yup.string().required("Category is required"),
});

const AddQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = (location.state as { question?: QuestionItem } | null)
    ?.question;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddQuestionInputs>({
    resolver: yupResolver(validation),
    defaultValues: editing
      ? {
          questionTitle: editing.questionTitle,
          option1: editing.option1,
          option2: editing.option2,
          option3: editing.option3,
          option4: editing.option4,
          rightAnswer: editing.rightAnswer,
          category: editing.category,
        }
      : undefined,
  });

  const handleCreate = async (form: AddQuestionInputs) => {
    const saved = editing
      ? await updateQuestion(editing.id, {
          ...form,
          difficultyLevel: editing.difficultyLevel,
        })
      : await addQuestion(
          form.questionTitle,
          form.option1,
          form.option2,
          form.option3,
          form.option4,
          form.rightAnswer,
          form.category,
        );
    if (saved) navigate("/question");
  };
  return (
    <section className="p-4 bg-gradient-to-r from-emerald-300 to-cyan-300 ">
      <div className="flex flex-col items-center justify-center w-1/2 px-6 py-8 mx-auto md:h-screen lg:py-0 opacity-80">
        <h2 className="mb-6 text-3xl font-bold">
          {editing ? "Edit Question" : "Add a New Question"}
        </h2>
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
          <label
            className="block text-lg font-semibold"
            htmlFor="questionTitle"
          >
            Question Title
          </label>
          <input
            type="text"
            id="questionTitle"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter questionTitle"
            {...register("questionTitle")}
          />
          {errors.questionTitle ? (
            <p className="text-white">{errors.questionTitle.message}</p>
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

          <label
            className="block mb-2 text-lg font-semibold"
            htmlFor="rightAnswer"
          >
            Right Answer
          </label>
          <input
            type="text"
            id="rightAnswer"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter   rightAnswer"
            {...register("rightAnswer")}
          />
          {errors.rightAnswer ? (
            <p className="text-white">{errors.rightAnswer.message}</p>
          ) : (
            ""
          )}

          <label className="block mb-2 text-lg font-semibold" htmlFor="option1">
            Options
          </label>
          <input
            type="text"
            id="option1"
            className="w-full px-4 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter   option1"
            {...register("option1")}
          />
          {errors.option1 ? (
            <p className="text-white">{errors.option1.message}</p>
          ) : (
            ""
          )}
          <input
            type="text"
            id="option2"
            className="w-full px-4 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter   option2"
            {...register("option2")}
          />
          {errors.option2 ? (
            <p className="text-white">{errors.option2.message}</p>
          ) : (
            ""
          )}
          <input
            type="text"
            id="option3"
            className="w-full px-4 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter   option3"
            {...register("option3")}
          />
          {errors.option3 ? (
            <p className="text-white">{errors.option3.message}</p>
          ) : (
            ""
          )}
          <input
            type="text"
            id="option4"
            className="w-full px-4 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter   option4"
            {...register("option4")}
          />
          {errors.option4 ? (
            <p className="text-white">{errors.option4.message}</p>
          ) : (
            ""
          )}

          <button
            type="submit"
            className="px-6 py-3 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            {editing ? "Save Changes" : "Create Question"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AddQuestion;
