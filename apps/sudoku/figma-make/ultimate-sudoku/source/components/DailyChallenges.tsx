import { ArrowLeft, Calendar, Flame, Trophy, Clock, Play, CheckCircle, Lock, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import type { Difficulty } from '../types/difficulty';

interface DailyChallengesProps {
  onBack: () => void;
  username: string;
  onPlayToday?: () => void;
  onPlayArchive?: (date: Date) => void;
}

// Mock data - In production, this would come from your backend
const generateMockCalendarData = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const difficulties: Difficulty[] = ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'];
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, completed: false, score: 0 });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const isPast = i < today.getDate();
    const isToday = i === today.getDate();
    const completed = isPast ? Math.random() > 0.35 : isToday ? false : false; // 65% completion rate for past days, today not completed yet
    const score = completed ? Math.floor(Math.random() * 2000) + 500 : 0;
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const time = completed ? Math.floor(Math.random() * 600) + 120 : 0; // 2-12 minutes
    const mistakes = completed ? Math.floor(Math.random() * 3) : 0;
    
    days.push({
      date: i,
      completed,
      score,
      isToday,
      isFuture: i > today.getDate(),
      difficulty,
      time,
      mistakes
    });
  }
  
  return days;
};

// Generate rolling 7-day view (last 6 days + today)
const generateRolling7Days = (calendarData: any[]) => {
  const today = new Date();
  const rolling = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dayData = calendarData.find(d => d.date === date.getDate() && !d.isFuture);
    
    rolling.push({
      date: date.getDate(),
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      isToday: i === 0,
      completed: dayData?.completed || false,
      difficulty: dayData?.difficulty,
      time: dayData?.time,
      score: dayData?.score,
      fullDate: date
    });
  }
  
  return rolling;
};

// Calculate current streak
const calculateStreak = (calendarData: any[]) => {
  const today = new Date().getDate();
  let streak = 0;
  
  // Start from yesterday and go backwards
  for (let i = today - 1; i >= 1; i--) {
    const day = calendarData.find(d => d.date === i);
    if (day && day.completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const getDifficultyColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'novice': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' };
    case 'skilled': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' };
    case 'advanced': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' };
    case 'expert': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' };
    case 'fiendish': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' };
    case 'ultimate': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-400' };
  }
};

const getDifficultyLabel = (difficulty: Difficulty) => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Countdown Timer Component
function CountdownTimer() {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`text-[10px] sm:text-xs ${theme.text.muted} flex flex-col items-center gap-0.5`}>
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="whitespace-nowrap">Next in</span>
      </div>
      <span className="whitespace-nowrap">{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
    </div>
  );
}

export function DailyChallenges({ onBack, username, onPlayToday, onPlayArchive }: DailyChallengesProps) {
  const { theme } = useTheme();
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  
  const calendarData = generateMockCalendarData();
  const rolling7Days = generateRolling7Days(calendarData);
  const currentStreak = calculateStreak(calendarData);
  const todayChallenge = calendarData.find(day => day.isToday);
  
  // Calculate stats
  const completedDays = calendarData.filter(d => d.completed && d.date > 0);
  const stats = {
    currentStreak,
    totalCompleted: completedDays.length,
    daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
    bestTime: completedDays.length > 0 ? Math.min(...completedDays.map(d => d.time)) : 0
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 px-4 flex-shrink-0">
        <Button
          onClick={onBack}
          className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300 p-2`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className={`text-2xl md:text-3xl ${theme.text.primary}`}>Daily Challenge</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Stats Row - Consolidated at top */}
        <div className="grid grid-cols-4 gap-2">
          {/* Current Streak */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 backdrop-blur-xl text-center`}>
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className={`text-xl ${theme.text.primary}`}>{stats.currentStreak}</p>
            <p className={`text-xs ${theme.text.muted} mt-0.5`}>Streak</p>
          </div>

          {/* This Month */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 backdrop-blur-xl text-center`}>
            <Calendar className={`w-5 h-5 ${theme.accent} mx-auto mb-1`} />
            <p className={`text-xl ${theme.text.primary}`}>{stats.totalCompleted}/{stats.daysInMonth}</p>
            <p className={`text-xs ${theme.text.muted} mt-0.5`}>Month</p>
          </div>

          {/* Best Time */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 backdrop-blur-xl text-center`}>
            <Clock className={`w-5 h-5 ${theme.accent} mx-auto mb-1`} />
            <p className={`text-xl ${theme.text.primary}`}>{stats.bestTime > 0 ? formatTime(stats.bestTime) : '--'}</p>
            <p className={`text-xs ${theme.text.muted} mt-0.5`}>Best</p>
          </div>

          {/* Total Completed */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 backdrop-blur-xl text-center`}>
            <Trophy className={`w-5 h-5 ${theme.accent} mx-auto mb-1`} />
            <p className={`text-xl ${theme.text.primary}`}>{stats.totalCompleted}</p>
            <p className={`text-xs ${theme.text.muted} mt-0.5`}>Total</p>
          </div>
        </div>

        {/* Today's Challenge Card */}
        {todayChallenge && (
          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl shadow-xl backdrop-blur-xl`}>
            {todayChallenge.completed ? (
              // Completed State
              <div className="text-center space-y-6 p-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                  <span className={`text-2xl ${theme.text.primary}`}>Challenge Complete!</span>
                </div>
                
                <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-5`}>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className={`text-xs ${theme.text.muted} mb-2`}>Time</p>
                      <p className={`text-2xl ${theme.text.primary}`}>{formatTime(todayChallenge.time)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme.text.muted} mb-2`}>Score</p>
                      <p className={`text-2xl ${theme.text.primary}`}>{todayChallenge.score}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme.text.muted} mb-2`}>Mistakes</p>
                      <p className={`text-2xl ${theme.text.primary}`}>{todayChallenge.mistakes}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onPlayToday}
                  className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300 px-8 py-3`}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Again
                </Button>

                <CountdownTimer />
              </div>
            ) : (
              // Play Now State - Option H Design
              <div className="p-4 md:p-6 md:px-8 lg:px-10">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                  {/* Left: Info - Left Aligned */}
                  <div className="flex-1 flex flex-col justify-center items-start space-y-1.5 sm:space-y-2 min-w-0 overflow-hidden">
                    <p className={`text-[10px] sm:text-xs ${theme.text.muted} uppercase tracking-wider`}>Today</p>
                    
                    <h2 className={`text-xl sm:text-2xl md:text-3xl ${theme.text.primary} whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}>
                      {monthNames[new Date().getMonth()]} {todayChallenge.date}
                    </h2>
                    
                    <div className={`inline-flex px-2 sm:px-2.5 md:px-3 py-0.5 rounded-lg border text-[10px] sm:text-xs md:text-sm ${getDifficultyColor(todayChallenge.difficulty).bg} ${getDifficultyColor(todayChallenge.difficulty).text} ${getDifficultyColor(todayChallenge.difficulty).border}`}>
                      {getDifficultyLabel(todayChallenge.difficulty)}
                    </div>
                  </div>

                  {/* Right: Circular Button and Countdown */}
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                    {/* Circular Button with Premium Glow */}
                    <button
                      onClick={onPlayToday}
                      className={`w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 flex items-center justify-center`}
                      style={{
                        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 8px 25px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 fill-current" />
                    </button>

                    {/* Countdown - 2 lines, smaller on mobile */}
                    <CountdownTimer />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rolling 7-Day Week View */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-xl`}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className={`${theme.text.primary}`}>This Week</h3>
            <p className={`text-xs ${theme.text.muted}`}>Tap to play</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {rolling7Days.map((day, index) => (
              <div key={index} className="text-center">
                <p className={`text-[10px] md:text-xs ${theme.text.muted} mb-1.5 md:mb-2`}>{day.dayName}</p>
                <button
                  onClick={() => {
                    if (day.isToday && onPlayToday) {
                      onPlayToday();
                    } else if (!day.isToday && onPlayArchive) {
                      onPlayArchive(day.fullDate);
                    }
                  }}
                  className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-300 relative text-sm md:text-base group ${
                    day.isToday
                      ? `${theme.button.primary.background} ${theme.button.primary.text} shadow-lg hover:scale-105 hover:shadow-xl animate-pulse`
                      : day.completed
                      ? `${theme.card.background} ${theme.card.border} border ${theme.card.hover} ring-1 ring-green-500/30 hover:scale-105 hover:ring-2`
                      : `${theme.card.background} ${theme.card.border} border ${theme.card.hover} hover:scale-105`
                  }`}
                  style={day.isToday ? { animationDuration: '3s' } : undefined}
                >
                  <span className={`${day.isToday ? theme.button.primary.text : theme.text.primary}`}>
                    {day.date}
                  </span>
                  {/* Completed checkmark - larger, more prominent */}
                  {day.completed && !day.isToday && (
                    <CheckCircle className={`w-4 h-4 md:w-5 md:h-5 absolute top-0.5 right-0.5 text-green-500`} />
                  )}
                  {/* Difficulty dot - all past/present days */}
                  {day.difficulty && (
                    <>
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getDifficultyColor(day.difficulty).dot} absolute bottom-1 md:bottom-1.5`} />
                      {/* Tooltip on hover - positioned relative to button */}
                      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10`}
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {getDifficultyLabel(day.difficulty)}
                      </div>
                    </>
                  )}
                  {day.isToday && (
                    <div className={`text-[8px] md:text-[10px] mt-0.5 ${theme.button.primary.text} opacity-75`}>Today</div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Full Calendar */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 shadow-xl backdrop-blur-xl`}>
          <button
            onClick={() => setShowFullCalendar(!showFullCalendar)}
            className={`w-full flex items-center justify-between ${theme.card.hover} rounded-lg p-3 transition-all duration-300`}
          >
            <span className={`${theme.text.primary}`}>View Full Calendar</span>
            {showFullCalendar ? (
              <ChevronUp className={`w-5 h-5 ${theme.text.secondary}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${theme.text.secondary}`} />
            )}
          </button>

          {showFullCalendar && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="mb-4">
                <h3 className={`${theme.text.primary} text-center`}>
                  {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
                </h3>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-2">
                {dayNames.map(day => (
                  <div key={day} className={`text-center py-1 ${theme.text.muted} text-[10px] md:text-xs`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                {calendarData.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (day.isToday && onPlayToday) {
                        onPlayToday();
                      } else if (day.date > 0 && !day.isFuture && onPlayArchive) {
                        const date = new Date();
                        date.setDate(day.date);
                        onPlayArchive(date);
                      }
                    }}
                    disabled={day.date === 0 || day.isFuture}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-300 relative text-xs md:text-sm group ${
                      day.date === 0
                        ? 'invisible'
                        : day.isFuture
                        ? `${theme.card.background} ${theme.card.border} border opacity-30 cursor-not-allowed`
                        : day.isToday
                        ? `${theme.button.primary.background} ${theme.button.primary.text} shadow-lg ring-2 ring-white/20 hover:scale-110 hover:shadow-xl animate-pulse`
                        : day.completed
                        ? `${theme.card.background} ${theme.card.border} border ${theme.card.hover} ring-1 ring-green-500/30 hover:scale-110 hover:ring-2`
                        : `${theme.card.background} ${theme.card.border} border ${theme.card.hover} hover:scale-110`
                    }`}
                    style={day.isToday ? { animationDuration: '3s' } : undefined}
                  >
                    {day.date > 0 && (
                      <>
                        <span className={day.isToday ? theme.button.primary.text : theme.text.primary}>
                          {day.date}
                        </span>
                        {/* Completed checkmark - larger, more prominent */}
                        {day.completed && !day.isToday && (
                          <CheckCircle className={`w-4 h-4 md:w-4.5 md:h-4.5 absolute top-0.5 right-0.5 text-green-500`} />
                        )}
                        {day.completed && day.isToday && (
                          <CheckCircle className={`w-4 h-4 absolute top-0.5 right-0.5 ${theme.button.primary.text}`} />
                        )}
                        {/* Difficulty dot with tooltip - bottom center (for all past days) */}
                        {!day.isToday && !day.isFuture && day.difficulty && (
                          <>
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getDifficultyColor(day.difficulty).dot} absolute bottom-0.5 md:bottom-1`} />
                            {/* Tooltip on hover - positioned relative to button */}
                            <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10`}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              {getDifficultyLabel(day.difficulty)}
                            </div>
                          </>
                        )}
                        {/* Future lock icon */}
                        {day.isFuture && (
                          <Lock className={`w-3 h-3 absolute top-0.5 right-0.5 ${theme.text.muted} opacity-50`} />
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>

              <p className={`text-xs ${theme.text.muted} text-center mt-3`}>
                Tap past days to play as archive (won't affect streak)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}