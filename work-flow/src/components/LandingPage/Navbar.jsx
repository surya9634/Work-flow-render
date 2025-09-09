import React from "react";
import { Menu, X, Zap } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ onOpenModal, isMenuOpen, toggleMenu }) => {
  const handleNavClick = (sectionId) => {
    // Close mobile menu when clicking a nav item
    if (isMenuOpen) {
      toggleMenu();
    }
  };

  return (
    <nav className="mx-4 sm:mx-6 lg:mx-8 rounded-xl shadow-2xl shadow-white/20 bg-black backdrop-blur-md border border-white/20 sticky top-6 z-101 transition-all duration-300 hover:shadow-white/40 hover:shadow-2xl" style={{ maxWidth: 'calc(100% - 200px)', margin: '0 auto' }}>
      {/* White glow effect background */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-white/20 via-white/30 to-white/20 opacity-50 blur-sm pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-white/90 to-white/70 rounded-lg flex items-center justify-center shadow-md shadow-white/30">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,1)] transition-all duration-300">
              Workflow
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {["features", "pricing", "testimonials"].map((section) => (
                <a
                  key={section}
                  href={`#${section}`}
                  onClick={() => handleNavClick(section)}
                  className="group relative text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                  <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-gradient-to-r from-white to-white/80 transition-all duration-300 group-hover:w-full rounded-full shadow-sm shadow-white/50"></span>
                </a>
              ))}
              {/* Theme Toggle */}
              <ThemeToggle isDark={true} toggleTheme={() => {}} />

              <button
                className="bg-gradient-to-r from-white/90 to-white/70 text-black px-6 py-2 rounded-lg text-sm font-medium hover:from-white hover:to-white/90 transition-all duration-300 shadow-lg shadow-white/30 hover:shadow-white/50 hover:scale-105 transform drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                onClick={onOpenModal}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-gray-800 transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/20 rounded-b-xl px-4 pt-4 pb-6 animate-fadeIn">
          <div className="space-y-1">
            {["features", "pricing", "testimonials"].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                onClick={() => handleNavClick(section)}
                className="block group relative px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                <span className="absolute left-3 -bottom-0.5 w-0 h-0.5 bg-gradient-to-r from-white to-white/80 transition-all duration-300 group-hover:w-6 rounded-full"></span>
              </a>
            ))}
          </div>
          <button
            className="w-full mt-4 bg-gradient-to-r from-white/90 to-white/70 text-black px-4 py-3 rounded-lg text-sm font-medium hover:from-white hover:to-white/90 transition-all duration-300 shadow-md hover:shadow-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
            onClick={(e) => {
              onOpenModal();
              toggleMenu();
            }}
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;