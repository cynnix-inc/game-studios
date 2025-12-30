import { Play, Sliders, Gamepad2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface FreePlayCardProps {
  onPlay: () => void;
  onResume: () => void;
  onPlayAgain: (difficulty: string, mode: string) => void;
}

export function FreePlayCard({ onPlay, onResume, onPlayAgain }: FreePlayCardProps) {
  const { theme } = useTheme();
  const [lastDifficulty, setLastDifficulty] = useState<string>('Medium');
  const [lastMode, setLastMode] = useState<string>('Classic');
  const [hasGameInProgress, setHasGameInProgress] = useState<boolean>(false);
  const [gameProgress, setGameProgress] = useState<number>(0);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>('0:00');

  useEffect(() => {
    // Load last settings
    const difficulty = localStorage.getItem('lastFreePlayDifficulty') || 'Medium';
    const mode = localStorage.getItem('lastFreePlayMode') || 'Classic';
    setLastDifficulty(difficulty);
    setLastMode(mode);

    // Check if game in progress
    const inProgress = localStorage.getItem('freePlayInProgress') === 'true';
    setHasGameInProgress(inProgress);

    // Calculate game progress if there's a game in progress
    if (inProgress) {
      try {
        const savedGame = localStorage.getItem('sudokuGame');
        if (savedGame) {
          const gameData = JSON.parse(savedGame);
          // Count filled cells (81 total cells in sudoku)
          let filledCells = 0;
          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (gameData.grid[row][col] !== 0) {
                filledCells++;
              }
            }
          }
          const progress = Math.round((filledCells / 81) * 100);
          console.log('Game Progress:', progress, '% - Filled cells:', filledCells, '/81');
          setGameProgress(progress);
          
          // Get mistakes count
          const mistakesCount = gameData.mistakes || 0;
          setMistakes(mistakesCount);
          
          // Get hints used count
          const hintsCount = gameData.hintsUsed || 0;
          setHintsUsed(hintsCount);
          
          // Get elapsed time
          const time = gameData.elapsedTime || '0:00';
          setElapsedTime(time);
        }
      } catch (error) {
        console.error('Error calculating progress:', error);
        setGameProgress(0);
        setMistakes(0);
        setHintsUsed(0);
        setElapsedTime('0:00');
      }
    }
  }, []);

  const handlePlayAgain = () => {
    onPlayAgain(lastDifficulty, lastMode);
  };

  const handleSetupClick = () => {
    if (hasGameInProgress) {
      setShowAbandonDialog(true);
    } else {
      onPlay();
    }
  };

  const handleAbandonAndSetup = () => {
    // Clear the in-progress game
    localStorage.removeItem('freePlayInProgress');
    setHasGameInProgress(false);
    setShowAbandonDialog(false);
    onPlay();
  };

  return (
    <div 
      className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 md:p-4 shadow-xl backdrop-blur-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg ${theme.button.primary.background} flex items-center justify-center shadow-lg`}>
            <Gamepad2 className={`w-4 h-4 md:w-5 md:h-5 ${theme.button.primary.text}`} />
          </div>
          <div>
            <h3 className={`${theme.text.primary} text-sm md:text-base`}>Free Play</h3>
            <div className={`${theme.text.secondary} text-xs`}>
              {lastDifficulty} • {lastMode}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSetupClick}
            className={`flex-1 ${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl transition-all duration-300 w-9 h-9 p-0`}
          >
            <Sliders className="w-4 h-4" />
          </Button>

          {hasGameInProgress ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onResume}
                    className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 w-9 h-9 p-0 flex flex-col items-center justify-center gap-0.5`}
                  >
                    <Play className="w-4 h-4" fill="currentColor" />
                    {/* Progress bar - always show at least 10% width for visibility */}
                    <div className="w-6 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                      <div 
                        className="h-full" 
                        style={{ 
                          width: `${Math.max(10, gameProgress)}%`,
                          backgroundColor: '#facc15', // yellow-400
                          minWidth: '6px' // Always show at least 6px
                        }}
                      ></div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={`${theme.card.background} ${theme.card.border} border backdrop-blur-xl`}>
                  <div className="text-sm">
                    <div className={theme.text.primary}>Game in Progress</div>
                    <div className={`${theme.text.secondary} text-xs mt-1 space-y-0.5`}>
                      <div>{lastDifficulty} • {lastMode}</div>
                      <div>{gameProgress}% Complete</div>
                      <div>{mistakes} Mistake{mistakes !== 1 ? 's' : ''}</div>
                      <div>{hintsUsed} Hint{hintsUsed !== 1 ? 's' : ''} Used</div>
                      <div>Time Elapsed: {elapsedTime}</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button 
              onClick={handlePlayAgain}
              className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 text-xs md:text-sm px-2 py-1.5 md:px-3 md:py-2`}
            >
              <Play className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon Current Game?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a game in progress. Starting a new setup will abandon your current game and you'll lose all progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbandonAndSetup}>
              Abandon & Setup New Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}