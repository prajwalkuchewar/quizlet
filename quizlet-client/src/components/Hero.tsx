import React from "react";
import { useNavigate } from "react-router-dom";

const quote = [
  "T",
  "e",
  "s",
  "t",
  " ",
  "Y",
  "o",
  "u",
  "r",
  " ",
  "K",
  "n",
  "o",
  "w",
  "l",
  "e",
  "d",
  "g",
  "e",
  ",",
  " ",
  "C",
  "h",
  "a",
  "l",
  "l",
  "e",
  "n",
  "g",
  "e",
  " ",
  "Y",
  "o",
  "u",
  "r",
  " ",
  "L",
  "i",
  "m",
  "i",
  "t",
  "s",
  "!",
];
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="px-10 mx-10 mb-10">
      <h1 className="text-5xl font-extrabold leading-none text-center text-blue-200 uppercase md:text-6xl -tracking-wider lg:text-8xl">
        {quote.map((char, index) => (
          <span key={index} className={`cursor-pointer hover:text-yellow-500`}>
            {char}
          </span>
        ))}
      </h1>
      <br />
      <br />
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div
          onClick={() => navigate("/materials")}
          className="px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer md:text-3xl w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl"
        >
          Study materials 📚
        </div>
        <div
          onClick={() => navigate("/flashcards")}
          className="px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer md:text-3xl w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl"
        >
          Flashcards 🃏
        </div>
        <div
          onClick={() => navigate("/quiz")}
          className="px-6 py-3 text-xl font-extrabold transition duration-300 ease-in-out transform bg-blue-200 shadow-lg cursor-pointer md:text-3xl w-fit text-blue-950 hover:bg-yellow-600 hover:translate-y-1 hover:shadow-xl"
        >
          Take a quiz 🤓
        </div>
      </div>
    </section>
  );
};

export default Hero;
