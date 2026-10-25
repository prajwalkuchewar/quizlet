import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Letter from "../components/Letter";
import Slideshow from "../components/SlideShow";

const Home = () => {
  return (
    <>
      <div className="jigsaw">
        <Header />
        <Hero />
        <Slideshow />
        <Letter />
        <Footer />
      </div>
    </>
  );
};

export default Home;
