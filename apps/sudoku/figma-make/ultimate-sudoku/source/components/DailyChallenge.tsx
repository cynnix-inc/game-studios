import { Calendar, Clock, Flame, CalendarDays, CheckCircle, Play, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';

interface DailyChallengeProps {
  onNavigate: () => void;
  onNavigateToCalendar?: () => void;
}

export function DailyChallenge({ onNavigate, onNavigateToCalendar }: DailyChallengeProps) {
  const { theme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [status, setStatus] = useState<'play' | 'resume' | 'completed'>('play');

  useEffect(() => {
    // Load daily challenge state
    const dailyProgress = localStorage.getItem('dailyChallengeInProgress');
    const dailyCompleted = localStorage.getItem('dailyChallengeCompleted');
    const today = new Date().toDateString();
    const completedDate = localStorage.getItem('dailyChallengeCompletedDate');
    
    if (dailyCompleted === 'true' && completedDate === today) {
      setStatus('completed');
    } else if (dailyProgress === 'true') {
      setStatus('resume');
    } else {
      setStatus('play');
    }

    // Load streak
    const streak = localStorage.getItem('dailyChallengeStreak');
    if (streak) setCurrentStreak(parseInt(streak));

    // Calculate time until midnight
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 md:p-4 shadow-xl backdrop-blur-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className={`w-7 h-7 md:w-8 md:h-8 ${theme.accent}`} />
            {currentStreak > 0 && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {currentStreak}
              </div>
            )}
          </div>
          <div>
            <h3 className={`${theme.text.primary} text-sm md:text-base`}>Daily Challenge</h3>
            <div className={`flex items-center gap-1.5 ${theme.text.secondary} text-xs`}>
              <Clock className="w-3 h-3" />
              <span>Resets in {timeRemaining}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCalendar && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToCalendar();
              }}
              className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl transition-all duration-300 p-2`}
            >
              <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          )}
          
          <Button 
            className={`${status === 'completed' ? theme.button.secondary.background + ' ' + theme.button.secondary.hover + ' ' + theme.button.secondary.text + ' ' + theme.card.border + ' border' : theme.button.primary.background + ' ' + theme.button.primary.hover + ' ' + theme.button.primary.text} transition-all duration-300 text-xs md:text-sm px-2 py-1.5 md:px-3 md:py-2 ${status === 'completed' ? 'cursor-default' : ''} flex flex-col items-center gap-0.5`}
            onClick={(e) => {
              e.stopPropagation();
              if (status !== 'completed') {
                onNavigate();
              }
            }}
            disabled={status === 'completed'}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {status === 'completed' && <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />}
              {status === 'play' && <Play className="w-3 h-3 md:w-4 md:h-4" />}
              {status === 'resume' && <Play className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" />}
            </div>
            {status === 'resume' && (
              <div className={`w-8 h-0.5 ${theme.button.primary.text} opacity-20 rounded-full overflow-hidden`}>
                <div className={`h-full w-2/3 ${theme.button.primary.text} opacity-80`}></div>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}