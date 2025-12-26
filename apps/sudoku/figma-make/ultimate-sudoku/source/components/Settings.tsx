import { ArrowLeft, Volume2, Music, Bell, Vibrate, Globe, Moon, Palette, Info, Gamepad2, Grid3x3, Maximize2, VolumeX, CheckSquare, Square, ArrowRight, Sparkles, BellOff } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsProps {
  onBack: () => void;
}

// Tooltip wrapper component for consistent styling
function SettingTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex ${theme.text.muted} hover:${theme.text.primary} transition-colors`}>
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

// 3x3 Grid Preview Component
function GridPreview({ gridScale, digitScale, noteScale }: { gridScale: number; digitScale: number; noteScale: number }) {
  const { theme } = useTheme();
  
  // Sample data for preview - fixed to never overlap
  const previewCells = [
    { value: 5, notes: [] },
    { value: 0, notes: [1, 2, 3] },
    { value: 7, notes: [] },
    { value: 0, notes: [4, 6] },
    { value: 9, notes: [] },
    { value: 0, notes: [2, 8] },
    { value: 3, notes: [] },
    { value: 0, notes: [5, 7, 9] },
    { value: 6, notes: [] },
  ];

  // Grid size ONLY affects cell dimensions
  const baseSize = 48;
  const cellSize = (baseSize * gridScale) / 100;
  
  // Font sizes scale INDEPENDENTLY with proper constraints
  const baseDigitSize = 20;
  
  const digitFontSize = (baseDigitSize * digitScale) / 100;
  
  // Note size as PERCENTAGE of sub-cell - no cap needed!
  // This ensures notes always fit and scale naturally with grid size
  const subCellSize = cellSize / 3;
  const notePercentage = 0.5 + (noteScale - 100) / 500; // Maps 100→50%, 150→60%, 200→70%, 250→80%, 300→90%
  const noteFontSize = subCellSize * notePercentage;

  return (
    <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 flex items-center justify-center backdrop-blur-xl`}>
      <div 
        className="grid grid-cols-3 gap-0 border-2 rounded-lg overflow-hidden"
        style={{ 
          width: `${cellSize * 3}px`,
          height: `${cellSize * 3}px`,
          borderColor: 'currentColor'
        }}
      >
        {previewCells.map((cell, idx) => (
          <div
            key={idx}
            className={`${theme.card.border} border flex items-center justify-center relative bg-white/5 overflow-hidden`}
            style={{ 
              width: `${cellSize}px`,
              height: `${cellSize}px`
            }}
          >
            {cell.value !== 0 ? (
              <span 
                className={theme.text.primary}
                style={{ 
                  fontSize: `${Math.min(digitFontSize, cellSize * 0.7)}px`, 
                  lineHeight: 1 
                }}
              >
                {cell.value}
              </span>
            ) : (
              <div className="absolute inset-0 grid grid-cols-3 gap-0 p-0">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div
                    key={num}
                    className={`flex items-center justify-center ${
                      cell.notes.includes(num) ? theme.text.muted : 'opacity-0'
                    }`}
                    style={{ 
                      fontSize: `${noteFontSize}px`, 
                      lineHeight: 0.8,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Settings({ onBack }: SettingsProps) {
  const { theme, themeType, setThemeType } = useTheme();
  const settings = useSettings();
  
  // Convert context values to arrays for Slider components
  const gridSize = [settings.gridSize];
  const setGridSize = (val: number[]) => settings.setGridSize(val[0]);
  
  const digitSize = [settings.digitSize];
  const setDigitSize = (val: number[]) => settings.setDigitSize(val[0]);
  
  const noteSize = [settings.noteSize];
  const setNoteSize = (val: number[]) => settings.setNoteSize(val[0]);
  
  const livesLimit = [settings.livesLimit];
  const setLivesLimit = (val: number[]) => settings.setLivesLimit(val[0]);
  
  const soundVolume = [settings.soundVolume];
  const setSoundVolume = (val: number[]) => settings.setSoundVolume(val[0]);
  
  const musicVolume = [settings.musicVolume];
  const setMusicVolume = (val: number[]) => settings.setMusicVolume(val[0]);

  return (
    <div className="max-w-4xl mx-auto min-h-screen py-8 pb-24">
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
        <h1 className={`text-3xl md:text-4xl ${theme.text.primary}`}>Settings</h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6 px-4">
        {/* Gameplay Settings */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 space-y-5 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Gamepad2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Gameplay
          </h2>
          
          <div className="space-y-5">
            {/* Auto Candidates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.autoCandidates ? (
                  <CheckSquare className={`w-4 h-4 ${theme.accent}`} />
                ) : (
                  <Square className={`w-4 h-4 ${theme.text.muted}`} />
                )}
                <Label 
                  htmlFor="auto-candidates" 
                  className={`text-sm transition-colors flex items-center gap-1.5 ${settings.autoCandidates ? theme.text.secondary : theme.text.muted}`}
                >
                  Auto Candidates {!settings.autoCandidates && <span className="opacity-70">(Off)</span>}
                  <SettingTooltip text="Shows pencil-mark candidates in empty cells. Updates automatically as the board changes.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
              </div>
              <Switch
                id="auto-candidates"
                checked={settings.autoCandidates}
                onCheckedChange={settings.setAutoCandidates}
              />
            </div>

            {/* Auto Advance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className={`w-4 h-4 ${settings.autoAdvance ? theme.accent : theme.text.muted}`} />
                <Label 
                  htmlFor="auto-advance" 
                  className={`text-sm transition-colors flex items-center gap-1.5 ${settings.autoAdvance ? theme.text.secondary : theme.text.muted}`}
                >
                  Auto-advance {!settings.autoAdvance && <span className="opacity-70">(Off)</span>}
                  <SettingTooltip text="After you type a number, selection moves to the next cell. Hold Shift to move backward.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
              </div>
              <Switch
                id="auto-advance"
                checked={settings.autoAdvance}
                onCheckedChange={settings.setAutoAdvance}
              />
            </div>

            {/* Hint Type */}
            <div className="space-y-2 pr-16">
              <Label htmlFor="hint-mode" className={`${theme.text.secondary} text-sm flex items-center gap-1.5`}>
                Hint Type
                <SettingTooltip text="Choose how the Hint button helps: • Direct: place a correct digit. • Logic: highlight a solvable cell and explain. • Assist: show candidates and safe numbers. • Escalate: highlight → candidates → reveal.">
                  <Info className="w-3.5 h-3.5" />
                </SettingTooltip>
              </Label>
              <Select value={settings.hintMode} onValueChange={settings.setHintMode}>
                <SelectTrigger id="hint-mode" className={`${theme.input.background} ${theme.input.border} ${theme.input.text}`}>
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

            {/* Zen Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${settings.zenMode ? theme.accent : theme.text.muted}`} />
                <Label 
                  htmlFor="zen-mode" 
                  className={`text-sm transition-colors flex items-center gap-1.5 ${settings.zenMode ? theme.text.secondary : theme.text.muted}`}
                >
                  Zen Mode {!settings.zenMode && <span className="opacity-70">(Off)</span>}
                  <SettingTooltip text="A calmer experience: • Hides timer, Lives, difficulty, and status. • Runs don't update stats or best times. • Daily puzzles keep fixed Lives. • Sets Lives to Unlimited and disables the Lives slider.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
              </div>
              <Switch
                id="zen-mode"
                checked={settings.zenMode}
                onCheckedChange={settings.setZenMode}
              />
            </div>

            {/* Lives Limit */}
            <div className={`${settings.zenMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <Label htmlFor="lives-limit" className={`${theme.text.secondary} text-sm flex items-center gap-1.5 mb-0`}>
                Lives
                <SettingTooltip text="Lives limit how many wrong entries you can make. Set to 11 for Unlimited. Disabled in Zen mode (Lives are Unlimited). Daily puzzles use fixed Lives by difficulty; this setting won't override Daily.">
                  <Info className="w-3.5 h-3.5" />
                </SettingTooltip>
              </Label>
              <div className="pr-16 -mt-2">
                <div className="flex justify-end mb-0.5">
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
                  disabled={settings.zenMode}
                />
                <div className={`flex justify-between text-xs ${theme.text.muted} mt-0.5`}>
                  <span>0</span>
                  <span>∞</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Sizing Settings */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Maximize2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Grid Sizing
          </h2>

          {/* Desktop: Side-by-side, Mobile: Stacked */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sliders - Left side on desktop */}
            <div className="space-y-5 flex-1">
              {/* Grid Size */}
              <div>
                <Label htmlFor="grid-size" className={`${theme.text.secondary} text-sm flex items-center gap-1.5 mb-0`}>
                  Grid Size
                  <SettingTooltip text="Adjusts overall board/cell size.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
                <div className="pr-16 -mt-2">
                  <div className="flex justify-end mb-0.5">
                    <span className={`text-sm ${theme.text.primary}`}>
                      {gridSize[0] === 85 ? 'S' : gridSize[0] === 100 ? 'M' : 'L'}
                    </span>
                  </div>
                  <Slider
                    value={gridSize}
                    onValueChange={setGridSize}
                    min={85}
                    max={115}
                    step={15}
                    className="w-full"
                  />
                  <div className={`flex justify-between text-xs ${theme.text.muted} mt-0.5`}>
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
              </div>

              {/* Input Number Size */}
              <div>
                <Label htmlFor="digit-size" className={`${theme.text.secondary} text-sm flex items-center gap-1.5 mb-0`}>
                  Input Number Size
                  <SettingTooltip text="Scales the main digit inside each cell.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
                <div className="pr-16 -mt-2">
                  <div className="flex justify-end mb-0.5">
                    <span className={`text-sm ${theme.text.primary}`}>
                      {digitSize[0] === 80 ? 'XS' : digitSize[0] === 90 ? 'S' : digitSize[0] === 100 ? 'M' : digitSize[0] === 110 ? 'L' : 'XL'}
                    </span>
                  </div>
                  <Slider
                    value={digitSize}
                    onValueChange={setDigitSize}
                    min={80}
                    max={120}
                    step={10}
                    className="w-full"
                  />
                  <div className={`flex justify-between text-xs ${theme.text.muted} mt-0.5`}>
                    <span>XS</span>
                    <span>XL</span>
                  </div>
                </div>
              </div>

              {/* Notes Size */}
              <div>
                <Label htmlFor="note-size" className={`${theme.text.secondary} text-sm flex items-center gap-1.5 mb-0`}>
                  Notes Size
                  <SettingTooltip text="Scales pencil-mark annotations.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
                <div className="pr-16 -mt-2">
                  <div className="flex justify-end mb-0.5">
                    <span className={`text-sm ${theme.text.primary}`}>
                      {noteSize[0] === 100 ? 'XS' : noteSize[0] === 150 ? 'S' : noteSize[0] === 200 ? 'M' : noteSize[0] === 250 ? 'L' : 'XL'}
                    </span>
                  </div>
                  <Slider
                    value={noteSize}
                    onValueChange={setNoteSize}
                    min={100}
                    max={300}
                    step={50}
                    className="w-full"
                  />
                  <div className={`flex justify-between text-xs ${theme.text.muted} mt-0.5`}>
                    <span>XS</span>
                    <span>XL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview - Right side on desktop, below on mobile */}
            <div className="lg:w-48 lg:shrink-0 flex items-center justify-center">
              <div className="space-y-2">
                <Label className={`${theme.text.secondary} text-sm text-center block lg:hidden`}>Preview</Label>
                <GridPreview 
                  gridScale={gridSize[0]} 
                  digitScale={digitSize[0]} 
                  noteScale={noteSize[0]} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 space-y-5 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Volume2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Audio
          </h2>
          
          <div className="space-y-5">
            {/* Sound Effects */}
            <div>
              <div className="flex items-center justify-between mb-0">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className={`w-4 h-4 ${theme.accent}`} />
                  ) : (
                    <VolumeX className={`w-4 h-4 ${theme.text.muted}`} />
                  )}
                  <Label 
                    htmlFor="sound-effects" 
                    className={`text-sm transition-colors ${settings.soundEnabled ? theme.text.secondary : theme.text.muted}`}
                  >
                    Sound Effects {!settings.soundEnabled && <span className="opacity-70">(Off)</span>}
                  </Label>
                </div>
                <Switch
                  id="sound-effects"
                  checked={settings.soundEnabled}
                  onCheckedChange={settings.setSoundEnabled}
                />
              </div>
              {settings.soundEnabled && (
                <div className="pl-6 pr-12 -mt-2">
                  <div className="flex justify-end mb-0.5">
                    <span className={`text-xs ${theme.text.muted}`}>{soundVolume[0]}%</span>
                  </div>
                  <Slider
                    value={soundVolume}
                    onValueChange={setSoundVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Music */}
            <div>
              <div className="flex items-center justify-between mb-0">
                <div className="flex items-center gap-2">
                  {settings.musicEnabled ? (
                    <Music className={`w-4 h-4 ${theme.accent}`} />
                  ) : (
                    <VolumeX className={`w-4 h-4 ${theme.text.muted}`} />
                  )}
                  <Label 
                    htmlFor="music" 
                    className={`text-sm transition-colors ${settings.musicEnabled ? theme.text.secondary : theme.text.muted}`}
                  >
                    Music {!settings.musicEnabled && <span className="opacity-70">(Off)</span>}
                  </Label>
                </div>
                <Switch
                  id="music"
                  checked={settings.musicEnabled}
                  onCheckedChange={settings.setMusicEnabled}
                />
              </div>
              {settings.musicEnabled && (
                <div className="pl-6 pr-12 -mt-2">
                  <div className="flex justify-end mb-0.5">
                    <span className={`text-xs ${theme.text.muted}`}>{musicVolume[0]}%</span>
                  </div>
                  <Slider
                    value={musicVolume}
                    onValueChange={setMusicVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Haptics */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className={`w-4 h-4 ${settings.hapticsEnabled ? theme.accent : theme.text.muted}`} />
                <Label 
                  htmlFor="haptics" 
                  className={`text-sm transition-colors flex items-center gap-1.5 ${settings.hapticsEnabled ? theme.text.secondary : theme.text.muted}`}
                >
                  Haptics {!settings.hapticsEnabled && <span className="opacity-70">(Off)</span>}
                  <SettingTooltip text="Provides tactile feedback when interacting with the game.">
                    <Info className="w-3.5 h-3.5" />
                  </SettingTooltip>
                </Label>
              </div>
              <Switch
                id="haptics"
                checked={settings.hapticsEnabled}
                onCheckedChange={settings.setHapticsEnabled}
              />
            </div>
          </div>
        </div>

        {/* Display & Language */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 space-y-5 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Moon className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Display & Language
          </h2>
          
          <div className="space-y-2 pr-16">
            <Label htmlFor="language" className={`${theme.text.secondary} text-sm flex items-center gap-1.5`}>
              <Globe className="w-3.5 h-3.5" />
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

          <div className="space-y-2 pr-16">
            <Label htmlFor="theme" className={`${theme.text.secondary} text-sm flex items-center gap-1.5`}>
              <Palette className="w-3.5 h-3.5" />
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
        </div>

        {/* Notifications */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-xl`}>
          <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
            <Bell className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Notifications
          </h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.notificationsEnabled ? (
                <Bell className={`w-4 h-4 ${theme.accent}`} />
              ) : (
                <BellOff className={`w-4 h-4 ${theme.text.muted}`} />
              )}
              <Label 
                htmlFor="notifications" 
                className={`text-sm transition-colors ${settings.notificationsEnabled ? theme.text.secondary : theme.text.muted}`}
              >
                Push Notifications {!settings.notificationsEnabled && <span className="opacity-70">(Off)</span>}
              </Label>
            </div>
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