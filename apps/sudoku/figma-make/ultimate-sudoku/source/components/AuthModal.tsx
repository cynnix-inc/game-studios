import { useState } from 'react';
import { X, Apple, Chrome } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTheme } from '../contexts/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (platform: string, username: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  if (!isOpen) return null;

  const handlePlatformAuth = (platform: string) => {
    // Mock authentication
    const mockUsername = platform === 'apple' ? 'AppleUser' : 'GoogleUser';
    onAuth(platform, mockUsername);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onAuth('email', username);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md ${theme.card.background} ${theme.card.border} border rounded-3xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`relative p-6 border-b ${theme.card.border}`}>
          <h2 className={`text-2xl text-center ${theme.text.primary}`}>
            Welcome
          </h2>
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 ${theme.text.muted} hover:${theme.text.primary} transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${theme.card.border}`}>
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-4 transition-colors ${
              activeTab === 'signin'
                ? `${theme.card.background} ${theme.text.primary}`
                : `${theme.text.muted} hover:${theme.text.primary}`
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-4 transition-colors ${
              activeTab === 'signup'
                ? `${theme.card.background} ${theme.text.primary}`
                : `${theme.text.muted} hover:${theme.text.primary}`
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Platform Auth */}
          <div className="space-y-3">
            <Button
              onClick={() => handlePlatformAuth('apple')}
              className={`w-full h-12 ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300`}
            >
              <Apple className="w-5 h-5 mr-2" />
              Continue with Apple
            </Button>
            <Button
              onClick={() => handlePlatformAuth('google')}
              className={`w-full h-12 ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl ${theme.card.border} border ${theme.button.secondary.text} transition-all duration-300`}
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme.card.border}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${theme.card.background} ${theme.text.muted}`}>Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className={theme.text.secondary}>
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={theme.text.secondary}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className={`${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
              />
            </div>
            <Button
              type="submit"
              className={`w-full h-12 ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300`}
            >
              {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}