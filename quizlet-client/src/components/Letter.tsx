import React from "react";

const Letter = () => {
  return (
    <section className="m-5 my-20 py-10 rounded-tl-[70%] rounded-br-[70%] bg-opacity-20 bg-blue-200">
      <h1 className="text-4xl font-extrabold leading-none text-center text-blue-300 upercase -tracking-wider md:text-6xl lg:text-8xl">
        Dear Learners,
      </h1>
      <br />
      <p className="mb-6 font-mono text-xl tracking-wide text-left text-slate-800 md:text-3xl md:pl-36 md:pr-20 text-ellipsis text-wrap">
        Are you ready to test your knowledge and challenge yourself like never
        before? QuizPro is your gateway to a fun, interactive, and competitive
        learning experience. Whether you’re a student, a professional, or just
        someone who loves quizzes, we’ve got something for everyone.
        <br />
        <br />
        Explore a variety of categories, from science and technology to pop
        culture and history. Every quiz is designed to spark your curiosity and
        take your learning journey to the next level.
        <br />
        And it’s not just about knowledge—it’s about fun! Compete with friends,
        track your progress, and celebrate every achievement.
        <br />
        <br />
        Let the quizzing begin—step into a world of endless possibilities, one
        question at a time.
        <br />
        <br />
        Sincerely, <br />A Fellow Learner
      </p>
    </section>
  );
};

export default Letter;
