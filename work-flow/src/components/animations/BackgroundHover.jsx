import React, { useEffect, useRef, useState } from 'react';

const BackgroundHover = () => {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rows = 20;
  const cols = 25;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };

    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getBoxStyle = (index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const boxWidth = window.innerWidth / cols;
    const boxHeight = window.innerHeight / rows;
    
    const boxCenterX = (col + 0.5) * boxWidth;
    const boxCenterY = (row + 0.5) * boxHeight;
    
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - boxCenterX, 2) + 
      Math.pow(mousePosition.y - boxCenterY, 2)
    );
    
    const boxSize = Math.min(boxWidth, boxHeight);
    
    // Default state - transparent with gray border
    return {
      backgroundColor: 'transparent',
      borderColor: 'rgba(75, 85, 99, 0.2)',
      transform: 'scale(1)',
      transition: 'all 0.3s ease-out'
    };
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-black z-0 overflow-hidden"
    >
      {/* Main grid */}
      <div 
        className="w-full h-full grid gap-[1px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            className="border relative"
            style={getBoxStyle(i)}
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-900/5" />
            
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-2 h-2 bg-gradient-to-br from-gray-400/10 to-transparent" />
          </div>
        ))}
      </div>

      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />
      
      {/* Subtle animated lines */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute bg-gradient-to-r from-transparent via-gray-500/5 to-transparent"
            style={{
              width: '100%',
              height: '1px',
              top: `${(i + 1) * 16.66}%`,
              animation: `slideRight ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
        
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`vline-${i}`}
            className="absolute bg-gradient-to-b from-transparent via-gray-500/5 to-transparent"
            style={{
              height: '100%',
              width: '1px',
              left: `${(i + 1) * 20}%`,
              animation: `slideDown ${10 + i * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-3 h-3 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes slideRight {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(100%); opacity: 1; }
        }
        
        @keyframes slideDown {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
          50% { transform: translateY(100%); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.1; 
          }
          25% { 
            transform: translate(10px, -15px) scale(1.2); 
            opacity: 0.2; 
          }
          50% { 
            transform: translate(-5px, -25px) scale(0.8); 
            opacity: 0.3; 
          }
          75% { 
            transform: translate(-15px, -10px) scale(1.1); 
            opacity: 0.4; 
          }
        }
      `}</style>
    </div>
  );
};

export default BackgroundHover;