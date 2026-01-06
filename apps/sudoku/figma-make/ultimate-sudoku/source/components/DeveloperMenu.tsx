import { useState, useEffect, useRef } from 'react';
import { X, Code, Trash2, Eye, Shuffle, Settings, Database, Trophy, AlertCircle, Pause, FlaskConical } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

interface DeveloperMenuProps {
  onClose: () => void;
  onNavigateToLab?: () => void;
}

export function DeveloperMenu({ onClose, onNavigateToLab }: DeveloperMenuProps) {
  const { theme, themeType, setThemeType } = useTheme();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const clearLocalStorage = (key?: string) => {
    if (key) {
      localStorage.removeItem(key);
      console.log(`Cleared localStorage: ${key}`);
    } else {
      localStorage.clear();
      console.log('Cleared all localStorage');
    }
  };

  const logGameState = () => {
    const gameState = localStorage.getItem('sudokuGameState');
    const lockMode = localStorage.getItem('lockModePreference');
    const gridSettings = localStorage.getItem('gridSettings');
    const zenSettings = localStorage.getItem('zenModeSettings');
    
    console.log('=== GAME STATE ===');
    console.log('Saved Game:', gameState ? JSON.parse(gameState) : 'None');
    console.log('Lock Mode Preference:', lockMode);
    console.log('Grid Settings:', gridSettings ? JSON.parse(gridSettings) : 'Default');
    console.log('Zen Settings:', zenSettings ? JSON.parse(zenSettings) : 'None');
  };

  const triggerGameState = (state: 'pause' | 'win' | 'lose') => {
    // Set a flag that the game can listen for
    sessionStorage.setItem('devTrigger', state);
    window.dispatchEvent(new CustomEvent('devTrigger', { detail: state }));
    console.log(`Triggered game state: ${state}`);
  };

  const themes: Array<typeof themeType> = ['current', 'light', 'dark', 'grayscale', 'vibrant', 'match-device'];
  const themeLabels: Record<typeof themeType, string> = {
    'current': 'Current',
    'light': 'Light',
    'dark': 'Dark',
    'grayscale': 'Grayscale',
    'vibrant': 'Vibrant',
    'match-device': 'Match Device'
  };

  return (
    <div
      ref={menuRef}
      className={`fixed z-[9999] ${theme.card.background} ${theme.card.border} border rounded-2xl shadow-2xl backdrop-blur-xl`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '400px',
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      {/* Header - Draggable */}
      <div
        className={`flex items-center justify-between p-4 border-b ${theme.card.border} cursor-move select-none`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Code className={`w-5 h-5 ${theme.accent}`} />
          <h2 className={theme.text.primary}>Developer Menu</h2>
        </div>
        <Button
          onClick={onClose}
          className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} p-2`}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Lab Navigation */}
        {onNavigateToLab && (
          <div className="space-y-2">
            <h3 className={`text-sm ${theme.text.secondary} flex items-center gap-2`}>
              <FlaskConical className="w-4 h-4" />
              Design Lab
            </h3>
            <Button
              onClick={onNavigateToLab}
              className={`
                ${theme.button.primary.background}
                ${theme.button.primary.hover}
                ${theme.button.primary.text}
                w-full transition-all duration-300 text-sm
              `}
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Open Daily Challenge Lab
            </Button>
          </div>
        )}

        {/* Theme Switcher */}
        <div className="space-y-2">
          <h3 className={`text-sm ${theme.text.secondary} flex items-center gap-2`}>
            <Settings className="w-4 h-4" />
            Quick Theme Switch
          </h3>
          <select
            value={themeType}
            onChange={(e) => setThemeType(e.target.value as typeof themeType)}
            className={`
              ${theme.input.background}
              ${theme.input.border}
              ${theme.input.text}
              w-full px-3 py-2 rounded-lg border
              transition-all duration-300
              cursor-pointer
            `}
          >
            {themes.map((t) => (
              <option key={t} value={t}>
                {themeLabels[t]}
              </option>
            ))}
          </select>
        </div>

        {/* LocalStorage Actions */}
        <div className="space-y-2">
          <h3 className={`text-sm ${theme.text.secondary} flex items-center gap-2`}>
            <Database className="w-4 h-4" />
            LocalStorage
          </h3>
          <div className="space-y-2">
            <Button
              onClick={() => clearLocalStorage('sudokuGameState')}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              Clear Saved Game
            </Button>
            <Button
              onClick={() => clearLocalStorage('gridSettings')}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              Reset Grid Settings
            </Button>
            <Button
              onClick={() => clearLocalStorage('lockModePreference')}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              Reset Lock Mode Preference
            </Button>
            <Button
              onClick={() => clearLocalStorage()}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All LocalStorage
            </Button>
          </div>
        </div>

        {/* Debug Actions */}
        <div className="space-y-2">
          <h3 className={`text-sm ${theme.text.secondary} flex items-center gap-2`}>
            <Eye className="w-4 h-4" />
            Debug
          </h3>
          <div className="space-y-2">
            <Button
              onClick={logGameState}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              Log Game State to Console
            </Button>
            <Button
              onClick={() => triggerGameState('pause')}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              <Pause className="w-4 h-4 mr-2" />
              Trigger Pause
            </Button>
            <Button
              onClick={() => triggerGameState('win')}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Trigger Win
            </Button>
            <Button
              onClick={() => triggerGameState('lose')}
              className={`
                ${theme.button.secondary.background}
                ${theme.button.secondary.hover}
                ${theme.button.secondary.text}
                ${theme.card.border} border
                w-full transition-all duration-300 text-sm
              `}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Trigger Lose
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className={`p-3 rounded-lg ${theme.card.border} border`}>
          <p className={`text-xs ${theme.text.muted}`}>
            <strong className={theme.text.secondary}>Tip:</strong> Press Ctrl+Shift+D to toggle this menu
          </p>
        </div>
      </div>
    </div>
  );
}