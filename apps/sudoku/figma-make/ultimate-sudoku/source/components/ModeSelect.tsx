import { ArrowLeft, Sparkles, Grid3x3 } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

interface ModeSelectProps {
  onBack: () => void;
  onSelectMode: (mode: 'classic' | 'zen') => void;
}

export function ModeSelect({ onBack, onSelectMode }: ModeSelectProps) {
  const { theme } = useTheme();

  const modes = [
    {
      id: 'classic' as const,
      icon: Grid3x3,
      title: 'Classic',
      subtitle: 'Traditional Challenge',
      description: 'Full Sudoku experience with timer, lives, mistakes tracking, and stats. Compete for your best times and challenge yourself.',
      features: ['⏱️ Timer tracking', '❤️ Lives system', '📊 Stats & records', '🏆 Achievements'],
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      color: 'text-blue-400',
    },
    {
      id: 'zen' as const,
      icon: Sparkles,
      title: 'Zen',
      subtitle: 'Peaceful Play',
      description: 'A calmer Sudoku experience. No timer, no pressure, unlimited lives. Just you and the puzzle, at your own pace.',
      features: ['🧘 No timer', '∞ Unlimited lives', '🌅 No pressure', '🎯 Pure focus'],
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      color: 'text-purple-400',
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
            Select Mode
          </h1>
          <div className="w-20" />
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {modes.map(({ id, icon: Icon, title, subtitle, description, features, bgGradient, color }) => (
            <button
              key={id}
              onClick={() => onSelectMode(id)}
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
                <p className={`text-sm ${theme.text.secondary} leading-relaxed`}>
                  {description}
                </p>

                {/* Features */}
                <div className={`pt-3 border-t ${theme.card.border} space-y-2`}>
                  {features.map((feature, idx) => (
                    <div key={idx} className={`text-xs ${theme.text.secondary}`}>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Select Button Indicator */}
                <div className={`flex items-center justify-center pt-2`}>
                  <span className={`text-xs ${theme.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Click to select →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 backdrop-blur-xl shadow-xl`}>
          <h3 className={`${theme.text.primary} mb-3`}>About Modes</h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm ${theme.text.secondary}`}>
            <p>• <span className={theme.text.primary}>Classic:</span> Perfect for competitive players who want to track progress and improve times</p>
            <p>• <span className={theme.text.primary}>Zen:</span> Ideal for relaxation, learning, or playing without time pressure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
