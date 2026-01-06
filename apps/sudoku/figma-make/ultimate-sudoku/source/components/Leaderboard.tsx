import { ArrowLeft, Trophy, Medal, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useTheme } from '../contexts/ThemeContext';

interface LeaderboardProps {
  onBack: () => void;
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const { theme } = useTheme();
  const leaderboardData = [
    { rank: 1, username: 'ProGamer2024', score: 98750, level: 42, avatar: 'PG' },
    { rank: 2, username: 'ElitePlayer', score: 95230, level: 40, avatar: 'EP' },
    { rank: 3, username: 'MasterChief', score: 92100, level: 39, avatar: 'MC' },
    { rank: 4, username: 'NinjaWarrior', score: 88950, level: 38, avatar: 'NW' },
    { rank: 5, username: 'QuantumGamer', score: 85400, level: 37, avatar: 'QG' },
    { rank: 6, username: 'PhoenixRising', score: 82100, level: 36, avatar: 'PR' },
    { rank: 7, username: 'ThunderStrike', score: 79300, level: 35, avatar: 'TS' },
    { rank: 8, username: 'ShadowHunter', score: 76800, level: 34, avatar: 'SH' },
    { rank: 9, username: 'CosmicAce', score: 74200, level: 33, avatar: 'CA' },
    { rank: 10, username: 'BlazeFury', score: 71500, level: 32, avatar: 'BF' },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
    return `${theme.card.background} ${theme.card.border}`;
  };

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
        <div className="flex items-center">
          <Trophy className="w-8 h-8 md:w-10 md:h-10 mr-3 text-yellow-400" />
          <h1 className={`text-3xl md:text-4xl ${theme.text.primary}`}>Leaderboard</h1>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 space-y-3">
        {leaderboardData.map((player) => (
          <div
            key={player.rank}
            className={`${getRankStyle(player.rank)} backdrop-blur-xl border rounded-2xl p-4 transition-all duration-300 ${theme.card.hover} shadow-xl`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(player.rank) || (
                  <span className={`text-xl ${theme.text.primary}`}>{player.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-12 h-12">
                <AvatarFallback className={`${theme.button.primary.background} ${theme.button.primary.text}`}>
                  {player.avatar}
                </AvatarFallback>
              </Avatar>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <p className={`${theme.text.primary} truncate`}>{player.username}</p>
                <p className={`text-sm ${theme.text.muted}`}>Level {player.level}</p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className={`${theme.text.primary}`}>{player.score.toLocaleString()}</p>
                <p className={`text-sm ${theme.text.muted}`}>points</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
