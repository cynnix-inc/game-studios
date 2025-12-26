/**
 * Theme Usage Examples
 * 
 * This file contains TypeScript examples and patterns for using the theme system.
 * Import and reference these examples when building components.
 */

import { Theme } from '../contexts/ThemeContext';

/**
 * Example: Basic component with theme
 */
export const BasicComponentExample = `
import { useTheme } from '../contexts/ThemeContext';

export function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <div className={\`\${theme.card.background} \${theme.card.border} border p-6\`}>
      <h1 className={theme.text.primary}>Title</h1>
    </div>
  );
}
`;

/**
 * Example: Component with theme type
 */
export const TypedComponentExample = `
import { useTheme } from '../contexts/ThemeContext';
import type { Theme } from '../contexts/ThemeContext';

export function MyComponent() {
  const { theme }: { theme: Theme } = useTheme();
  
  return <div className={theme.text.primary}>Content</div>;
}
`;

/**
 * Example: Conditional styling with theme
 */
export const ConditionalStylingExample = `
import { useTheme } from '../contexts/ThemeContext';

export function MyComponent({ isActive }: { isActive: boolean }) {
  const { theme } = useTheme();
  
  const getStyles = () => {
    if (isActive) {
      return \`\${theme.button.primary.background} \${theme.button.primary.text}\`;
    }
    return \`\${theme.button.secondary.background} \${theme.button.secondary.text}\`;
  };
  
  return <button className={getStyles()}>Button</button>;
}
`;

/**
 * Example: Custom component with theme props
 */
export const CustomComponentExample = `
import { useTheme } from '../contexts/ThemeContext';

interface CardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  variant?: 'default' | 'hoverable';
}

export function Card({ title, description, children, variant = 'default' }: CardProps) {
  const { theme } = useTheme();
  
  const hoverClass = variant === 'hoverable' ? theme.card.hover : '';
  
  return (
    <div className={\`\${theme.card.background} \${theme.card.border} \${hoverClass} border rounded-2xl p-6 transition-colors\`}>
      <h2 className={theme.text.primary}>{title}</h2>
      <p className={\`mt-2 \${theme.text.secondary}\`}>{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
`;

/**
 * Example: Dynamic list with theme
 */
export const DynamicListExample = `
import { useTheme } from '../contexts/ThemeContext';

interface Item {
  id: number;
  title: string;
  description: string;
}

export function ItemList({ items }: { items: Item[] }) {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={\`\${theme.card.background} \${theme.card.border} \${theme.card.hover} border rounded-xl p-4 transition-colors cursor-pointer\`}
        >
          <p className={theme.text.primary}>{item.title}</p>
          <p className={\`text-sm \${theme.text.muted}\`}>{item.description}</p>
        </div>
      ))}
    </div>
  );
}
`;

/**
 * Example: Form with theme
 */
export const FormExample = `
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

export function ThemedForm() {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  
  return (
    <form className="space-y-4">
      <div>
        <label className={\`block mb-2 \${theme.text.secondary}\`}>
          Username
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={\`w-full px-4 py-2 rounded-xl \${theme.input.background} \${theme.input.border} \${theme.input.text} \${theme.input.placeholder} border\`}
          placeholder="Enter username"
        />
      </div>
      
      <button
        type="submit"
        className={\`w-full py-3 rounded-xl \${theme.button.primary.background} \${theme.button.primary.hover} \${theme.button.primary.text} transition-all\`}
      >
        Submit
      </button>
    </form>
  );
}
`;

/**
 * Example: Modal with theme
 */
export const ModalExample = `
import { useTheme } from '../contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ThemedModal({ isOpen, onClose, title, children }: ModalProps) {
  const { theme } = useTheme();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={\`w-full max-w-md \${theme.card.background} \${theme.card.border} border rounded-3xl shadow-2xl overflow-hidden\`}>
        <div className={\`p-6 border-b \${theme.card.border}\`}>
          <h2 className={\`text-2xl \${theme.text.primary}\`}>{title}</h2>
          <button
            onClick={onClose}
            className={\`absolute top-6 right-6 \${theme.text.muted} hover:\${theme.text.primary}\`}
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
`;

/**
 * Example: Navigation with theme
 */
export const NavigationExample = `
import { useTheme } from '../contexts/ThemeContext';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export function ThemedNav({ items }: { items: NavItem[] }) {
  const { theme } = useTheme();
  
  return (
    <nav className={\`\${theme.card.background} \${theme.card.border} border rounded-2xl p-2\`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={item.onClick}
            className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl \${theme.card.hover} \${theme.text.primary} transition-colors\`}
          >
            <Icon className={\`w-5 h-5 \${theme.accent}\`} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
`;

/**
 * Example: Stats card with theme
 */
export const StatsCardExample = `
import { useTheme } from '../contexts/ThemeContext';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  const { theme } = useTheme();
  
  return (
    <div className={\`\${theme.card.background} \${theme.card.border} border rounded-xl p-6 shadow-xl\`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={\`w-8 h-8 \${theme.accent}\`} />
        {trend && (
          <span className={\`text-sm \${trend === 'up' ? 'text-green-500' : 'text-red-500'}\`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className={\`text-3xl \${theme.text.primary} mb-1\`}>{value}</p>
      <p className={\`text-sm \${theme.text.muted}\`}>{label}</p>
    </div>
  );
}
`;

/**
 * Example: Using themeType for theme-specific logic
 */
export const ThemeTypeExample = `
import { useTheme } from '../contexts/ThemeContext';

export function MyComponent() {
  const { theme, themeType } = useTheme();
  
  // Different behavior based on theme type
  const getParticleAnimation = () => {
    if (themeType === 'vibrant') {
      return 'animate-bounce';
    } else if (themeType === 'grayscale') {
      return 'animate-pulse';
    }
    return 'animate-pulse';
  };
  
  return (
    <div className={getParticleAnimation()}>
      <p className={theme.text.primary}>Content</p>
    </div>
  );
}
`;

/**
 * Example: Switching themes programmatically
 */
export const ThemeSwitcherExample = `
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeType } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, themeType, setThemeType } = useTheme();
  
  const themes: { value: ThemeType; label: string }[] = [
    { value: 'current', label: 'Current' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'vibrant', label: 'Vibrant' },
    { value: 'device', label: 'Match Device' },
  ];
  
  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setThemeType(t.value)}
          className={\`px-4 py-2 rounded-lg \${
            themeType === t.value
              ? \`\${theme.button.primary.background} \${theme.button.primary.text}\`
              : \`\${theme.button.secondary.background} \${theme.button.secondary.text}\`
          } transition-all\`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
`;

/**
 * Helper: Common className patterns
 */
export const CommonPatterns = {
  // Card containers
  card: (theme: Theme) => 
    `${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`,
  
  cardHoverable: (theme: Theme) =>
    `${theme.card.background} ${theme.card.border} ${theme.card.hover} border rounded-2xl p-6 transition-colors cursor-pointer shadow-xl`,
  
  // Buttons
  primaryButton: (theme: Theme) =>
    `${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} px-6 py-3 rounded-xl transition-all`,
  
  secondaryButton: (theme: Theme) =>
    `${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border px-6 py-3 rounded-xl transition-all`,
  
  // Text
  heading: (theme: Theme) =>
    `text-2xl ${theme.text.primary}`,
  
  body: (theme: Theme) =>
    theme.text.secondary,
  
  muted: (theme: Theme) =>
    `text-sm ${theme.text.muted}`,
  
  // Inputs
  input: (theme: Theme) =>
    `${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder} border rounded-xl px-4 py-2`,
  
  // Icons
  icon: (theme: Theme) =>
    `w-6 h-6 ${theme.accent}`,
  
  iconSmall: (theme: Theme) =>
    `w-4 h-4 ${theme.accent}`,
  
  iconLarge: (theme: Theme) =>
    `w-8 h-8 ${theme.accent}`,
};

/**
 * Usage of CommonPatterns helper:
 * 
 * import { CommonPatterns } from '../types/theme-usage-examples';
 * import { useTheme } from '../contexts/ThemeContext';
 * 
 * export function MyComponent() {
 *   const { theme } = useTheme();
 *   
 *   return (
 *     <div className={CommonPatterns.card(theme)}>
 *       <h1 className={CommonPatterns.heading(theme)}>Title</h1>
 *       <button className={CommonPatterns.primaryButton(theme)}>Click</button>
 *     </div>
 *   );
 * }
 */
