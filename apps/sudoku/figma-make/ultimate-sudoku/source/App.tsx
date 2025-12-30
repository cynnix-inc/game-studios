import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { DailyChallenges } from './components/DailyChallenges';
import { VariantSelect } from './components/VariantSelect';
import { GameSetup } from './components/GameSetup';
import { AuthModal } from './components/AuthModal';
import { DeveloperMenu } from './components/DeveloperMenu';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import type { Difficulty } from './types/difficulty';
import type { Variant } from './types/variant';

type Screen = 'menu' | 'settings' | 'stats' | 'leaderboard' | 'profile' | 'game' | 'dailyChallenges' | 'variantSelect' | 'gameSetup';

function AppContent() {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('skilled');
  const [selectedVariant, setSelectedVariant] = useState<Variant>('classic');
  const [selectedSubVariant, setSelectedSubVariant] = useState<string | undefined>(undefined);
  const [selectedMode, setSelectedMode] = useState<'classic' | 'zen'>('classic');
  const [gameType, setGameType] = useState<'classic' | 'daily'>('classic');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);

  // Keyboard shortcut for developer menu: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevMenu(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAuth = (platform: string, user: string) => {
    setIsAuthenticated(true);
    setUsername(user);
    setShowAuthDialog(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setCurrentScreen('menu');
  };

  const handleNavigate = (screen: Screen, options?: { difficulty?: Difficulty; gameType?: 'classic' | 'daily' }) => {
    if (screen === 'game' && options) {
      // Direct navigation to game with difficulty specified
      setSelectedDifficulty(options.difficulty || 'skilled');
      setGameType(options.gameType || 'classic');
      setCurrentScreen('game');
    } else if (screen === 'variantSelect') {
      // Navigate to variant selection
      setCurrentScreen('variantSelect');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleSelectVariant = (variant: Variant) => {
    setSelectedVariant(variant);
    setCurrentScreen('gameSetup');
  };

  const handleStartGame = (config: {
    variant: Variant;
    subVariant?: string;
    mode: 'classic' | 'zen';
    difficulty: Difficulty;
  }) => {
    setSelectedVariant(config.variant);
    setSelectedSubVariant(config.subVariant);
    setSelectedMode(config.mode);
    setSelectedDifficulty(config.difficulty);
    setGameType('classic');
    setCurrentScreen('game');
  };

  return (
    <div className={`min-h-screen w-full ${theme.background} overflow-hidden relative`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${theme.particles.primary} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 ${theme.particles.secondary} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 right-1/3 w-64 h-64 ${theme.particles.tertiary} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {currentScreen === 'menu' && (
          <MainMenu
            onNavigate={handleNavigate}
            onShowAuth={() => setShowAuthDialog(true)}
            isAuthenticated={isAuthenticated}
            username={username}
          />
        )}
        {currentScreen === 'variantSelect' && (
          <VariantSelect
            onBack={() => setCurrentScreen('menu')}
            onSelectVariant={handleSelectVariant}
          />
        )}
        {currentScreen === 'gameSetup' && (
          <GameSetup
            onBack={() => setCurrentScreen('variantSelect')}
            onStartGame={handleStartGame}
            selectedVariant={selectedVariant}
          />
        )}
        {currentScreen === 'game' && (
          <GameScreen 
            onExit={() => setCurrentScreen('menu')} 
            username={username} 
            difficulty={selectedDifficulty}
            gameType={gameType}
            onNavigateToSetup={() => setCurrentScreen('variantSelect')}
            onNavigateToDailyChallenges={() => setCurrentScreen('dailyChallenges')}
          />
        )}
        {currentScreen === 'settings' && (
          <Settings onBack={() => setCurrentScreen('menu')} onNavigate={handleNavigate} />
        )}
        {currentScreen === 'stats' && (
          <Stats onBack={() => setCurrentScreen('menu')} username={username} />
        )}
        {currentScreen === 'leaderboard' && (
          <Leaderboard onBack={() => setCurrentScreen('menu')} />
        )}
        {currentScreen === 'profile' && (
          <Profile
            onBack={() => setCurrentScreen('menu')}
            username={username}
            onSignOut={handleLogout}
          />
        )}
        {currentScreen === 'dailyChallenges' && (
          <DailyChallenges
            onBack={() => setCurrentScreen('menu')}
            username={username}
          />
        )}
        {currentScreen === 'developerMenu' && (
          <DeveloperMenu
            onBack={() => setCurrentScreen('menu')}
          />
        )}
      </div>

      {/* Auth Dialog */}
      {showAuthDialog && (
        <AuthModal
          isOpen={showAuthDialog}
          onAuth={handleAuth}
          onClose={() => setShowAuthDialog(false)}
        />
      )}

      {/* Developer Menu - Floating overlay */}
      {showDevMenu && (
        <DeveloperMenu onClose={() => setShowDevMenu(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;