import { useState, useEffect } from 'react';
import { User, LogIn, BarChart3, Trophy, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { SudokuLogo } from './SudokuLogo';
import { DailyChallenge } from './DailyChallenge';
import { FreePlayCard } from './FreePlayCard';
import { JourneyCard } from './JourneyCard';
import { MainMenuBottomNav } from './MainMenuBottomNav';
import { useTheme } from '../contexts/ThemeContext';
import type { Difficulty } from '../types/difficulty';
import { DIFFICULTIES } from '../types/difficulty';

interface MainMenuProps {
  onNavigate: (screen: 'menu' | 'settings' | 'stats' | 'leaderboard' | 'profile' | 'game' | 'dailyChallenges' | 'variantSelect', options?: { difficulty?: Difficulty; gameType?: 'classic' | 'daily' }) => void;
  onShowAuth: () => void;
  isAuthenticated: boolean;
  username: string;
}

export function MainMenu({ onNavigate, onShowAuth, isAuthenticated, username }: MainMenuProps) {
  const { theme } = useTheme();

  const handleDailyPlay = () => {
    // Generate random difficulty for daily challenge
    const randomDifficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
    onNavigate('game', { difficulty: randomDifficulty, gameType: 'daily' });
  };
  
  const handleFreePlayAgain = (difficulty: string, mode: string) => {
    // Save to localStorage and navigate to variant select
    localStorage.setItem('lastFreePlayDifficulty', difficulty);
    localStorage.setItem('lastFreePlayMode', mode);
    onNavigate('variantSelect');
  };

  const handleFreePlayResume = () => {
    // Resume game in progress with saved difficulty
    const savedDifficulty = localStorage.getItem('lastFreePlayDifficulty') || 'Skilled';
    onNavigate('game', { 
      difficulty: savedDifficulty.toLowerCase() as Difficulty, 
      gameType: 'classic' 
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen space-y-6 md:space-y-8 relative py-8">
      {/* Profile button - Top Right (only when authenticated) */}
      {isAuthenticated && (
        <div className="absolute top-4 md:top-6 right-4 md:right-6 z-10">
          <Button
            onClick={() => onNavigate('profile')}
            className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl shadow-xl transition-all duration-300 group`}
          >
            <User className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">{username}</span>
          </Button>
        </div>
      )}

      {/* Logo/Title */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <SudokuLogo size="md" animated={true} />
        </div>
        <h1 className={`text-3xl md:text-5xl lg:text-6xl ${theme.text.primary}`}>
          Ultimate Sudoku
        </h1>
        <p className={`${theme.text.secondary} text-sm md:text-base`}>
          Daily puzzles. Endless possibilities.
        </p>
      </div>

      {/* Game Mode Cards - Stacked */}
      <div className="w-full max-w-md space-y-3 px-4">
        {/* Daily Challenge */}
        <DailyChallenge 
          onNavigate={handleDailyPlay} 
          onNavigateToCalendar={() => onNavigate('dailyChallenges')}
        />
        
        {/* Free Play */}
        <FreePlayCard 
          onPlay={() => onNavigate('variantSelect')}
          onResume={handleFreePlayResume}
          onPlayAgain={handleFreePlayAgain}
        />
        
        {/* Journey - Coming Soon */}
        <JourneyCard />

        {/* Sign In Button - only when NOT authenticated */}
        {!isAuthenticated && (
          <Button
            onClick={onShowAuth}
            className={`w-full h-10 md:h-12 ${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 mt-2 relative overflow-hidden group/signin`}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 -translate-x-full group-hover/signin:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                animation: 'shimmer 3s ease-in-out infinite',
                animationDelay: '2s',
              }}
            />
            <LogIn className="w-4 h-4 md:w-5 md:h-5 mr-2 relative z-10" />
            <span className="text-xs md:text-sm relative z-10">Sign In to Track Progress</span>
          </Button>
        )}

        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>

        {/* Icon-only tiles */}
        <div className="flex justify-center gap-3 pt-2">
          <Button
            onClick={() => onNavigate('stats')}
            className={`w-12 h-12 md:w-14 md:h-14 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} shadow-xl hover:shadow-2xl transition-all duration-300 group p-0`}
          >
            <BarChart3 className={`w-5 h-5 md:w-6 md:h-6 ${theme.accent} group-hover:scale-110 transition-transform`} />
          </Button>

          <Button
            onClick={() => onNavigate('leaderboard')}
            className={`w-12 h-12 md:w-14 md:h-14 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} shadow-xl hover:shadow-2xl transition-all duration-300 group p-0`}
          >
            <Trophy className={`w-5 h-5 md:w-6 md:h-6 ${theme.accent} group-hover:scale-110 transition-transform`} />
          </Button>

          <Button
            onClick={() => onNavigate('settings')}
            className={`w-12 h-12 md:w-14 md:h-14 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} shadow-xl hover:shadow-2xl transition-all duration-300 group p-0`}
          >
            <Settings className={`w-5 h-5 md:w-6 md:h-6 ${theme.accent} group-hover:scale-110 transition-transform`} />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className={`text-center text-sm ${theme.text.muted}`}>
        <p>Cynnix Studios © 2025</p>
      </div>
    </div>
  );
}