import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Sunrise, Target, Brain, Trophy, Zap, Crown } from 'lucide-react';
import { VARIANT_DEFINITIONS, type Variant } from '../types/variant';
import type { Difficulty } from '../types/difficulty';
import { useState, useEffect } from 'react';

interface GameSetupProps {
  onBack: () => void;
  onStartGame: (config: {
    variant: Variant;
    subVariant?: string;
    mode: 'classic' | 'zen';
    difficulty: Difficulty;
  }) => void;
  selectedVariant: Variant;
}

export function GameSetup({ onBack, onStartGame, selectedVariant }: GameSetupProps) {
  const { theme } = useTheme();
  const variantDef = VARIANT_DEFINITIONS[selectedVariant];
  
  // Load last used settings or use defaults
  const [selectedSubVariant, setSelectedSubVariant] = useState<string>(
    variantDef.subVariants?.default || ''
  );
  const [selectedMode, setSelectedMode] = useState<'classic' | 'zen'>('classic');

  useEffect(() => {
    // Load from localStorage
    const lastMode = localStorage.getItem('lastGameMode');
    if (lastMode === 'zen' || lastMode === 'classic') {
      setSelectedMode(lastMode);
    }

    if (variantDef.subVariants) {
      const lastSubVariant = localStorage.getItem(`lastSubVariant_${selectedVariant}`);
      if (lastSubVariant) {
        setSelectedSubVariant(lastSubVariant);
      }
    }
  }, [selectedVariant, variantDef.subVariants]);

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    // Save selections to localStorage
    localStorage.setItem('lastGameMode', selectedMode);
    if (selectedSubVariant) {
      localStorage.setItem(`lastSubVariant_${selectedVariant}`, selectedSubVariant);
    }

    // Clear any existing saved game state to start fresh
    localStorage.removeItem('sudokuGameState');
    
    // Save to localStorage for "Play Again" functionality
    const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    localStorage.setItem('lastFreePlayDifficulty', capitalizedDifficulty);
    localStorage.setItem('lastFreePlayMode', selectedMode === 'zen' ? 'Zen' : 'Classic');
    localStorage.setItem('freePlayInProgress', 'true');
    
    onStartGame({
      variant: selectedVariant,
      subVariant: selectedSubVariant || undefined,
      mode: selectedMode,
      difficulty
    });
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
      description: 'Feels like "real Sudoku." You will use pairs and basic line and box interactions.',
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
      description: 'Fewer freebies. You will need planning, triples, and pattern spotting.',
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
      description: 'Pattern hunting starts. Expect X-Wing and deeper eliminations.',
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
      description: 'Tight and demanding. Multi-step logic required to break through.',
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
      description: 'The brain-melter tier. Minimal clues, very precise logic required.',
      clues: '20-23',
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/20 to-fuchsia-500/20',
      completionRate: '10%',
      avgTime: '75+ min',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border p-3 rounded-xl transition-all duration-300`}
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{variantDef.icon}</span>
          <div>
            <h1 className={theme.text.primary}>{variantDef.name}</h1>
            <p className={`${theme.text.secondary} text-sm`}>{variantDef.shortDescription}</p>
          </div>
        </div>
      </div>

      {/* Setup Options */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Mode Selection - First choice, quick binary decision */}
          <div>
            <h3 className={`${theme.text.primary} mb-3`}>Mode</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMode('classic')}
                className={`
                  ${selectedMode === 'classic' 
                    ? `${theme.button.primary.background} ${theme.button.primary.text}` 
                    : `${theme.button.secondary.background} ${theme.button.secondary.text} ${theme.card.border} border`
                  }
                  ${selectedMode === 'classic' 
                    ? theme.button.primary.hover 
                    : theme.button.secondary.hover
                  }
                  flex-1 px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-xl
                `}
              >
                <span className="text-xl">⏱️</span>
                <div className="text-left">
                  <div className="text-sm">Classic</div>
                  <div className={`text-xs ${selectedMode === 'classic' ? 'opacity-90' : theme.text.muted}`}>
                    Timed with mistakes
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedMode('zen')}
                className={`
                  ${selectedMode === 'zen' 
                    ? `${theme.button.primary.background} ${theme.button.primary.text}` 
                    : `${theme.button.secondary.background} ${theme.button.secondary.text} ${theme.card.border} border`
                  }
                  ${selectedMode === 'zen' 
                    ? theme.button.primary.hover 
                    : theme.button.secondary.hover
                  }
                  flex-1 px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-xl
                `}
              >
                <span className="text-xl">🧘</span>
                <div className="text-left">
                  <div className="text-sm">Zen</div>
                  <div className={`text-xs ${selectedMode === 'zen' ? 'opacity-90' : theme.text.muted}`}>
                    Relaxed, no pressure
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty Selection - Main decision */}
          <div>
            <h3 className={`${theme.text.primary} mb-3`}>Select Difficulty</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    rounded-xl 
                    p-4 
                    shadow-xl 
                    transition-all 
                    duration-300 
                    hover:shadow-2xl 
                    hover:scale-105
                    group
                    text-left
                  `}
                >
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${bgGradient} shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className={`${theme.text.primary}`}>
                        {title}
                      </h2>
                      <p className={`text-xs ${theme.text.secondary}`}>
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs ${theme.text.secondary} leading-relaxed mb-3 line-clamp-2`}>
                    {description}
                  </p>

                  {/* Stats */}
                  <div className={`pt-3 border-t ${theme.card.border} grid grid-cols-3 gap-2 text-center`}>
                    <div>
                      <div className={`text-xs ${theme.text.primary} mb-0.5`}>
                        {clues}
                      </div>
                      <div className={`text-xs ${theme.text.muted}`}>
                        Clues
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${theme.text.primary} mb-0.5`}>
                        {completionRate}
                      </div>
                      <div className={`text-xs ${theme.text.muted}`}>
                        Success
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${theme.text.primary} mb-0.5`}>
                        {avgTime}
                      </div>
                      <div className={`text-xs ${theme.text.muted}`}>
                        Avg.
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Variant Selection (if applicable) - Last, variant-specific detail */}
          {variantDef.subVariants && (
            <div>
              <h3 className={`${theme.text.primary} mb-3`}>{variantDef.subVariants.label}</h3>
              <div className="flex flex-wrap gap-2">
                {variantDef.subVariants.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedSubVariant(option)}
                    className={`
                      ${selectedSubVariant === option 
                        ? `${theme.button.primary.background} ${theme.button.primary.text}` 
                        : `${theme.button.secondary.background} ${theme.button.secondary.text} ${theme.card.border} border`
                      }
                      ${selectedSubVariant === option 
                        ? theme.button.primary.hover 
                        : theme.button.secondary.hover
                      }
                      w-20 h-20 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-xl
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}