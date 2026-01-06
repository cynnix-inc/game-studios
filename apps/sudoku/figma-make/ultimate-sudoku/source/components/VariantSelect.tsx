import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react';
import { VARIANT_DEFINITIONS, getSortedVariants, type Variant } from '../types/variant';
import { useEffect, useState } from 'react';

interface VariantSelectProps {
  onBack: () => void;
  onSelectVariant: (variant: Variant) => void;
}

export function VariantSelect({ onBack, onSelectVariant }: VariantSelectProps) {
  const { theme } = useTheme();
  const [usageStats, setUsageStats] = useState<Record<Variant, number>>({} as Record<Variant, number>);

  useEffect(() => {
    // Load usage stats from localStorage
    const stats = localStorage.getItem('variantUsageStats');
    if (stats) {
      try {
        setUsageStats(JSON.parse(stats));
      } catch (e) {
        console.error('Failed to parse variant usage stats:', e);
      }
    }
  }, []);

  const sortedVariants = getSortedVariants(usageStats);

  const handleSelectVariant = (variant: Variant) => {
    // Update usage stats
    const newStats = {
      ...usageStats,
      [variant]: (usageStats[variant] || 0) + 1
    };
    setUsageStats(newStats);
    localStorage.setItem('variantUsageStats', JSON.stringify(newStats));
    
    onSelectVariant(variant);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border p-3 rounded-xl transition-all duration-300`}
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className={theme.text.primary}>Choose Your Puzzle</h1>
          <p className={theme.text.secondary}>Select a sudoku variant to play</p>
        </div>
      </div>

      {/* Variant Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-8">
          {sortedVariants.map((variantId) => {
            const variant = VARIANT_DEFINITIONS[variantId];
            const usageCount = usageStats[variantId] || 0;
            const isComingSoon = variantId !== 'classic';
            
            return (
              <button
                key={variant.id}
                onClick={() => !isComingSoon && handleSelectVariant(variant.id)}
                disabled={isComingSoon}
                className={`${theme.card.background} ${theme.card.border} ${isComingSoon ? 'opacity-60 cursor-not-allowed' : theme.card.hover} border rounded-xl p-4 shadow-xl backdrop-blur-xl transition-all duration-300 text-left relative group`}
              >
                {/* Coming Soon badge */}
                {isComingSoon && (
                  <div className={`absolute top-3 right-3 ${theme.accent} px-2 py-0.5 rounded-md text-xs ${theme.text.primary} bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm`}>
                    Coming Soon
                  </div>
                )}

                {/* Usage badge (only show if used before and not coming soon) */}
                {usageCount > 0 && !isComingSoon && (
                  <div className={`absolute top-3 right-3 ${theme.button.primary.background} px-2 py-0.5 rounded-md text-xs ${theme.button.primary.text}`}>
                    {usageCount}x
                  </div>
                )}

                {/* Header with icon and title */}
                <div className="flex items-start gap-3 mb-2">
                  {/* Icon */}
                  <div className="text-2xl shrink-0">
                    {variant.icon}
                  </div>

                  {/* Title and short description */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`${theme.text.primary} text-sm mb-0.5`}>
                      {variant.name}
                    </h3>
                    <p className={`${theme.text.secondary} text-xs`}>
                      {variant.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Full description */}
                <p className={`${theme.text.muted} text-xs leading-relaxed line-clamp-2`}>
                  {variant.description}
                </p>

                {/* Sub-variant indicator */}
                {variant.subVariants && !isComingSoon && (
                  <div className={`mt-3 pt-3 border-t ${theme.card.border} flex items-center gap-2`}>
                    <span className={`${theme.text.muted} text-xs`}>
                      Options available
                    </span>
                    <span className={`${theme.accent} text-xs`}>
                      →
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}