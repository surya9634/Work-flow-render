import React, { useState } from "react";
import { CheckCircle } from "lucide-react";

const pricingPlans = [
  {
    name: "Starter",
    originalPrice: "$29",
    currentPrice: "Free",
    period: "/month",
    description: "Perfect for small teams and startups.",
    features: [
      "Up to 5 team members",
      "Basic analytics",
      "5GB storage",
      "Email support"
    ],
    popular: false,
    limitedTime: true
  },
  {
    name: "Professional",
    originalPrice: "$79",
    currentPrice: "Free",
    period: "/month",
    description: "Ideal for growing businesses.",
    features: [
      "Up to 20 team members",
      "Advanced analytics",
      "25GB storage",
      "Priority email support",
      "API access"
    ],
    popular: true,
    limitedTime: true
  },
  {
    name: "Enterprise",
    originalPrice: "$199",
    currentPrice: "Free",
    period: "/month",
    description: "For large organizations with complex needs.",
    features: [
      "Unlimited team members",
      "Custom analytics",
      "Unlimited storage",
      "24/7 phone & email support",
      "Advanced API access",
      "Custom integrations"
    ],
    popular: false,
    limitedTime: true
  }
];

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState("Monthly");

  return (
    <section id="pricing" className="py-10 bg-gradient-to-br from-black  to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            Choose Your Plan
          </h2>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="bg-gray-800 rounded-full p-1 flex items-center">
              <button
                onClick={() => setBillingCycle("Monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === "Monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white hover:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("Annually")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === "Annually"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white hover:text-gray-300"
                }`}
              >
                Annually (Save 20%)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`bg-gray-900 rounded-2xl p-4 relative overflow-hidden shadow-lg h-full flex flex-col border ${
                plan.popular ? "ring-2 ring-blue-500 border-blue-500/50" : "border-gray-800"
              }`}
            >
              {/* Limited time badge */}
              {plan.limitedTime && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                  Limited Time
                </div>
              )}

              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8 mt-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {plan.name}
                </h3>
                
                <div className="mb-4">
                  <div className="text-gray-400 line-through text-lg mb-1">
                    {plan.originalPrice}
                  </div>
                  <div className="text-5xl font-bold text-green-400 mb-2">
                    {plan.currentPrice}
                    <span className="text-lg font-normal text-gray-300">
                      {plan.period}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-300">
                  {plan.description}
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <div className="mt-auto">
                <button
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : plan.name === "Enterprise"
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }

        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Pricing;