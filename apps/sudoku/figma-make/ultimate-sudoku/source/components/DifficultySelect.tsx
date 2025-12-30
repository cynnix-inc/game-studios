import { ArrowLeft, Sunrise, Target, Brain, Trophy, Zap, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import type { Difficulty } from '../types/difficulty';

interface DifficultySelectProps {
  onBack: () => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  mode?: 'classic' | 'zen';
}

export function DifficultySelect({ onBack, onSelectDifficulty, mode = 'classic' }: DifficultySelectProps) {
  const { theme } = useTheme();

  const handleSelectDifficulty = (level: Difficulty) => {
    // Clear any existing saved game state to start fresh
    localStorage.removeItem('sudokuGameState');
    
    // Save to localStorage for "Play Again" functionality
    const capitalizedLevel = level.charAt(0).toUpperCase() + level.slice(1);
    localStorage.setItem('lastFreePlayDifficulty', capitalizedLevel);
    localStorage.setItem('lastFreePlayMode', mode === 'zen' ? 'Zen' : 'Classic');
    localStorage.setItem('freePlayInProgress', 'true');
    
    onSelectDifficulty(level);
  };

  const difficulties = [
    {
      level: 'novice' as const,
      icon: Sunrise,
      title: 'Novice',
      subtitle: 'Warm-Up Mode',
      description: 'Quick wins. Mostly obvious placements, great for learning and getting momentum.',
      clues: '40-45',
      color: 'text-green-400',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      completionRate: '98%',
      avgTime: '5-8 min',
    },
    {
      level: 'skilled' as const,
      icon: Target,
      title: 'Skilled',
      subtitle: 'Standard Play',
      description: 'Feels like "real Sudoku." You will use pairs and basic line and box interactions, but it stays smooth and fair.',
      clues: '32-36',
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      completionRate: '85%',
      avgTime: '12-18 min',
    },
    {
      level: 'advanced' as const,
      icon: Brain,
      title: 'Advanced',
      subtitle: "Thinker's Level",
      description: 'Fewer freebies. You will need some planning, triples, and a bit of pattern spotting to keep progress moving.',
      clues: '28-32',
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/20 to-amber-500/20',
      completionRate: '65%',
      avgTime: '20-30 min',
    },
    {
      level: 'expert' as const,
      icon: Trophy,
      title: 'Expert',
      subtitle: 'Puzzle Master',
      description: 'Where pattern hunting starts. Expect moves like X-Wing and deeper eliminations that connect distant parts of the grid.',
      clues: '25-28',
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/20 to-red-500/20',
      completionRate: '40%',
      avgTime: '35-50 min',
    },
    {
      level: 'fiendish' as const,
      icon: Zap,
      title: 'Fiendish',
      subtitle: 'Logic Warrior',
      description: 'Tight and demanding. You will build longer deductions, use wings, and occasionally follow multi-step logic to break through.',
      clues: '23-25',
      color: 'text-red-400',
      bgGradient: 'from-red-500/20 to-rose-500/20',
      completionRate: '25%',
      avgTime: '50-75 min',
    },
    {
      level: 'ultimate' as const,
      icon: Crown,
      title: 'Ultimate',
      subtitle: 'Legend Mode',
      description: 'The brain-melter tier. Minimal clues, very precise logic, and advanced chains or uniqueness-style reasoning to finish cleanly.',
      clues: '20-23',
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/20 to-fuchsia-500/20',
      completionRate: '10%',
      avgTime: '75+ min',
    },
  ];

  return (
    <div className="min-h-screen w-full p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {difficulties.map(({ level, icon: Icon, title, subtitle, description, clues, color, bgGradient, completionRate, avgTime }) => (
            <button
              key={level}
              onClick={() => handleSelectDifficulty(level)}
              className={`
                ${theme.card.background} 
                ${theme.card.border} 
                ${theme.card.hover}
                backdrop-blur-xl
                border 
                rounded-3xl 
                p-6 
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
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${bgGradient}`}>
                  <Icon className={`w-8 h-8 ${color}`} />
                </div>

                {/* Title */}
                <div>
                  <h2 className={`text-xl md:text-2xl ${theme.text.primary} group-hover:scale-105 transition-transform`}>
                    {title}
                  </h2>
                  <p className={`text-xs ${theme.accent} mt-0.5`}>
                    {subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className={`text-xs ${theme.text.secondary} leading-relaxed line-clamp-3`}>
                  {description}
                </p>

                {/* Details */}
                <div className={`pt-3 border-t ${theme.card.border} space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme.text.secondary}`}>Clues</span>
                    <span className={`text-xs ${theme.text.primary}`}>
                      {clues}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme.text.secondary}`}>Success Rate</span>
                    <span className={`text-xs ${theme.text.primary}`}>
                      {completionRate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme.text.secondary}`}>Avg. Time</span>
                    <span className={`text-xs ${theme.text.primary}`}>
                      {avgTime}
                    </span>
                  </div>
                </div>

                {/* Play Button Indicator */}
                <div className={`flex items-center justify-center pt-2`}>
                  <span className={`text-xs ${theme.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
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
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm ${theme.text.secondary}`}>
            <p>• <span className={theme.text.primary}>Novice:</span> Perfect for beginners and quick wins</p>
            <p>• <span className={theme.text.primary}>Skilled:</span> Standard Sudoku experience</p>
            <p>• <span className={theme.text.primary}>Advanced:</span> Requires planning and patterns</p>
            <p>• <span className={theme.text.primary}>Expert:</span> Advanced techniques needed</p>
            <p>• <span className={theme.text.primary}>Fiendish:</span> Multi-step logic required</p>
            <p>• <span className={theme.text.primary}>Ultimate:</span> Only for true masters</p>
          </div>
        </div>
      </div>
    </div>
  );
}