import { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  // Grid sizing
  gridSize: number;
  setGridSize: (size: number) => void;
  digitSize: number;
  setDigitSize: (size: number) => void;
  noteSize: number;
  setNoteSize: (size: number) => void;
  
  // Gameplay
  autoCandidates: boolean;
  setAutoCandidates: (value: boolean) => void;
  autoAdvance: boolean;
  setAutoAdvance: (value: boolean) => void;
  hintMode: string;
  setHintMode: (mode: string) => void;
  zenMode: boolean;
  setZenMode: (value: boolean) => void;
  livesLimit: number;
  setLivesLimit: (limit: number) => void;
  
  // Audio
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  
  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Grid sizing
  const [gridSize, setGridSizeState] = useState(100);
  const [digitSize, setDigitSizeState] = useState(100);
  const [noteSize, setNoteSizeState] = useState(250);
  
  // Gameplay
  const [autoCandidates, setAutoCandidates] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [hintMode, setHintMode] = useState('direct');
  const [zenMode, setZenMode] = useState(false);
  const [livesLimit, setLivesLimit] = useState(3);
  
  // Audio
  const [soundVolume, setSoundVolume] = useState(75);
  const [musicVolume, setMusicVolume] = useState(50);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  
  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Wrapper setters to handle array values from Sliders
  const setGridSize = (size: number | number[]) => {
    setGridSizeState(Array.isArray(size) ? size[0] : size);
  };
  
  const setDigitSize = (size: number | number[]) => {
    setDigitSizeState(Array.isArray(size) ? size[0] : size);
  };
  
  const setNoteSize = (size: number | number[]) => {
    setNoteSizeState(Array.isArray(size) ? size[0] : size);
  };

  return (
    <SettingsContext.Provider
      value={{
        gridSize,
        setGridSize,
        digitSize,
        setDigitSize,
        noteSize,
        setNoteSize,
        autoCandidates,
        setAutoCandidates,
        autoAdvance,
        setAutoAdvance,
        hintMode,
        setHintMode,
        zenMode,
        setZenMode,
        livesLimit,
        setLivesLimit,
        soundVolume,
        setSoundVolume,
        musicVolume,
        setMusicVolume,
        soundEnabled,
        setSoundEnabled,
        musicEnabled,
        setMusicEnabled,
        hapticsEnabled,
        setHapticsEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
