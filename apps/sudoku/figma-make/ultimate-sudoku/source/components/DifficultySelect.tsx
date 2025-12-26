import { ArrowLeft, Zap, Target, Flame, Skull } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

interface DifficultySelectProps {
  onBack: () => void;
  onSelectDifficulty: (difficulty: 'easy' | 'medium' | 'hard' | 'expert') => void;
}

export function DifficultySelect({ onBack, onSelectDifficulty }: DifficultySelectProps) {
  const { theme } = useTheme();

  const difficulties = [
    {
      level: 'easy' as const,
      icon: Zap,
      title: 'Easy',
      description: '35 numbers filled',
      color: 'text-green-400',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
    },
    {
      level: 'medium' as const,
      icon: Target,
      title: 'Medium',
      description: '45 numbers filled',
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      level: 'hard' as const,
      icon: Flame,
      title: 'Hard',
      description: '52 numbers filled',
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/20 to-red-500/20',
    },
    {
      level: 'expert' as const,
      icon: Skull,
      title: 'Expert',
      description: '58 numbers filled',
      color: 'text-red-400',
      bgGradient: 'from-red-500/20 to-rose-500/20',
    },
  ];

  return (
    <div className="min-h-screen w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            className={`${theme.text.primary} ${theme.card.hover} transition-all duration-300`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className={`text-2xl md:text-3xl ${theme.text.primary}`}>
            Select Difficulty
          </h1>
          <div className="w-20" />
        </div>

        {/* Difficulty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {difficulties.map(({ level, icon: Icon, title, description, color, bgGradient }) => (
            <button
              key={level}
              onClick={() => onSelectDifficulty(level)}
              className={`
                ${theme.card.background} 
                ${theme.card.border} 
                ${theme.card.hover}
                backdrop-blur-xl
                border 
                rounded-3xl 
                p-8 
                shadow-xl 
                transition-all 
                duration-300 
                hover:shadow-2xl 
                hover:scale-105
                group
                text-left
              `}
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${bgGradient}`}>
                  <Icon className={`w-10 h-10 ${color}`} />
                </div>

                {/* Title */}
                <div>
                  <h2 className={`text-2xl md:text-3xl ${theme.text.primary} group-hover:scale-105 transition-transform`}>
                    {title}
                  </h2>
                  <p className={`text-sm ${theme.text.muted} mt-1`}>
                    {description}
                  </p>
                </div>

                {/* Details */}
                <div className={`pt-4 border-t ${theme.card.border} space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme.text.secondary}`}>Completion Rate</span>
                    <span className={`text-sm ${theme.text.primary}`}>
                      {level === 'easy' ? '95%' : level === 'medium' ? '75%' : level === 'hard' ? '45%' : '20%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme.text.secondary}`}>Avg. Time</span>
                    <span className={`text-sm ${theme.text.primary}`}>
                      {level === 'easy' ? '8-12 min' : level === 'medium' ? '15-25 min' : level === 'hard' ? '30-45 min' : '45+ min'}
                    </span>
                  </div>
                </div>

                {/* Play Button Indicator */}
                <div className={`flex items-center justify-center pt-2`}>
                  <span className={`text-sm ${theme.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Click to play →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 backdrop-blur-xl shadow-xl`}>
          <h3 className={`${theme.text.primary} mb-3`}>About Difficulty Levels</h3>
          <div className={`space-y-2 text-sm ${theme.text.secondary}`}>
            <p>• <span className={theme.text.primary}>Easy:</span> Perfect for beginners and quick games</p>
            <p>• <span className={theme.text.primary}>Medium:</span> Balanced challenge for regular play</p>
            <p>• <span className={theme.text.primary}>Hard:</span> Requires advanced strategies</p>
            <p>• <span className={theme.text.primary}>Expert:</span> Only for true Sudoku masters</p>
          </div>
        </div>
      </div>
    </div>
  );
}
