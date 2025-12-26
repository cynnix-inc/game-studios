import { ArrowLeft, Calendar, Flame, Trophy, Target, TrendingUp, CheckCircle, Lock, X } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

interface DailyChallengesProps {
  onBack: () => void;
  username: string;
}

type TabType = 'calendar' | 'leaderboard' | 'stats';

// Mock data - In production, this would come from your backend
const generateMockCalendarData = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, completed: false, score: 0 });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const isPast = i < today.getDate();
    const isToday = i === today.getDate();
    const completed = isPast && Math.random() > 0.3; // 70% completion rate for past days
    const score = completed ? Math.floor(Math.random() * 2000) + 500 : 0;
    
    days.push({
      date: i,
      completed,
      score,
      isToday,
      isFuture: i > today.getDate()
    });
  }
  
  return days;
};

const mockLeaderboard = [
  { rank: 1, username: 'ProGamer99', score: 1850, streak: 15 },
  { rank: 2, username: 'DailyChamp', score: 1720, streak: 22 },
  { rank: 3, username: 'StreakMaster', score: 1680, streak: 30 },
  { rank: 4, username: 'GameWizard', score: 1550, streak: 8 },
  { rank: 5, username: 'ChallengeKing', score: 1490, streak: 12 },
];

export function DailyChallenges({ onBack, username }: DailyChallengesProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const calendarData = generateMockCalendarData();
  
  // Mock stats
  const stats = {
    currentStreak: 5,
    longestStreak: 12,
    totalCompleted: 45,
    averageScore: 1325,
    personalBest: 1890
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col py-4 md:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 px-2 flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            onClick={onBack}
            className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300 p-2`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={`text-2xl md:text-3xl ${theme.text.primary}`}>Daily Challenges</h1>
            <p className={`${theme.text.secondary} text-sm md:text-base`}>Complete daily challenges to build your streak</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 ${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl`}>
          <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          <span className={`${theme.text.primary} text-sm md:text-base`}>{stats.currentStreak} Day Streak</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 mb-4 md:mb-6 mx-2 ${theme.card.background} ${theme.card.border} border rounded-xl p-2 backdrop-blur-xl flex-shrink-0`}>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'calendar'
              ? `${theme.button.primary.background} ${theme.button.primary.text}`
              : `${theme.text.secondary} ${theme.card.hover}`
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'leaderboard'
              ? `${theme.button.primary.background} ${theme.button.primary.text}`
              : `${theme.text.secondary} ${theme.card.hover}`
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Leaderboard</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'stats'
              ? `${theme.button.primary.background} ${theme.button.primary.text}`
              : `${theme.text.secondary} ${theme.card.hover}`
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Stats</span>
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {activeTab === 'calendar' && (
          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl`}>
            <div className="mb-4 md:mb-6">
              <h2 className={`text-xl md:text-2xl ${theme.text.primary} mb-2`}>
                {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
              </h2>
              <p className={`${theme.text.secondary} text-sm md:text-base`}>
                {stats.totalCompleted} challenges completed this month
              </p>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
              {dayNames.map(day => (
                <div key={day} className={`text-center py-1 md:py-2 ${theme.text.muted} text-xs md:text-sm`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {calendarData.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day.date > 0 && !day.isFuture && setSelectedDay(day)}
                  disabled={day.date === 0 || day.isFuture}
                  className={`aspect-square rounded-lg md:rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 relative text-sm md:text-base ${
                    day.date === 0
                      ? 'invisible'
                      : day.isFuture
                      ? `${theme.card.background} ${theme.card.border} border opacity-50 cursor-not-allowed`
                      : day.isToday
                      ? `${theme.button.primary.background} ${theme.button.primary.text} shadow-lg`
                      : day.completed
                      ? `bg-green-500/20 ${theme.card.border} border ${theme.card.hover}`
                      : `${theme.card.background} ${theme.card.border} border ${theme.card.hover}`
                  }`}
                >
                  {day.date > 0 && (
                    <>
                      <span className={day.isToday ? '' : theme.text.primary}>
                        {day.date}
                      </span>
                      {day.completed && (
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 absolute top-0.5 right-0.5 md:top-1 md:right-1" />
                      )}
                      {day.isFuture && (
                        <Lock className="w-3 h-3 md:w-4 md:h-4 absolute top-0.5 right-0.5 md:top-1 md:right-1 opacity-50" />
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl`}>
            <div className="mb-4 md:mb-6">
              <h2 className={`text-xl md:text-2xl ${theme.text.primary} mb-2`}>
                Today's Leaderboard
              </h2>
              <p className={`${theme.text.secondary} text-sm md:text-base`}>
                Top players for today's daily challenge
              </p>
            </div>

            <div className="space-y-2 md:space-y-3">
              {mockLeaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center gap-4 p-4 ${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl ${theme.card.hover} transition-all duration-300`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    player.rank === 1
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : player.rank === 2
                      ? 'bg-gray-400/20 text-gray-300'
                      : player.rank === 3
                      ? 'bg-amber-600/20 text-amber-600'
                      : `${theme.card.background} ${theme.text.secondary}`
                  }`}>
                    {player.rank <= 3 ? <Trophy className="w-5 h-5" /> : `#${player.rank}`}
                  </div>

                  <div className="flex-1">
                    <p className={`${theme.text.primary}`}>{player.username}</p>
                    <div className="flex items-center gap-3">
                      <span className={`${theme.text.secondary} text-sm`}>
                        {player.score} pts
                      </span>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className={`${theme.text.secondary} text-sm`}>{player.streak}</span>
                      </div>
                    </div>
                  </div>

                  {player.username === username && (
                    <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm">
                      You
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className={`p-2 md:p-3 ${theme.button.primary.background} rounded-xl`}>
                  <Flame className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className={`${theme.text.secondary} text-sm md:text-base`}>Current Streak</p>
                  <p className={`text-2xl md:text-3xl ${theme.text.primary}`}>{stats.currentStreak} days</p>
                </div>
              </div>
              <p className={`${theme.text.muted} text-xs md:text-sm`}>
                Keep playing daily to maintain your streak!
              </p>
            </div>

            <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className={`p-2 md:p-3 ${theme.button.primary.background} rounded-xl`}>
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className={`${theme.text.secondary} text-sm md:text-base`}>Longest Streak</p>
                  <p className={`text-2xl md:text-3xl ${theme.text.primary}`}>{stats.longestStreak} days</p>
                </div>
              </div>
              <p className={`${theme.text.muted} text-xs md:text-sm`}>
                Your personal record for consecutive days
              </p>
            </div>

            <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className={`p-2 md:p-3 ${theme.button.primary.background} rounded-xl`}>
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className={`${theme.text.secondary} text-sm md:text-base`}>Total Completed</p>
                  <p className={`text-2xl md:text-3xl ${theme.text.primary}`}>{stats.totalCompleted}</p>
                </div>
              </div>
              <p className={`${theme.text.muted} text-xs md:text-sm`}>
                Daily challenges completed all-time
              </p>
            </div>

            <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className={`p-2 md:p-3 ${theme.button.primary.background} rounded-xl`}>
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className={`${theme.text.secondary} text-sm md:text-base`}>Average Score</p>
                  <p className={`text-2xl md:text-3xl ${theme.text.primary}`}>{stats.averageScore}</p>
                </div>
              </div>
              <p className={`${theme.text.muted} text-xs md:text-sm`}>
                Personal best: {stats.personalBest} pts
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-w-md w-full`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl ${theme.text.primary}`}>
                {monthNames[new Date().getMonth()]} {selectedDay.date}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className={`${theme.card.hover} rounded-lg p-2 transition-all duration-300`}
              >
                <X className={`w-5 h-5 ${theme.text.secondary}`} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedDay.completed ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className={`${theme.text.primary} text-lg`}>Completed</span>
                  </div>
                  <div className={`p-4 ${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl`}>
                    <p className={`${theme.text.secondary} text-sm mb-1`}>Score</p>
                    <p className={`text-2xl ${theme.text.primary}`}>{selectedDay.score} pts</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <X className="w-6 h-6 text-red-500" />
                    <span className={`${theme.text.primary} text-lg`}>Not Completed</span>
                  </div>
                  <p className={`${theme.text.secondary}`}>
                    You didn't complete the challenge this day.
                  </p>
                </>
              )}

              <Button
                onClick={() => setSelectedDay(null)}
                className={`w-full ${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300`}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}