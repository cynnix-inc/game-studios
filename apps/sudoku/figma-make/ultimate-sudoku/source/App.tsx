import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { AuthModal } from './components/AuthModal';
import { GameScreen } from './components/GameScreen';
import { DailyChallenges } from './components/DailyChallenges';
import { DifficultySelect } from './components/DifficultySelect';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

type Screen = 'menu' | 'settings' | 'stats' | 'leaderboard' | 'profile' | 'game' | 'dailyChallenges' | 'difficulty';

function AppContent() {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');

  const handleAuth = (platform: string, name: string) => {
    setIsAuthenticated(true);
    setUsername(name);
    setShowAuth(false);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUsername('');
    setCurrentScreen('menu');
  };

  const handleNavigate = (screen: Screen) => {
    if (screen === 'game') {
      setCurrentScreen('difficulty');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleSelectDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
    setSelectedDifficulty(difficulty);
    setCurrentScreen('game');
  };

  return (
    <div className={`min-h-screen w-full ${theme.background} overflow-hidden`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${theme.particles.primary} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${theme.particles.secondary} rounded-full blur-3xl animate-pulse delay-1000`} />
        <div className={`absolute top-3/4 left-3/4 w-96 h-96 ${theme.particles.tertiary} rounded-full blur-3xl animate-pulse delay-2000`} />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {currentScreen === 'menu' && (
          <MainMenu
            onNavigate={handleNavigate}
            onShowAuth={() => setShowAuth(true)}
            isAuthenticated={isAuthenticated}
            username={username}
          />
        )}
        {currentScreen === 'difficulty' && (
          <DifficultySelect
            onBack={() => setCurrentScreen('menu')}
            onSelectDifficulty={handleSelectDifficulty}
          />
        )}
        {currentScreen === 'game' && (
          <GameScreen 
            onExit={() => setCurrentScreen('menu')} 
            username={username} 
            difficulty={selectedDifficulty}
          />
        )}
        {currentScreen === 'settings' && (
          <Settings onBack={() => setCurrentScreen('menu')} />
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
            onSignOut={handleSignOut}
          />
        )}
        {currentScreen === 'dailyChallenges' && (
          <DailyChallenges
            onBack={() => setCurrentScreen('menu')}
            username={username}
          />
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}