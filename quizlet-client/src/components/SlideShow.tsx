import React, { useState, useEffect } from "react";

const Slideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides: string[] = [
    "https://alpha.plainsightventures.co/images/sweep/marketing/hero-blocks-1a.png",
    "https://alpha.plainsightventures.co/images/sweep/marketing/hero-blocks-1b.png",
    "https://alpha.plainsightventures.co/images/sweep/marketing/hero-blocks-1c.png",
  ];

  // Auto-rotate slides every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="overflow-hidden">
      <div className="relative flex items-center justify-center w-auto h-[300px] lg:h-[540px] overflow-hidden max-w-none">
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide}
            className={`absolute top-0 transition-opacity duration-0 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            alt={`slide-${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Slideshow;
