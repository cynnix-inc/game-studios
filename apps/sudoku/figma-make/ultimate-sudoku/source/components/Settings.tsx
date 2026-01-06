import { ArrowLeft, Volume2, Music, Bell, Vibrate, Globe, Moon, Palette, Info, Gamepad2, Grid3x3, Maximize2, VolumeX, CheckSquare, Square, ArrowRight, Sparkles, BellOff, Lightbulb, FlaskConical } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { GridCustomizer } from './GridCustomizer';

interface SettingsProps {
  onBack: () => void;
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

export function Settings({ onBack }: SettingsProps) {
  const { theme, themeType, setThemeType } = useTheme();
  const settings = useSettings();
  const [showGridCustomizer, setShowGridCustomizer] = useState(false);
  
  // Convert context values to arrays for Slider components
  const livesLimit = [settings.livesLimit];
  const setLivesLimit = (val: number[]) => settings.setLivesLimit(val[0]);
  
  const soundVolume = [settings.soundVolume];
  const setSoundVolume = (val: number[]) => settings.setSoundVolume(val[0]);
  
  const musicVolume = [settings.musicVolume];
  const setMusicVolume = (val: number[]) => settings.setMusicVolume(val[0]);

  const handleGridCustomizerSave = (newSettings: {
    gridSize: number;
    digitSize: number;
    noteSize: number;
    highlightContrast: number;
    highlightAssistance: boolean;
  }) => {
    settings.setGridSize(newSettings.gridSize);
    settings.setDigitSize(newSettings.digitSize);
    settings.setNoteSize(newSettings.noteSize);
    settings.setHighlightContrast(newSettings.highlightContrast);
    settings.setHighlightAssistance(newSettings.highlightAssistance);
    setShowGridCustomizer(false);
  };

  if (showGridCustomizer) {
    return (
      <GridCustomizer
        initialSettings={{
          gridSize: settings.gridSize,
          digitSize: settings.digitSize,
          noteSize: settings.noteSize,
          highlightContrast: settings.highlightContrast,
          highlightAssistance: settings.highlightAssistance,
        }}
        onSave={handleGridCustomizerSave}
        onCancel={() => setShowGridCustomizer(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen py-8 pb-24">
      {/* Header */}
      <div className="mb-8 px-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className={`mb-4 ${theme.text.primary} ${theme.card.hover}`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className={`text-3xl md:text-4xl ${theme.text.primary}`}>Settings</h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-5 px-4">
        {/* Gameplay Settings */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Gamepad2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Gameplay
          </h2>
          
          {/* 2-column grid for toggles and dropdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Auto Candidates */}
            <div className="flex items-center gap-2.5">
              <Grid3x3 className={`w-4 h-4 ${settings.autoCandidates ? theme.accent : theme.text.muted}`} />
              <Label 
                htmlFor="auto-candidates" 
                className={`text-sm transition-colors flex items-center gap-1.5 ${settings.autoCandidates ? theme.text.secondary : theme.text.muted}`}
              >
                Auto Candidates
                <SettingTooltip text="Shows pencil-mark candidates in empty cells. Updates automatically as the board changes.">
                  <Info className="w-3.5 h-3.5" />
                </SettingTooltip>
              </Label>
              <Switch
                id="auto-candidates"
                checked={settings.autoCandidates}
                onCheckedChange={settings.setAutoCandidates}
              />
            </div>

            {/* Auto Advance */}
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

            {/* Hint Type */}
          </div>

          <div className={`border-t ${theme.card.border}`} />

          {/* Lives Limit - Full Width */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="lives-limit" className={`${theme.text.secondary} text-sm flex items-center gap-1.5`}>
                Lives
                <SettingTooltip text="Lives limit how many wrong entries you can make. Set to 11 for Unlimited. Daily puzzles use fixed Lives by difficulty; this setting won't override Daily.">
                  <Info className="w-3.5 h-3.5" />
                </SettingTooltip>
              </Label>
              <span className={`text-sm ${theme.text.primary}`}>
                {livesLimit[0] === 11 ? '∞' : livesLimit[0]}
              </span>
            </div>
            <Slider
              value={livesLimit}
              onValueChange={setLivesLimit}
              min={0}
              max={11}
              step={1}
              className="w-full"
            />
            <div className={`flex justify-between text-xs ${theme.text.muted} mt-1`}>
              <span>0</span>
              <span>∞</span>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Volume2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Audio
          </h2>
          
          <div className="space-y-4">
            {/* Sound Effects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Volume2 className={`w-4 h-4 ${settings.soundEnabled ? theme.accent : theme.text.muted}`} />
                  <Label 
                    htmlFor="sound-effects" 
                    className={`text-sm transition-colors ${settings.soundEnabled ? theme.text.secondary : theme.text.muted}`}
                  >
                    Sound Effects
                  </Label>
                  <Switch
                    id="sound-effects"
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
                    htmlFor="music" 
                    className={`text-sm transition-colors ${settings.musicEnabled ? theme.text.secondary : theme.text.muted}`}
                  >
                    Music
                  </Label>
                  <Switch
                    id="music"
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Vibrate className={`w-4 h-4 ${settings.hapticsEnabled ? theme.accent : theme.text.muted}`} />
                <Label 
                  htmlFor="haptics" 
                  className={`text-sm transition-colors flex items-center gap-1.5 ${settings.hapticsEnabled ? theme.text.secondary : theme.text.muted}`}
                >
                  Haptics
                  <SettingTooltip text="Provides tactile feedback when interacting with the game.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
                <Switch
                  id="haptics"
                  checked={settings.hapticsEnabled}
                  onCheckedChange={settings.setHapticsEnabled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Sizing Settings */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Maximize2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Grid Customization
          </h2>

          <p className={`text-sm ${theme.text.secondary}`}>
            Adjust grid size, digit size, note size, and highlight settings with a full-screen preview.
          </p>

          <Button
            onClick={() => setShowGridCustomizer(true)}
            className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} w-full`}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Customize Grid
          </Button>
        </div>

        {/* Preferences (Theme, Language, Notifications) */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Palette className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Preferences
          </h2>
          
          {/* 2-column grid for dropdowns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme" className={`${theme.text.secondary} text-sm`}>
                Theme
              </Label>
              <Select value={themeType} onValueChange={setThemeType}>
                <SelectTrigger id="theme" className={`${theme.input.background} ${theme.input.border} ${theme.input.text}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`${theme.card.background} ${theme.card.border} border backdrop-blur-xl`}>
                  <ThemedSelectItem value="default">Default</ThemedSelectItem>
                  <ThemedSelectItem value="light">Light</ThemedSelectItem>
                  <ThemedSelectItem value="dark">Dark</ThemedSelectItem>
                  <ThemedSelectItem value="grayscale">Grayscale</ThemedSelectItem>
                  <ThemedSelectItem value="device">Match Device</ThemedSelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className={`${theme.text.secondary} text-sm`}>
                Language
              </Label>
              <Select defaultValue="en">
                <SelectTrigger id="language" className={`${theme.input.background} ${theme.input.border} ${theme.input.text}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`${theme.card.background} ${theme.card.border} border backdrop-blur-xl`}>
                  <ThemedSelectItem value="en">English</ThemedSelectItem>
                  <ThemedSelectItem value="es">Español</ThemedSelectItem>
                  <ThemedSelectItem value="fr">Français</ThemedSelectItem>
                  <ThemedSelectItem value="de">Deutsch</ThemedSelectItem>
                  <ThemedSelectItem value="ja">日本語</ThemedSelectItem>
                  <ThemedSelectItem value="zh">中文</ThemedSelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`border-t ${theme.card.border}`} />

          {/* Notifications */}
          <div className="flex items-center gap-2.5">
            <Bell className={`w-4 h-4 ${settings.notificationsEnabled ? theme.accent : theme.text.muted}`} />
            <Label 
              htmlFor="notifications" 
              className={`text-sm transition-colors ${settings.notificationsEnabled ? theme.text.secondary : theme.text.muted}`}
            >
              Push Notifications
            </Label>
            <Switch
              id="notifications"
              checked={settings.notificationsEnabled}
              onCheckedChange={settings.setNotificationsEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}