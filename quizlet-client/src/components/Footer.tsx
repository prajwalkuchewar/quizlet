import React from "react";

const Footer = () => {
  return (
    <footer className="p-5 text-center bg-blue-200">
      <div className="w-1/2 mx-auto b-4">
        Join thousands of users and take quizzes on a wide range of topics.
        Improve your skills, track your progress, and compete with others.
      </div>
      <br />
      <h1 className="text-3xl font-extrabold leading-none text-center text-blue-800 uppercase cursor-pointer -tracking-wider hover:text-yellow-600">
        Try Quizly Newsletter!
      </h1>
      <br />
      <br />
      <div className="flex justify-between mx-auto text-center">
        <div className="space-x-6">
          <a href="#" className="hover:text-gray-400">
            About Us
          </a>
          <a href="#" className="hover:text-gray-400">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-gray-400">
            Contact Us
          </a>
        </div>
        <p className="">&copy; 2024 QuizApp. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
