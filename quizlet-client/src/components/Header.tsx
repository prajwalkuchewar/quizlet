import React from "react";
import { useNavigate } from "react-router-dom";
import UserProfile from "./UserProfile";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky flex items-center justify-between p-4 bg-transparent">
      <div
        onClick={() => {
          navigate(`/${window.history.back}`);
        }}
        className="block px-2 py-1 font-mono font-bold text-blue-200 cursor-pointer text-l md:hidden hidden:block hover:bg-yellow-500 hover:text-blue-800"
      >
        {"<-"}
      </div>

      <div
        onClick={() => {
          navigate("/");
        }}
        className="text-xl italic font-extrabold text-blue-200 uppercase cursor-pointer md:text-4xl -tracking-wider hover:text-yellow-500"
      >
        quizlet
      </div>

      <UserProfile />
    </header>
  );
};

export default Header;
