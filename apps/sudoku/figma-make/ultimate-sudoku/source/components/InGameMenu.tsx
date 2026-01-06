import { Play, RotateCcw, LogOut, Volume2, Music, Vibrate, Maximize2, Gamepad2, ChevronDown, ChevronUp, ArrowRight, Lightbulb, Grid3x3, Info, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useState } from 'react';

interface InGameMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onOpenGridCustomizer?: () => void;
}

// Tooltip wrapper component for consistent styling
function SettingTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex ${theme.text.muted} ${theme.card.hover} transition-colors`}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className={`${theme.card.background} ${theme.card.border} border ${theme.text.secondary} backdrop-blur-xl max-w-xs`}>
        <p className="text-xs leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Themed SelectItem wrapper
function ThemedSelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <SelectItem 
      value={value} 
      className={`${theme.text.primary} [&[data-highlighted]]:bg-white/20 dark:[&[data-highlighted]]:bg-white/10 cursor-pointer transition-colors`}
    >
      {children}
    </SelectItem>
  );
}

export function InGameMenu({ onResume, onRestart, onExit, onOpenGridCustomizer }: InGameMenuProps) {
  const { theme } = useTheme();
  const settings = useSettings();

  // State for expanding/collapsing sections
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [gameplayExpanded, setGameplayExpanded] = useState(false);

  // Convert context values to arrays for Slider components
  const soundVolume = [settings.soundVolume];
  const setSoundVolume = (val: number[]) => settings.setSoundVolume(val[0]);
  
  const musicVolume = [settings.musicVolume];
  const setMusicVolume = (val: number[]) => settings.setMusicVolume(val[0]);

  return (
    <div className="w-full max-h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="max-w-xl lg:max-w-2xl mx-auto p-4 md:p-6 space-y-3">
        {/* Action Buttons - Horizontal on all screens */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onResume}
            className={`h-11 text-sm md:text-base ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300`}
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">Resume</span>
          </Button>

          <Button
            onClick={onRestart}
            className={`h-11 text-sm md:text-base ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} transition-all duration-300`}
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">Restart</span>
          </Button>

          <Button
            onClick={onExit}
            className="h-11 text-sm md:text-base bg-red-500/40 hover:bg-red-500/60 border-2 border-red-500 text-red-100 hover:text-white backdrop-blur-xl transition-all duration-300 shadow-lg shadow-red-500/20"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">Exit</span>
          </Button>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-2">
          {/* Audio Settings */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl overflow-hidden`}>
            <button
              onClick={() => setAudioExpanded(!audioExpanded)}
              className={`w-full px-4 py-3 flex items-center justify-between ${theme.card.hover} transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Volume2 className={`w-5 h-5 ${theme.accent}`} />
                <span className={theme.text.primary}>Audio Settings</span>
              </div>
              {audioExpanded ? (
                <ChevronUp className={`w-5 h-5 ${theme.text.muted}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${theme.text.muted}`} />
              )}
            </button>

            {audioExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                {/* Sound Effects */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className={`w-4 h-4 ${settings.soundEnabled ? theme.accent : theme.text.muted}`} />
                      <Label 
                        htmlFor="game-sound" 
                        className={`text-sm transition-colors ${settings.soundEnabled ? theme.text.secondary : theme.text.muted}`}
                      >
                        Sound Effects
                      </Label>
                      <Switch
                        id="game-sound"
                        checked={settings.soundEnabled}
                        onCheckedChange={settings.setSoundEnabled}
                      />
                    </div>
                    {settings.soundEnabled && (
                      <span className={`text-sm ${theme.text.primary}`}>{soundVolume[0]}%</span>
                    )}
                  </div>
                  {settings.soundEnabled && (
                    <div>
                      <Slider
                        value={soundVolume}
                        onValueChange={setSoundVolume}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className={`flex justify-between text-xs ${theme.text.muted} mt-1`}>
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Music */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Music className={`w-4 h-4 ${settings.musicEnabled ? theme.accent : theme.text.muted}`} />
                      <Label 
                        htmlFor="game-music" 
                        className={`text-sm transition-colors ${settings.musicEnabled ? theme.text.secondary : theme.text.muted}`}
                      >
                        Music
                      </Label>
                      <Switch
                        id="game-music"
                        checked={settings.musicEnabled}
                        onCheckedChange={settings.setMusicEnabled}
                      />
                    </div>
                    {settings.musicEnabled && (
                      <span className={`text-sm ${theme.text.primary}`}>{musicVolume[0]}%</span>
                    )}
                  </div>
                  {settings.musicEnabled && (
                    <div>
                      <Slider
                        value={musicVolume}
                        onValueChange={setMusicVolume}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className={`flex justify-between text-xs ${theme.text.muted} mt-1`}>
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`border-t ${theme.card.border}`} />

                {/* Haptics */}
                <div className="flex items-center gap-2.5">
                  <Vibrate className={`w-4 h-4 ${settings.hapticsEnabled ? theme.accent : theme.text.muted}`} />
                  <Label 
                    htmlFor="game-haptics" 
                    className={`text-sm transition-colors ${settings.hapticsEnabled ? theme.text.secondary : theme.text.muted}`}
                  >
                    Haptics
                  </Label>
                  <Switch
                    id="game-haptics"
                    checked={settings.hapticsEnabled}
                    onCheckedChange={settings.setHapticsEnabled}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gameplay Assists */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl overflow-hidden`}>
            <button
              onClick={() => setGameplayExpanded(!gameplayExpanded)}
              className={`w-full px-4 py-3 flex items-center justify-between ${theme.card.hover} transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Gamepad2 className={`w-5 h-5 ${theme.accent}`} />
                <span className={theme.text.primary}>Gameplay Assists</span>
              </div>
              {gameplayExpanded ? (
                <ChevronUp className={`w-5 h-5 ${theme.text.muted}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${theme.text.muted}`} />
              )}
            </button>

            {gameplayExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                {/* Auto-advance */}
                <div className="flex items-center gap-2.5">
                  <ArrowRight className={`w-4 h-4 ${settings.autoAdvance ? theme.accent : theme.text.muted}`} />
                  <Label 
                    htmlFor="auto-advance" 
                    className={`text-sm transition-colors flex items-center gap-1.5 ${settings.autoAdvance ? theme.text.secondary : theme.text.muted}`}
                  >
                    Auto-advance
                    <SettingTooltip text="After you type a number, selection moves to the next cell. Hold Shift to move backward.">
                      <Info className="w-3.5 h-3.5" />
                    </SettingTooltip>
                  </Label>
                  <Switch
                    id="auto-advance"
                    checked={settings.autoAdvance}
                    onCheckedChange={settings.setAutoAdvance}
                  />
                </div>

                <div className={`border-t ${theme.card.border}`} />

                {/* Hint Type */}
                <div className="flex items-center gap-2.5">
                  <Lightbulb className={`w-4 h-4 ${theme.accent}`} />
                  <Label htmlFor="hint-mode" className={`${theme.text.secondary} text-sm flex items-center gap-1.5 whitespace-nowrap`}>
                    Hint Type
                    <SettingTooltip text="Choose how the Hint button helps: • Direct: place a correct digit. • Logic: highlight a solvable cell and explain. • Assist: show candidates and safe numbers. • Escalate: highlight → candidates → reveal.">
                      <Info className="w-3.5 h-3.5" />
                    </SettingTooltip>
                  </Label>
                  <Select value={settings.hintMode} onValueChange={settings.setHintMode}>
                    <SelectTrigger id="hint-mode" className={`${theme.input.background} ${theme.input.border} ${theme.input.text} w-32`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`${theme.card.background} ${theme.card.border} border backdrop-blur-xl`}>
                      <ThemedSelectItem value="direct">Direct</ThemedSelectItem>
                      <ThemedSelectItem value="logic">Logic</ThemedSelectItem>
                      <ThemedSelectItem value="assist">Assist</ThemedSelectItem>
                      <ThemedSelectItem value="escalate">Escalate</ThemedSelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Grid Sizing */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl overflow-hidden`}>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <Maximize2 className={`w-5 h-5 ${theme.accent}`} />
                <span className={theme.text.primary}>Grid Customization</span>
              </div>

              <p className={`text-sm ${theme.text.secondary} mb-3`}>
                Adjust grid size, digit size, note size, and highlight settings with a full-screen preview.
              </p>

              <Button
                onClick={onOpenGridCustomizer}
                className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} w-full transition-all duration-300`}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Customize Grid
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}