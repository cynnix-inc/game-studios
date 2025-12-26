import { Calendar, Flame, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';

interface DailyChallengeProps {
  onNavigate: () => void;
}

export function DailyChallenge({ onNavigate }: DailyChallengeProps) {
  const { theme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState('');

  // Mock data - In production, this would come from your backend
  const isCompleted = false; // Today's challenge completion status
  const todayScore = 1250; // Score if completed
  const currentStreak = 5; // Days in a row

  useEffect(() => {
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
      className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 md:p-5 shadow-xl backdrop-blur-xl ${theme.card.hover} cursor-pointer transition-all duration-300 group`}
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <Calendar className={`w-8 h-8 md:w-9 md:h-9 ${theme.accent}`} />
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-lg">
              DAILY
            </div>
          </div>
          <div>
            <h3 className={`${theme.text.primary} text-base md:text-lg`}>Daily Challenge</h3>
            <div className={`flex items-center gap-1.5 ${theme.text.secondary} text-xs md:text-sm`}>
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span>Resets in {timeRemaining}</span>
            </div>
          </div>
        </div>

        {currentStreak > 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 ${theme.card.background} ${theme.card.border} border rounded-full`}>
            <Flame className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
            <span className={`${theme.text.primary} text-sm`}>{currentStreak}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              <div>
                <p className={`${theme.text.primary} text-sm md:text-base`}>Completed!</p>
                <p className={`${theme.text.secondary} text-xs md:text-sm`}>Score: {todayScore}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className={`${theme.text.primary} text-sm md:text-base`}>Ready to play</p>
              <p className={`${theme.text.secondary} text-xs md:text-sm`}>Complete today's challenge</p>
            </div>
          )}
        </div>

        <Button 
          className={`${isCompleted ? theme.button.secondary.background + ' ' + theme.button.secondary.hover + ' ' + theme.button.secondary.text : theme.button.primary.background + ' ' + theme.button.primary.hover + ' ' + theme.button.primary.text} transition-all duration-300 group-hover:scale-105 text-sm md:text-base px-3 py-2 md:px-4`}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
        >
          {isCompleted ? 'View Results' : 'Play Now'}
        </Button>
      </div>
    </div>
  );
}