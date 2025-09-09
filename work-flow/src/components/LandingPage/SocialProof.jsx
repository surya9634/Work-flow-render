import React, { useState, useEffect } from "react";

const SocialProof = () => {
  const [counters, setCounters] = useState({
    engagement: 0,
    timeSaved: 0,
    revenue: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    setIsVisible(true);
    
    // Animate counters
    const animateCounter = (target, key, suffix = '') => {
      let current = 0;
      const increment = target / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCounters(prev => ({
          ...prev,
          [key]: Math.floor(current)
        }));
      }, 20);
    };

    const timeout = setTimeout(() => {
      animateCounter(300, 'engagement');
      animateCounter(20, 'timeSaved');
      animateCounter(150, 'revenue');
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const brands = [
    { name: "MICROSOFT" },
    { name: "GOOGLE" },
    { name: "AMAZON" },
    { name: "SALESFORCE" }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className={`text-gray-600 mb-12 text-lg font-medium transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Trusted by 10,000+ businesses worldwide
          </p>
          
          {/* Professional Brand Logos */}
          <div className="flex justify-center items-center space-x-12 mb-8">
            {brands.map((brand, index) => (
              <div
                key={brand.name}
                className={`group cursor-pointer transition-all duration-700 transform ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative">
                  <div className="bg-white border border-gray-200 shadow-sm h-16 w-40 rounded-lg flex items-center justify-center text-gray-700 font-semibold text-sm tracking-wider hover:shadow-md hover:border-gray-300 transition-all duration-300 group-hover:scale-105">
                    {brand.name}
                  </div>
                  <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className={`group transition-all duration-700 transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            <div className="relative bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-gray-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-5xl font-bold text-gray-900 mb-4">
                  {counters.engagement}%
                </div>
                <p className="text-gray-600 text-lg font-medium">Average engagement increase</p>
              </div>
            </div>
          </div>

          <div className={`group transition-all duration-700 transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '800ms' }}>
            <div className="relative bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-gray-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-5xl font-bold text-gray-900 mb-4">
                  {counters.timeSaved}hrs
                </div>
                <p className="text-gray-600 text-lg font-medium">Weekly time savings</p>
              </div>
            </div>
          </div>

          <div className={`group transition-all duration-700 transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '1000ms' }}>
            <div className="relative bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-gray-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-5xl font-bold text-gray-900 mb-4">
                  {counters.revenue}%
                </div>
                <p className="text-gray-600 text-lg font-medium">Revenue growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Testimonial */}
        <div className={`mt-20 text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '1200ms' }}>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-4xl mx-auto">
            <blockquote className="text-xl text-gray-700 mb-6 leading-relaxed">
              "The transformation in our business metrics has been remarkable. Our team productivity increased significantly, and client satisfaction reached new heights."
            </blockquote>
            <div className="flex justify-center items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold border border-gray-200">
                JD
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-semibold">John Davidson</p>
                <p className="text-gray-600 text-sm">CEO, Enterprise Solutions Inc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Call-to-Action */}
        <div className={`mt-16 text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '1400ms' }}>
          <p className="text-gray-600 mb-6">Join thousands of businesses achieving exceptional results</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;