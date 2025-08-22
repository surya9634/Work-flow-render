import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechStart Inc.",
    content:
      "Workflow transformed our social media strategy. We saw 300% increase in engagement within the first month.",
    rating: 5,
    avatar: "SJ",
  },
  {
    name: "Michael Chen",
    role: "E-commerce Owner",
    company: "Fashion Forward",
    content:
      "The automation features saved us 20 hours per week. Our Instagram sales increased by 150% using Workflow.",
    rating: 5,
    avatar: "MC",
  },
  {
    name: "Emma Rodriguez",
    role: "Social Media Manager",
    company: "Creative Agency",
    content:
      "Managing multiple client accounts became effortless. The analytics insights are incredibly valuable.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "David Park",
    role: "Startup Founder",
    company: "InnovateLab",
    content:
      "The ROI we've seen from Workflow is incredible. Our social media campaigns are now 5x more effective.",
    rating: 5,
    avatar: "DP",
  },
  {
    name: "Lisa Wang",
    role: "Content Creator",
    company: "Creative Studios",
    content:
      "As a content creator, Workflow helps me maintain consistency across all platforms. Game-changer!",
    rating: 5,
    avatar: "LW",
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-20 pt-40 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Header */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="px-4 py-2 bg-blue-900/50 text-blue-300 rounded-full text-sm font-medium border border-blue-800/50">
                Customer Stories
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              What Our
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Customers Say
              </span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Join thousands of satisfied customers who've transformed their
              social media strategy with our powerful automation tools.
            </p>
            
            {/* Progress indicators */}
            <div className="flex space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentIndex
                      ? 'w-8 bg-blue-500'
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right side - Testimonials */}
          <div className="relative">
            <div className="relative h-96 overflow-hidden">
              <div
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  isAnimating 
                    ? 'transform translate-y-full opacity-0' 
                    : 'transform translate-y-0 opacity-100'
                }`}
              >
                <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 h-full flex flex-col justify-between relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full -translate-y-16 translate-x-16"></div>
                  
                  {/* Quote icon */}
                  <div className="absolute top-6 left-6 text-6xl text-blue-400/30 font-serif leading-none">
                    "
                  </div>
                  
                  <div className="relative z-10">
                    {/* Stars */}
                    <div className="flex items-center mb-6 mt-8">
                      {[...Array(currentTestimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current mr-1"
                        />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-gray-300 text-lg leading-relaxed mb-8 font-medium">
                      {currentTestimonial.content}
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                      {currentTestimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        {currentTestimonial.name}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {currentTestimonial.role}
                      </p>
                      <p className="text-blue-400 text-sm font-medium">
                        {currentTestimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements for visual interest */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;