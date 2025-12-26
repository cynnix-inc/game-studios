import { ArrowLeft, Trophy, Target, Clock, Zap, TrendingUp, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useTheme } from '../contexts/ThemeContext';

interface StatsProps {
  onBack: () => void;
  username: string;
}

export function Stats({ onBack, username }: StatsProps) {
  const { theme } = useTheme();
  const stats = [
    { label: 'Puzzles Solved', value: '156', icon: Target, color: 'text-blue-400' },
    { label: 'Total Score', value: '45,230', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Play Time', value: '42h 15m', icon: Clock, color: 'text-purple-400' },
    { label: 'Completion Rate', value: '67%', icon: TrendingUp, color: 'text-green-400' },
  ];

  const achievements = [
    { name: 'First Puzzle', description: 'Complete your first Sudoku', progress: 100 },
    { name: 'Century Club', description: 'Solve 100 puzzles', progress: 100 },
    { name: 'Speed Demon', description: 'Complete expert in under 30 min', progress: 75 },
    { name: 'Marathon', description: 'Play for 50 hours', progress: 84 },
    { name: 'Perfect Game', description: 'Complete without hints or mistakes', progress: 33 },
  ];

  return (
    <div className="max-w-6xl mx-auto min-h-screen py-8">
      {/* Header */}
      <div className="mb-8 px-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className={`mb-4 ${theme.text.primary} ${theme.card.hover}`}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <h1 className={`text-3xl md:text-4xl ${theme.text.primary}`}>
          {username ? `${username}'s Stats` : 'Your Stats'}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 px-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${theme.card.background} ${theme.card.border} ${theme.card.hover} border rounded-2xl p-6 transition-all duration-300 shadow-xl`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className={`text-3xl ${theme.text.primary} mb-1`}>{stat.value}</p>
              <p className={`text-sm ${theme.text.muted}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Level Progress */}
      <div className="mb-8 px-4">
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl ${theme.text.primary} mb-1`}>Level 24</h2>
              <p className={`text-sm ${theme.text.muted}`}>2,450 / 3,000 XP to Level 25</p>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className={`text-2xl ${theme.text.primary}`}>24</span>
            </div>
          </div>
          <Progress value={81.67} className="h-3" />
        </div>
      </div>

      {/* Achievements */}
      <div className="px-4">
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
          <h2 className={`text-xl ${theme.text.primary} mb-6 flex items-center`}>
            <Award className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Achievements
          </h2>
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={theme.text.primary}>{achievement.name}</p>
                    <p className={`text-sm ${theme.text.muted}`}>{achievement.description}</p>
                  </div>
                  <span className={`${theme.text.secondary} ml-4`}>{achievement.progress}%</span>
                </div>
                <Progress value={achievement.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}