import { Map, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

export function JourneyCard() {
  const { theme } = useTheme();

  return (
    <div 
      className={`${theme.card.background} ${theme.card.border} border rounded-xl p-3 md:p-4 shadow-xl backdrop-blur-xl opacity-60 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg`}>
            <Map className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`${theme.text.primary} text-sm md:text-base`}>Journey</h3>
              <span className={`bg-gradient-to-r from-purple-500 to-pink-500 ${theme.button.primary.text} text-xs px-2 py-0.5 rounded-full shadow-lg`}>
                COMING SOON
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            disabled
            className={`${theme.button.secondary.background} ${theme.button.secondary.text} ${theme.card.border} border backdrop-blur-xl transition-all duration-300 p-2 cursor-not-allowed opacity-50`}
          >
            <Map className="w-3 h-3 md:w-4 md:h-4" />
          </Button>

          <Button 
            disabled
            className={`${theme.button.secondary.background} ${theme.button.secondary.text} ${theme.card.border} border cursor-not-allowed transition-all duration-300 p-2 opacity-50`}
          >
            <Lock className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}