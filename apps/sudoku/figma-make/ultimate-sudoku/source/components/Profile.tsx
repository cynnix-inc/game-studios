import { ArrowLeft, User, Mail, Calendar, Trophy, Target, Clock, LogOut, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileProps {
  onBack: () => void;
  username: string;
  onSignOut: () => void;
}

export function Profile({ onBack, username, onSignOut }: ProfileProps) {
  const { theme } = useTheme();
  const userStats = [
    { label: 'Total Wins', value: '104', icon: Trophy },
    { label: 'Games Played', value: '156', icon: Target },
    { label: 'Hours Played', value: '42', icon: Clock },
  ];

  const badges = [
    { name: 'First Victory', color: 'bg-blue-500' },
    { name: 'Century Club', color: 'bg-purple-500' },
    { name: 'Elite Player', color: 'bg-yellow-500' },
    { name: 'Marathon Runner', color: 'bg-green-500' },
  ];

  const recentActivity = [
    { game: 'Quick Match', result: 'Victory', score: 1240, time: '2 hours ago' },
    { game: 'Ranked Mode', result: 'Victory', score: 1580, time: '5 hours ago' },
    { game: 'Tournament', result: 'Defeat', score: 890, time: '1 day ago' },
    { game: 'Quick Match', result: 'Victory', score: 1320, time: '1 day ago' },
  ];

  return (
    <div className="max-w-4xl mx-auto min-h-screen py-8">
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
      </div>

      {/* Profile Header */}
      <div className="mb-8 px-4">
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 md:p-8 shadow-xl`}>
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-purple-500">
              <AvatarFallback className={`${theme.button.primary.background} ${theme.button.primary.text} text-3xl`}>
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <h1 className={`text-2xl md:text-3xl ${theme.text.primary} mb-2 md:mb-0`}>
                  {username}
                </h1>
                <Button variant="outline" className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              <div className={`space-y-1 ${theme.text.secondary}`}>
                <p className="flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  {username.toLowerCase()}@example.com
                </p>
                <p className="flex items-center justify-center md:justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined January 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 px-4">
        <div className="grid grid-cols-3 gap-4">
          {userStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 text-center shadow-xl`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${theme.accent}`} />
                <p className={`text-2xl ${theme.text.primary} mb-1`}>{stat.value}</p>
                <p className={`text-xs ${theme.text.muted}`}>{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="mb-8 px-4">
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
          <h2 className={`text-xl ${theme.text.primary} mb-4`}>Badges</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <Badge
                key={index}
                className={`${badge.color} text-white px-3 py-1`}
              >
                {badge.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8 px-4">
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
          <h2 className={`text-xl ${theme.text.primary} mb-4`}>Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${theme.card.hover} transition-colors`}
              >
                <div className="flex-1">
                  <p className={theme.text.primary}>{activity.game}</p>
                  <p className={`text-sm ${theme.text.muted}`}>{activity.time}</p>
                </div>
                <div className="text-right">
                  <Badge className={activity.result === 'Victory' ? 'bg-green-500' : 'bg-red-500'}>
                    {activity.result}
                  </Badge>
                  <p className={`text-sm ${theme.text.secondary} mt-1`}>{activity.score} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="px-4">
        <Button
          onClick={onSignOut}
          variant="outline"
          className={`w-full ${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border-red-500/50 hover:border-red-500`}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
