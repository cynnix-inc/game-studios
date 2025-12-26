import { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTheme } from '../contexts/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (platform: string, username: string) => void;
}

// Apple Logo Component (Official Apple logo)
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// Google "G" Logo Component (Official 4-color logo)
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handlePlatformAuth = async (platform: string) => {
    setIsLoading(true);
    setError('');
    
    // Simulate OAuth redirect delay
    setTimeout(() => {
      const mockUsername = platform === 'apple' ? 'AppleUser' : 'GoogleUser';
      onAuth(platform, mockUsername);
      setIsLoading(false);
    }, 1000);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate sending magic link
    setTimeout(() => {
      setMagicLinkSent(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Magic link sent success view
  if (magicLinkSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className={`w-full max-w-md ${theme.card.background} ${theme.card.border} border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl`}>
          <div className="p-8 text-center space-y-6">
            <div className={`w-16 h-16 mx-auto rounded-full ${theme.button.primary.background} flex items-center justify-center`}>
              <Mail className={`w-8 h-8 ${theme.button.primary.text}`} />
            </div>
            <div className="space-y-2">
              <h2 className={theme.text.primary}>Check your email</h2>
              <p className={theme.text.secondary}>
                We've sent a magic link to <span className={theme.text.primary}>{email}</span>
              </p>
              <p className={`text-sm ${theme.text.muted}`}>
                Click the link in the email to sign in instantly.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className={`w-full h-12 ${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300`}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md ${theme.card.background} ${theme.card.border} border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl`}>
        {/* Header */}
        <div className="relative px-6 py-6">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`absolute top-6 right-6 ${theme.text.muted} ${theme.card.hover} transition-colors disabled:opacity-50 rounded-full p-1 -m-1`}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center space-y-2">
            <h2 className={theme.text.primary}>
              Welcome to Ultimate Sudoku
            </h2>
            <p className={theme.text.secondary}>
              Save progress • Track stats • Compete globally
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg bg-red-500/10 border border-red-500/20 ${theme.text.primary} text-sm`}>
              {error}
            </div>
          )}

          {/* Social Auth */}
          <div className="space-y-3">
            {/* Apple Sign In - Outline Style (Compliant) */}
            <Button
              onClick={() => handlePlatformAuth('apple')}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-black border-2 border-black shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-black" />
              ) : (
                <AppleLogo className="w-5 h-5 mr-2" />
              )}
              Sign in with Apple
            </Button>
            
            {/* Google Sign In - Standard Light Style */}
            <Button
              onClick={() => handlePlatformAuth('google')}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-700" />
              ) : (
                <GoogleLogo className="w-5 h-5 mr-2" />
              )}
              Sign in with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme.card.border}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${theme.card.background} ${theme.text.muted}`}>or use email</span>
            </div>
          </div>

          {/* Email Section - Grouped */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className={theme.text.secondary}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleMagicLink(e);
                  }
                }}
                disabled={isLoading}
                autoFocus
                className={`h-12 ${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
              />
            </div>

            {/* Magic Link Button */}
            <Button
              onClick={handleMagicLink}
              disabled={isLoading}
              className={`w-full h-12 ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Send Magic Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className={`text-center text-xs ${theme.text.muted}`}>
            By signing in, you agree to our{' '}
            <button className={`${theme.text.secondary} ${theme.card.hover} transition-colors underline decoration-dotted`}>
              Terms
            </button>
            {' & '}
            <button className={`${theme.text.secondary} ${theme.card.hover} transition-colors underline decoration-dotted`}>
              Privacy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}