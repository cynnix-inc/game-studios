import { useEffect, useState } from 'react';
import { SudokuLogo } from './SudokuLogo';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading with smooth progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Animated Grid Icon */}
        <div 
          className="p-6 rounded-2xl"
          style={{
            animation: 'fadeIn 0.3s ease-out forwards',
            opacity: 0,
          }}
        >
          <SudokuLogo size="lg" animated darkMode />
        </div>

        {/* Title */}
        <h1 
          className="text-4xl md:text-6xl text-white"
          style={{
            animation: 'fadeIn 0.8s ease-out 0.4s forwards',
            opacity: 0,
          }}
        >
          Ultimate Sudoku
        </h1>

        {/* Progress Bar */}
        <div 
          className="w-64 md:w-80"
          style={{
            animation: 'fadeIn 0.6s ease-out 0.8s forwards',
            opacity: 0,
          }}
        >
          <div className="h-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out rounded-full shadow-lg shadow-purple-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <p 
          className="text-sm md:text-base text-white/70"
          style={{
            animation: 'fadeIn 0.6s ease-out 1s forwards',
            opacity: 0,
          }}
        >
          Loading your puzzle...
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}