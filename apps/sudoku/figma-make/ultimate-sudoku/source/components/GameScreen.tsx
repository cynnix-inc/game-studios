import { useState, useEffect } from 'react';
import { Menu, Pause, Play, Clock, User, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { InGameMenu } from './InGameMenu';
import { Sudoku } from './Sudoku';
import { useTheme } from '../contexts/ThemeContext';

interface GameScreenProps {
  onExit: () => void;
  username: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  gameType?: 'classic' | 'daily';
}

export function GameScreen({ onExit, username, difficulty = 'medium', gameType = 'classic' }: GameScreenProps) {
  const { theme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setTimeElapsed((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    setShowMenu(newPausedState);
  };

  const handleResume = () => {
    setShowMenu(false);
    setIsPaused(false);
  };

  const handleRestart = () => {
    setScore(0);
    setTimeElapsed(0);
    setMistakes(0);
    setHintsUsed(0);
    setShowMenu(false);
    setIsPaused(false);
  };

  const handleGameWin = () => {
    setScore(score + 250);
  };

  const handleMistake = () => {
    setMistakes(prev => prev + 1);
  };

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1);
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'expert': return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Enhanced Game Header */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <div className={`${theme.card.background} backdrop-blur-xl border-b ${theme.card.border} px-3 md:px-6 py-3 md:py-4`}>
          <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-2 md:gap-4">
            
              {/* Left: Menu + Game Type + Difficulty */}
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  onClick={handlePause}
                  variant="ghost"
                  size="icon"
                  className={`${theme.text.primary} ${theme.card.hover} shrink-0`}
                >
                  {isPaused ? <Play className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
                </Button>
                
                <div className="hidden sm:flex items-center gap-2 md:gap-3">
                  <div>
                    <p className={`text-xs ${theme.text.muted}`}>
                      {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                    </p>
                    <div className={`text-xs px-2 py-0.5 rounded border ${getDifficultyColor()} inline-block capitalize mt-0.5`}>
                      {difficulty}
                    </div>
                  </div>
                </div>

                {/* Mobile: Compact difficulty badge */}
                <div className="sm:hidden">
                  <div className={`text-xs px-2 py-1 rounded border ${getDifficultyColor()} capitalize`}>
                    {difficulty}
                  </div>
                </div>
              </div>

              {/* Center: Game Stats */}
              <div className="flex items-center gap-3 md:gap-6">
                {/* Mistakes */}
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 md:w-5 md:h-5 ${mistakes > 3 ? 'text-red-400' : theme.text.muted}`} />
                  <div>
                    <p className={`text-xs hidden md:block ${theme.text.muted}`}>Mistakes</p>
                    <p className={`text-sm md:text-base ${mistakes > 3 ? 'text-red-400' : theme.text.primary}`}>
                      {mistakes}
                    </p>
                  </div>
                </div>

                {/* Hints */}
                <div className="flex items-center gap-1.5">
                  <Lightbulb className={`w-4 h-4 md:w-5 md:h-5 ${theme.text.muted}`} />
                  <div>
                    <p className={`text-xs hidden md:block ${theme.text.muted}`}>Hints</p>
                    <p className={`text-sm md:text-base ${theme.text.primary}`}>
                      {hintsUsed}
                    </p>
                  </div>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 md:w-5 md:h-5 ${theme.text.muted}`} />
                  <div>
                    <p className={`text-xs hidden md:block ${theme.text.muted}`}>Time</p>
                    <p className={`text-sm md:text-base ${theme.text.primary} font-mono`}>
                      {formatTime(timeElapsed)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Profile */}
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right">
                  <p className={`text-xs ${theme.text.muted}`}>Player</p>
                  <p className={`text-sm ${theme.text.primary}`}>{username || 'Guest'}</p>
                </div>
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full ${theme.button.secondary.background} ${theme.card.border} border flex items-center justify-center shrink-0`}>
                  <User className={`w-5 h-5 md:w-6 md:h-6 ${theme.text.primary}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blur overlay when menu is open - covers everything except header */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-20"
          style={{ top: '64px' }} // Start below header (4rem = 64px on mobile)
          onClick={handleResume}
        />
      )}

      {/* In-game menu slide-down */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out ${
          showMenu ? 'translate-y-16 md:translate-y-20' : '-translate-y-full'
        }`}
      >
        <InGameMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onExit={onExit}
        />
      </div>

      {/* Main Game Content */}
      <div className="pt-16 md:pt-20 pb-4 px-0 flex items-center justify-center min-h-screen">
        <div className="w-full">
          <Sudoku 
            onWin={handleGameWin} 
            difficulty={difficulty}
            onMistake={handleMistake}
            onHintUsed={handleHintUsed}
            mistakes={mistakes}
            hintsUsed={hintsUsed}
          />
        </div>
      </div>
    </div>
  );
}