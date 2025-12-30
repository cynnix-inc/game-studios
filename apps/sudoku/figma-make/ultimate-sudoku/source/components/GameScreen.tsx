import { useState, useEffect } from 'react';
import { Menu, Pause, Play, Clock, User, Lightbulb, AlertTriangle, Trophy, XCircle, Sliders, Calendar, Star } from 'lucide-react';
import { Button } from './ui/button';
import { InGameMenu } from './InGameMenu';
import { Sudoku } from './Sudoku';
import { GridCustomizer } from './GridCustomizer';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Difficulty } from '../types/difficulty';

interface GameScreenProps {
  onExit: () => void;
  username: string;
  difficulty?: Difficulty;
  gameType?: 'classic' | 'daily';
  onNavigateToSetup?: () => void;
  onNavigateToDailyChallenges?: () => void;
}

export function GameScreen({ onExit, username, difficulty = 'skilled', gameType = 'classic', onNavigateToSetup, onNavigateToDailyChallenges }: GameScreenProps) {
  const { theme } = useTheme();
  const settings = useSettings();
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoResumeNeeded, setAutoResumeNeeded] = useState(false); // For auto-pause from visibility change
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showGridCustomizer, setShowGridCustomizer] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [isCracking, setIsCracking] = useState(false);

  // Auto-pause on visibility change (tab switch, backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab/app went to background - auto-pause
        setIsPaused(true);
        setAutoResumeNeeded(true);
        setShowMenu(false); // Don't show menu, just pause
      }
      // When coming back to visible, autoResumeNeeded will trigger the resume overlay
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Developer menu triggers
  useEffect(() => {
    const handleDevTrigger = (e: CustomEvent) => {
      const state = e.detail as 'pause' | 'win' | 'lose';
      
      switch (state) {
        case 'pause':
          // Trigger auto-pause overlay (Welcome Back screen)
          setIsPaused(true);
          setAutoResumeNeeded(true);
          setShowMenu(false);
          break;
        case 'win':
          setGameWon(true);
          break;
        case 'lose':
          setGameLost(true);
          break;
      }
      
      // Clear the trigger
      sessionStorage.removeItem('devTrigger');
    };

    window.addEventListener('devTrigger' as any, handleDevTrigger as EventListener);
    return () => window.removeEventListener('devTrigger' as any, handleDevTrigger as EventListener);
  }, []);

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

  const handleAutoResume = () => {
    setAutoResumeNeeded(false);
    setIsPaused(false);
  };

  const handleRestart = () => {
    setScore(0);
    setTimeElapsed(0);
    setMistakes(0);
    setHintsUsed(0);
    setShowMenu(false);
    setIsPaused(false);
    setGameWon(false);
    setGameLost(false);
  };

  const handleGameWin = () => {
    setScore(score + 250);
    setGameWon(true);
  };

  const handleMistake = () => {
    setMistakes(prev => prev + 1);
    if (mistakes >= 3) {
      setGameLost(true);
      // Clear saved game state on game over
      localStorage.removeItem('sudokuGameState');
    }
  };

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1);
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'novice': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'skilled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'advanced': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'expert': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'fiendish': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ultimate': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'novice': return 'Novice';
      case 'skilled': return 'Skilled';
      case 'advanced': return 'Advanced';
      case 'expert': return 'Expert';
      case 'fiendish': return 'Fiendish';
      case 'ultimate': return 'Ultimate';
      default: return difficulty;
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
                
                {/* Desktop: Full layout */}
                <div className="hidden sm:flex items-center gap-2 md:gap-3">
                  <div>
                    <p className={`text-xs ${theme.text.muted}`}>
                      {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                    </p>
                    <div className={`text-xs px-2 py-0.5 rounded-full border backdrop-blur-xl inline-block capitalize mt-0.5 ${getDifficultyColor()}`}>
                      {difficulty}
                    </div>
                  </div>
                </div>

                {/* Mobile: Compact layout with game type */}
                <div className="sm:hidden">
                  <p className={`text-xs ${theme.text.muted} mb-0.5`}>
                    {gameType === 'daily' ? 'Daily' : 'Classic'}
                  </p>
                  <div className={`text-xs px-2 py-0.5 rounded-full border backdrop-blur-xl inline-block capitalize ${getDifficultyColor()}`}>
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
          onOpenGridCustomizer={() => setShowGridCustomizer(true)}
        />
      </div>

      {/* Auto-Resume Overlay - Full screen blur that masks puzzle */}
      {autoResumeNeeded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl shadow-2xl backdrop-blur-xl w-full max-w-[90%] sm:max-w-md animate-in zoom-in-95 duration-300`}>
            {/* Content Container with consistent padding and spacing */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${theme.button.primary.background} flex items-center justify-center`}>
                  <Play className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.button.primary.text}`} />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className={`text-2xl sm:text-3xl ${theme.text.primary}`}>Welcome Back!</h2>
                <p className={`text-sm sm:text-base ${theme.text.secondary}`}>Your game was paused while you were away</p>
              </div>

              {/* Stats Summary */}
              <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Game Type</span>
                  <span className={`text-sm ${theme.text.primary}`}>
                    {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Difficulty</span>
                  <div className={`text-xs px-2.5 py-1 rounded-lg border ${theme.card.border} ${theme.button.secondary.background} backdrop-blur-xl inline-flex items-center gap-1.5`}>
                    <span className={getDifficultyColor()}>●</span>
                    <span className={theme.text.primary}>{getDifficultyLabel()}</span>
                  </div>
                </div>
                <div className={`border-t ${theme.card.border} my-2`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Time Elapsed</span>
                  <span className={`text-sm ${theme.text.primary} font-mono`}>{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Mistakes</span>
                  <span className={`text-sm ${mistakes > 3 ? 'text-red-400' : theme.text.primary}`}>{mistakes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Hints Used</span>
                  <span className={`text-sm ${theme.text.primary}`}>{hintsUsed}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleAutoResume}
                  className={`w-full ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 h-12 sm:h-auto`}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume Game
                </Button>
                <Button
                  onClick={onExit}
                  variant="ghost"
                  className={`w-full ${theme.text.secondary} ${theme.card.hover} transition-all duration-300 h-12 sm:h-auto`}
                >
                  Exit to Menu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Victory Overlay */}
      {gameWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl shadow-2xl backdrop-blur-xl w-full max-w-[90%] sm:max-w-md animate-in zoom-in-95 duration-500`}>
            {/* Content Container with consistent padding and spacing */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Icon with Trophy */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-900" />
                  
                  {/* Orbiting stars with trail effect */}
                  <div className="absolute inset-0">
                    {/* Star 1 - faster orbit */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit">
                      <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    </div>
                    {/* Star 1 trail - slight delay and opacity */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit opacity-40" style={{ animationDelay: '0.1s' }}>
                      <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    </div>
                    
                    {/* Star 2 - slower orbit, opposite direction */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit 4s linear infinite reverse' }}>
                      <Star className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                    </div>
                    {/* Star 2 trail */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" style={{ animation: 'orbit 4s linear infinite reverse', animationDelay: '0.15s' }}>
                      <Star className="w-2 h-2 text-yellow-200 fill-yellow-200" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2 animate-in slide-in-from-bottom duration-500">
                <h2 className="text-3xl sm:text-4xl text-yellow-400 drop-shadow-lg">Victory!</h2>
                <p className={`text-sm sm:text-base ${theme.text.secondary}`}>Congratulations! You've solved the puzzle</p>
              </div>

              {/* Stats Summary */}
              <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom duration-700`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Game Type</span>
                  <span className={`text-sm ${theme.text.primary}`}>
                    {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Difficulty</span>
                  <div className={`text-xs px-2.5 py-1 rounded-lg border ${theme.card.border} ${theme.button.secondary.background} backdrop-blur-xl inline-flex items-center gap-1.5`}>
                    <span className={getDifficultyColor()}>●</span>
                    <span className={theme.text.primary}>{getDifficultyLabel()}</span>
                  </div>
                </div>
                <div className={`border-t ${theme.card.border} my-2`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Time</span>
                  <span className={`text-sm ${theme.text.primary} font-mono`}>{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Mistakes</span>
                  <span className={`text-sm ${theme.text.primary}`}>{mistakes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Hints Used</span>
                  <span className={`text-sm ${theme.text.primary}`}>{hintsUsed}</span>
                </div>
                <div className={`border-t ${theme.card.border} my-2`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Score</span>
                  <span className="text-lg text-yellow-400 animate-pulse">+{score}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 animate-in slide-in-from-bottom duration-1000">
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (gameType === 'daily' && onNavigateToDailyChallenges) {
                        onNavigateToDailyChallenges();
                      } else if (gameType === 'classic' && onNavigateToSetup) {
                        onNavigateToSetup();
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className={`${theme.text.secondary} ${theme.card.hover} ${theme.card.border} border transition-all duration-300 w-12 h-12 sm:w-12 sm:h-12 shrink-0`}
                  >
                    {gameType === 'daily' ? <Calendar className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={handleRestart}
                    className={`flex-1 ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 h-12 sm:h-12`}
                  >
                    Play Again
                  </Button>
                </div>
                <Button
                  onClick={onExit}
                  variant="ghost"
                  className={`w-full ${theme.text.secondary} ${theme.card.hover} transition-all duration-300 h-12 sm:h-auto`}
                >
                  Back to Menu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Defeat Overlay */}
      {gameLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl shadow-2xl backdrop-blur-xl w-full max-w-[90%] sm:max-w-md animate-in zoom-in-95 shake duration-500`}>
            {/* Content Container with consistent padding and spacing */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Icon with X Circle */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                  <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-200" />
                  {/* Subtle pulsing glow */}
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" style={{ animationDuration: '2s' }} />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2 animate-in slide-in-from-bottom duration-500">
                <h2 className="text-3xl sm:text-4xl text-red-400 drop-shadow-lg">Game Over</h2>
                <p className={`text-sm sm:text-base ${theme.text.secondary}`}>You've made too many mistakes</p>
              </div>

              {/* Stats Summary */}
              <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom duration-700`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Game Type</span>
                  <span className={`text-sm ${theme.text.primary}`}>
                    {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Difficulty</span>
                  <div className={`text-xs px-2.5 py-1 rounded-lg border ${theme.card.border} ${theme.button.secondary.background} backdrop-blur-xl inline-flex items-center gap-1.5`}>
                    <span className={getDifficultyColor()}>●</span>
                    <span className={theme.text.primary}>{getDifficultyLabel()}</span>
                  </div>
                </div>
                <div className={`border-t ${theme.card.border} my-2`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Time Survived</span>
                  <span className={`text-sm ${theme.text.primary} font-mono`}>{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Mistakes</span>
                  <span className="text-sm text-red-400">{mistakes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text.secondary}`}>Hints Used</span>
                  <span className={`text-sm ${theme.text.primary}`}>{hintsUsed}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 animate-in slide-in-from-bottom duration-1000">
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (gameType === 'daily' && onNavigateToDailyChallenges) {
                        onNavigateToDailyChallenges();
                      } else if (gameType === 'classic' && onNavigateToSetup) {
                        onNavigateToSetup();
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className={`${theme.text.secondary} ${theme.card.hover} ${theme.card.border} border transition-all duration-300 w-12 h-12 sm:w-12 sm:h-12 shrink-0`}
                  >
                    {gameType === 'daily' ? <Calendar className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={handleRestart}
                    className={`flex-1 ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 h-12 sm:h-12`}
                  >
                    Try Again
                  </Button>
                </div>
                <Button
                  onClick={onExit}
                  variant="ghost"
                  className={`w-full ${theme.text.secondary} ${theme.card.hover} transition-all duration-300 h-12 sm:h-auto`}
                >
                  Back to Menu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Content */}
      <div className="pt-16 md:pt-20 pb-4 px-0 flex items-center justify-center min-h-screen">
        <Sudoku 
          onWin={handleGameWin} 
          difficulty={difficulty}
          onMistake={handleMistake}
          onHintUsed={handleHintUsed}
          mistakes={mistakes}
          hintsUsed={hintsUsed}
        />
      </div>

      {/* Grid Customizer */}
      {showGridCustomizer && (
        <GridCustomizer
          initialSettings={{
            gridSize: settings.gridSize,
            digitSize: settings.digitSize,
            noteSize: settings.noteSize,
            highlightContrast: settings.highlightContrast,
            highlightAssistance: settings.highlightAssistance,
          }}
          onSave={(newSettings) => {
            settings.setGridSize(newSettings.gridSize);
            settings.setDigitSize(newSettings.digitSize);
            settings.setNoteSize(newSettings.noteSize);
            settings.setHighlightContrast(newSettings.highlightContrast);
            settings.setHighlightAssistance(newSettings.highlightAssistance);
            setShowGridCustomizer(false);
          }}
          onCancel={() => setShowGridCustomizer(false)}
        />
      )}
    </div>
  );
}