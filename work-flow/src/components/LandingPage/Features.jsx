import React, { useState, useEffect } from "react";

const features = [
  {
    icon: (
      <svg
        className="w-12 h-12 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Lightning Fast Performance",
    description:
      "Optimized algorithms ensure your campaigns execute in milliseconds. Experience the power of real-time automation that keeps your social media presence active and engaging.",
    gradient: "from-blue-500 to-cyan-500",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&crop=center",
    tags: ["Performance", "Speed", "Optimization"],
  },
  {
    icon: (
      <svg
        className="w-12 h-12 text-green-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    title: "Smart Scheduling",
    description:
      "AI-powered posting times based on audience engagement patterns. Never miss the perfect moment to connect with your audience across Instagram, WhatsApp, and Facebook.",
    gradient: "from-green-500 to-emerald-500",
    image:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop&crop=center",
    tags: ["AI", "Scheduling", "Engagement"],
  },
  {
    icon: (
      <svg
        className="w-12 h-12 text-purple-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: "Campaign Automation",
    description:
      "Create intelligent workflows that respond to user interactions. Automate responses, nurture leads, and build meaningful connections with your audience effortlessly.",
    gradient: "from-purple-500 to-violet-500",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center",
    tags: ["Automation", "Workflows", "Intelligence"],
  },
  {
    icon: (
      <svg
        className="w-12 h-12 text-orange-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
    title: "Advanced Analytics",
    description:
      "Deep insights into your social media performance with AI-driven recommendations. Track growth, engagement, and ROI across all your platforms in real-time.",
    gradient: "from-orange-500 to-red-500",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center",
    tags: ["Analytics", "Insights", "Growth"],
  },
  {
    icon: (
      <svg
        className="w-12 h-12 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Enterprise Security",
    description:
      "Bank-level encryption and compliance standards for your data. Your social media accounts and customer information are protected with industry-leading security measures.",
    gradient: "from-red-500 to-pink-500",
    image:
      "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&h=600&fit=crop&crop=center",
    tags: ["Security", "Encryption", "Compliance"],
  },
  {
    icon: (
      <svg
        className="w-12 h-12 text-indigo-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "24/7 Monitoring",
    description:
      "Continuous monitoring ensures your campaigns run smoothly around the clock. Automatic adjustments and real-time notifications keep you informed and in control.",
    gradient: "from-indigo-500 to-purple-500",
    image:
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop&crop=center",
    tags: ["Monitoring", "24/7", "Reliability"],
  },
];

const AnimatedFeatures = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = React.useRef(null);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Autoplay functionality
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 500); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  // Smooth section scrolling with Intersection Observer

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentFeature = features[currentIndex];

  return (
    <div id="features"className="relative">
      {/* Main Carousel Section */}
      <div
        ref={containerRef}
        className="h-screen bg-black  relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Autoplay indicator */}
        <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-lg z-20">
          {isPaused ? "Paused" : "Auto-playing"} 
        </div>

        {/* Main Content */}
        <div className="h-full flex items-center relative z-10">
          <div className="w-full overflow-hidden">
            <div
              className={`flex transition-transform duration-700 ease-in-out`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 px-6 lg:px-8">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center h-full">
                      {/* Left Content */}
                      <div className="space-y-12">
                        <div className="space-y-8">
                          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                            {feature.title}
                          </h1>
                          <p className="text-2xl text-gray-300 leading-relaxed font-light">
                            {feature.description}
                          </p>
                        </div>

                        <div className="flex space-x-3">
                          {feature.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-4 py-2 text-sm font-medium bg-white bg-opacity-5 text-black rounded-full border border-white border-opacity-10 shadow-white"
                              style={{
                                boxShadow:
                                  "0 0 8px 2px rgba(255, 255, 255, 0.6)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Image */}
                      <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl">
                          <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-[600px] object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-10`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? "w-12 h-3 bg-white rounded-full"
                  : "w-3 h-3 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full"
              }`}
              disabled={isAnimating}
            />
          ))}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          disabled={isAnimating}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed z-20 transition-opacity duration-200"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          disabled={isAnimating}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed z-20 transition-opacity duration-200"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>       
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedFeatures;
