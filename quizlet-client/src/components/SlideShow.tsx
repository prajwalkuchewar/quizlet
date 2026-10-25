import React, { useState, useEffect } from "react";

const slides = [
  {
    title: "Upload your notes",
    body: "Add PDFs, text, or lecture notes and ask questions about them.",
    icon: "📚",
  },
  {
    title: "Generate flashcards",
    body: "Turn any material into a flashcard set and review it at your pace.",
    icon: "🃏",
  },
  {
    title: "Test yourself",
    body: "Take AI-generated quizzes and track your attempts over time.",
    icon: "🤓",
  },
];

const Slideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Auto-rotate slides every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden px-10 mx-10 mb-10">
      <div className="relative h-[300px] lg:h-[400px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            aria-hidden={index !== currentSlide}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-blue-200 px-8 text-center text-blue-950 shadow-lg transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-6xl">{slide.icon}</span>
            <h2 className="text-3xl font-extrabold uppercase md:text-5xl">
              {slide.title}
            </h2>
            <p className="text-lg font-semibold md:text-2xl">{slide.body}</p>
          </div>
        ))}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 w-3 rounded-full transition ${
                index === currentSlide ? "bg-yellow-500" : "bg-blue-950/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Slideshow;
