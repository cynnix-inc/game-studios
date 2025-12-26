import { Play, RotateCcw, LogOut, Volume2, Music, Vibrate, Maximize2, VolumeX, Gamepad2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useState } from 'react';

interface InGameMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
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

  const baseSize = 40;
  const cellSize = (baseSize * gridScale) / 100;
  const baseDigitSize = 16;
  const digitFontSize = (baseDigitSize * digitScale) / 100;
  const subCellSize = cellSize / 3;
  const notePercentage = 0.5 + (noteScale - 100) / 500;
  const noteFontSize = subCellSize * notePercentage;

  return (
    <div className="flex items-center justify-center">
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

export function InGameMenu({ onResume, onRestart, onExit }: InGameMenuProps) {
  const { theme } = useTheme();
  const settings = useSettings();

  // State for expanding/collapsing sections
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [gameplayExpanded, setGameplayExpanded] = useState(false);
  const [gridExpanded, setGridExpanded] = useState(false);

  // Convert context values to arrays for Slider components
  const soundVolume = [settings.soundVolume];
  const setSoundVolume = (val: number[]) => settings.setSoundVolume(val[0]);
  
  const musicVolume = [settings.musicVolume];
  const setMusicVolume = (val: number[]) => settings.setMusicVolume(val[0]);

  const gridSize = [settings.gridSize];
  const setGridSize = (val: number[]) => settings.setGridSize(val[0]);
  
  const digitSize = [settings.digitSize];
  const setDigitSize = (val: number[]) => settings.setDigitSize(val[0]);
  
  const noteSize = [settings.noteSize];
  const setNoteSize = (val: number[]) => settings.setNoteSize(val[0]);

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
              <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                {/* Sound Effects */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="game-sound" className={`text-sm ${theme.text.secondary} flex items-center gap-1.5`}>
                      {settings.soundEnabled ? (
                        <Volume2 className={`w-3.5 h-3.5 ${theme.accent}`} />
                      ) : (
                        <VolumeX className={`w-3.5 h-3.5 ${theme.text.muted}`} />
                      )}
                      Sound Effects
                    </Label>
                    <Switch
                      id="game-sound"
                      checked={settings.soundEnabled}
                      onCheckedChange={settings.setSoundEnabled}
                    />
                  </div>
                  {settings.soundEnabled && (
                    <div className="space-y-1 pl-5">
                      <div className={`flex justify-between text-xs ${theme.text.muted}`}>
                        <span>Volume</span>
                        <span>{soundVolume[0]}%</span>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="game-music" className={`text-sm ${theme.text.secondary} flex items-center gap-1.5`}>
                      {settings.musicEnabled ? (
                        <Music className={`w-3.5 h-3.5 ${theme.accent}`} />
                      ) : (
                        <VolumeX className={`w-3.5 h-3.5 ${theme.text.muted}`} />
                      )}
                      Music
                    </Label>
                    <Switch
                      id="game-music"
                      checked={settings.musicEnabled}
                      onCheckedChange={settings.setMusicEnabled}
                    />
                  </div>
                  {settings.musicEnabled && (
                    <div className="space-y-1 pl-5">
                      <div className={`flex justify-between text-xs ${theme.text.muted}`}>
                        <span>Volume</span>
                        <span>{musicVolume[0]}%</span>
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
                  <Label htmlFor="game-haptics" className={`text-sm ${theme.text.secondary} flex items-center gap-1.5`}>
                    <Vibrate className={`w-3.5 h-3.5 ${settings.hapticsEnabled ? theme.accent : theme.text.muted}`} />
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
              <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                {/* Hint Type */}
                <div className="space-y-2 pt-4">
                  <Label htmlFor="hint-mode" className={`${theme.text.secondary} text-sm`}>
                    Hint Type
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

                {/* Auto-advance */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-advance" className={`text-sm ${theme.text.secondary}`}>
                    Auto-advance
                  </Label>
                  <Switch
                    id="auto-advance"
                    checked={settings.autoAdvance}
                    onCheckedChange={settings.setAutoAdvance}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grid Sizing */}
          <div className={`${theme.card.background} ${theme.card.border} border rounded-xl backdrop-blur-xl overflow-hidden`}>
            <button
              onClick={() => setGridExpanded(!gridExpanded)}
              className={`w-full px-4 py-3 flex items-center justify-between ${theme.card.hover} transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Maximize2 className={`w-5 h-5 ${theme.accent}`} />
                <span className={theme.text.primary}>Grid Sizing</span>
              </div>
              {gridExpanded ? (
                <ChevronUp className={`w-5 h-5 ${theme.text.muted}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${theme.text.muted}`} />
              )}
            </button>

            {gridExpanded && (
              <div className="px-4 pb-4 border-t border-white/10">
                <div className="flex flex-col gap-4 pt-4">
                  {/* Sliders */}
                  <div className="space-y-3">
                    {/* Grid Size */}
                    <div>
                      <Label htmlFor="grid-size" className={`${theme.text.secondary} text-sm mb-1 block`}>
                        Grid Size
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          id="grid-size"
                          value={gridSize}
                          onValueChange={setGridSize}
                          min={85}
                          max={115}
                          step={15}
                          className="flex-1"
                        />
                        <span className={`text-sm ${theme.text.primary} w-8 text-right`}>
                          {gridSize[0] === 85 ? 'S' : gridSize[0] === 100 ? 'M' : 'L'}
                        </span>
                      </div>
                    </div>

                    {/* Input Number Size */}
                    <div>
                      <Label htmlFor="digit-size" className={`${theme.text.secondary} text-sm mb-1 block`}>
                        Digit Size
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          id="digit-size"
                          value={digitSize}
                          onValueChange={setDigitSize}
                          min={80}
                          max={120}
                          step={10}
                          className="flex-1"
                        />
                        <span className={`text-sm ${theme.text.primary} w-8 text-right`}>
                          {digitSize[0] === 80 ? 'XS' : digitSize[0] === 90 ? 'S' : digitSize[0] === 100 ? 'M' : digitSize[0] === 110 ? 'L' : 'XL'}
                        </span>
                      </div>
                    </div>

                    {/* Notes Size */}
                    <div>
                      <Label htmlFor="note-size" className={`${theme.text.secondary} text-sm mb-1 block`}>
                        Notes Size
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          id="note-size"
                          value={noteSize}
                          onValueChange={setNoteSize}
                          min={100}
                          max={300}
                          step={50}
                          className="flex-1"
                        />
                        <span className={`text-sm ${theme.text.primary} w-8 text-right`}>
                          {noteSize[0] === 100 ? 'XS' : noteSize[0] === 150 ? 'S' : noteSize[0] === 200 ? 'M' : noteSize[0] === 250 ? 'L' : 'XL'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <Label className={`${theme.text.secondary} text-sm mb-2 block`}>Preview</Label>
                    <div className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 backdrop-blur-xl`}>
                      <GridPreview 
                        gridScale={gridSize[0]} 
                        digitScale={digitSize[0]} 
                        noteScale={noteSize[0]} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}