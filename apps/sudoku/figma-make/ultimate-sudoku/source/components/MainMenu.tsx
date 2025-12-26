import { Play, Settings, Trophy, BarChart3, User, LogIn, Grid3x3 } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { DailyChallenge } from './DailyChallenge';

interface MainMenuProps {
  onNavigate: (screen: 'menu' | 'settings' | 'stats' | 'leaderboard' | 'profile' | 'game' | 'dailyChallenges' | 'difficulty') => void;
  onShowAuth: () => void;
  isAuthenticated: boolean;
  username: string;
}

export function MainMenu({ onNavigate, onShowAuth, isAuthenticated, username }: MainMenuProps) {
  const { theme } = useTheme();
  
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen space-y-4 md:space-y-6 relative">
      {/* Account Controls - Top Right */}
      <div className="absolute top-4 md:top-8 right-4 md:right-8 z-10">
        {!isAuthenticated ? (
          <Button
            onClick={onShowAuth}
            className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl shadow-xl transition-all duration-300`}
          >
            <LogIn className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">Sign In</span>
          </Button>
        ) : (
          <Button
            onClick={() => onNavigate('profile')}
            className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl shadow-xl transition-all duration-300 group`}
          >
            <User className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">{username}</span>
          </Button>
        )}
      </div>

      {/* Logo/Title */}
      <div className="text-center space-y-2 md:space-y-4">
        <div className={`inline-block p-6 md:p-8 rounded-3xl ${theme.card.background} ${theme.card.border} border shadow-2xl backdrop-blur-xl`}>
          <Grid3x3 className={`w-12 h-12 md:w-20 md:h-20 ${theme.accent}`} />
        </div>
        <h1 className={`text-3xl md:text-5xl lg:text-6xl ${theme.text.primary}`}>
          Ultimate Sudoku
        </h1>
        <p className={`text-base md:text-lg ${theme.accent}`}>
          {isAuthenticated ? `Welcome back, ${username}!` : 'Master the Classic Puzzle'}
        </p>
      </div>

      {/* Daily Challenge Featured Card */}
      <div className="w-full max-w-md px-4">
        <DailyChallenge onNavigate={() => onNavigate('dailyChallenges')} />
      </div>

      {/* Main Menu Buttons */}
      <div className="w-full max-w-md space-y-3 px-4">
        <Button
          onClick={() => onNavigate('game')}
          className={`w-full h-14 md:h-16 ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} backdrop-blur-xl ${theme.card.border} border shadow-xl hover:shadow-2xl transition-all duration-300 group`}
        >
          <Play className="w-5 h-5 md:w-6 md:h-6 mr-3 group-hover:scale-110 transition-transform" />
          <span className="text-base md:text-lg">Play Game</span>
        </Button>

        {/* Icon-only tiles */}
        <div className="flex justify-center gap-3 md:gap-4 pt-4 md:pt-6">
          <Button
            onClick={() => onNavigate('stats')}
            className={`w-14 h-14 md:w-16 md:h-16 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} shadow-xl hover:shadow-2xl transition-all duration-300 group p-0`}
          >
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </Button>

          <Button
            onClick={() => onNavigate('leaderboard')}
            className={`w-14 h-14 md:w-16 md:h-16 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} shadow-xl hover:shadow-2xl transition-all duration-300 group p-0`}
          >
            <Trophy className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </Button>

          <Button
            onClick={() => onNavigate('settings')}
            className={`w-14 h-14 md:w-16 md:h-16 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} shadow-xl hover:shadow-2xl transition-all duration-300 group p-0`}
          >
            <Settings className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
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