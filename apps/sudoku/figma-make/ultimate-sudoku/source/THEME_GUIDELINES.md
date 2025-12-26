# Theme System Guidelines

## Overview

This game engine UI framework uses a comprehensive theme system that supports multiple visual themes while maintaining accessibility standards. **Every component must be theme-aware** to ensure consistency across all themes.

## Available Themes

- **Current**: Glassmorphism design with purple/pink gradients
- **Light**: Bright, clean theme with high contrast
- **Dark**: High contrast dark theme
- **Grayscale**: Monochromatic black/white/gray
- **Vibrant**: Colorful theme with saturated colors
- **Match Device**: Auto-switches based on system preference

## Using the Theme System

### 1. Import the Theme Hook

Every component that uses styling MUST import and use the theme hook:

```tsx
import { useTheme } from '../contexts/ThemeContext';

export function MyComponent() {
  const { theme } = useTheme();
  
  // Use theme properties in your JSX
  return <div className={theme.text.primary}>Hello</div>;
}
```

### 2. Available Theme Properties

The theme object provides the following properties:

#### Background
```tsx
theme.background // Main gradient background
```

#### Particles (Background Effects)
```tsx
theme.particles.primary   // First particle/glow color
theme.particles.secondary // Second particle/glow color
theme.particles.tertiary  // Third particle/glow color
```

#### Cards/Panels
```tsx
theme.card.background // Card background with backdrop blur
theme.card.border     // Card border color
theme.card.hover      // Card hover state background
```

#### Text
```tsx
theme.text.primary    // Primary text (highest contrast)
theme.text.secondary  // Secondary text (medium contrast)
theme.text.muted      // Muted text (lower contrast, for labels/hints)
```

#### Buttons
```tsx
// Primary buttons (main CTAs)
theme.button.primary.background
theme.button.primary.hover
theme.button.primary.text

// Secondary buttons (less emphasis)
theme.button.secondary.background
theme.button.secondary.hover
theme.button.secondary.text
```

#### Input Fields
```tsx
theme.input.background
theme.input.border
theme.input.text
theme.input.placeholder
```

#### Accent Colors
```tsx
theme.accent // Used for icons, highlights, special elements
```

## Component Development Checklist

When creating a NEW component or MODIFYING an existing one, ensure:

### ✅ Required Steps

1. **Import the theme hook**
   ```tsx
   import { useTheme } from '../contexts/ThemeContext';
   const { theme } = useTheme();
   ```

2. **Replace ALL hardcoded colors with theme properties**
   - ❌ BAD: `className="text-white bg-purple-500"`
   - ✅ GOOD: `className={theme.text.primary}`

3. **Use theme-aware backgrounds**
   - ❌ BAD: `className="bg-white/10 backdrop-blur-xl border border-white/20"`
   - ✅ GOOD: `className={`${theme.card.background} ${theme.card.border} border`}`

4. **Apply theme-aware text colors**
   - ❌ BAD: `className="text-white"`
   - ✅ GOOD: `className={theme.text.primary}`

5. **Use theme-aware buttons**
   - ❌ BAD: `className="bg-purple-500 hover:bg-purple-600 text-white"`
   - ✅ GOOD: `className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}`}`

6. **Test in ALL themes**
   - Load the app and navigate to Settings
   - Test your component in each of the 6 themes
   - Verify readability and proper contrast
   - Check hover states and interactions

## Common Patterns

### Pattern 1: Glass Card Container

```tsx
<div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
  <h2 className={theme.text.primary}>Card Title</h2>
  <p className={theme.text.secondary}>Card description</p>
</div>
```

### Pattern 2: Primary Action Button

```tsx
<Button
  className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}`}
>
  Primary Action
</Button>
```

### Pattern 3: Secondary/Ghost Button

```tsx
<Button
  className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border`}
>
  Secondary Action
</Button>
```

### Pattern 4: Input Field

```tsx
<Input
  className={`${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
  placeholder="Enter text..."
/>
```

### Pattern 5: Icon with Accent Color

```tsx
<Trophy className={`w-6 h-6 ${theme.accent}`} />
```

### Pattern 6: Hover State Card

```tsx
<div className={`${theme.card.background} ${theme.card.border} ${theme.card.hover} border transition-colors`}>
  Hoverable content
</div>
```

### Pattern 7: List Item with Mixed Text Hierarchy

```tsx
<div>
  <p className={theme.text.primary}>Main Label</p>
  <p className={`text-sm ${theme.text.secondary}`}>Subtitle</p>
  <p className={`text-xs ${theme.text.muted}`}>Helper text</p>
</div>
```

## Special Cases

### Hard-Coded Colors (When Allowed)

You may use hard-coded colors ONLY in these specific cases:

1. **Game-specific elements** (e.g., X and O in Tic-Tac-Toe)
   ```tsx
   <X className="text-purple-400" /> // Game piece color
   <Circle className="text-pink-400" /> // Game piece color
   ```

2. **Status indicators** that have universal meaning
   ```tsx
   <Badge className="bg-green-500">Victory</Badge>
   <Badge className="bg-red-500">Defeat</Badge>
   <Badge className="bg-yellow-500">Warning</Badge>
   ```

3. **Rank/trophy colors** with standard conventions
   ```tsx
   <Crown className="text-yellow-400" /> // 1st place gold
   <Medal className="text-gray-300" />   // 2nd place silver
   <Medal className="text-amber-600" />  // 3rd place bronze
   ```

### Complex Gradients

For special gradient backgrounds (like rank highlights):
```tsx
const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
  if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30';
  if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
  return `${theme.card.background} ${theme.card.border}`; // Fallback to theme
};
```

## Accessibility Requirements

All themes MUST meet WCAG AA standards:

- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text** (18pt+): 3:1 contrast ratio minimum
- **UI Components**: 3:1 contrast ratio minimum

### Testing Contrast

When adding new theme colors to `/contexts/ThemeContext.tsx`:

1. Use a contrast checker tool (e.g., WebAIM Contrast Checker)
2. Test primary text against card backgrounds
3. Test button text against button backgrounds
4. Ensure hover states maintain proper contrast

## Common Mistakes to Avoid

### ❌ DON'T: Mix hardcoded and theme colors
```tsx
// BAD - mixing theme and hardcoded colors
<div className={`bg-white/10 ${theme.text.primary}`}>
```

### ❌ DON'T: Forget backdrop blur on cards
```tsx
// BAD - missing backdrop-blur-xl
<div className={`${theme.card.background} ${theme.card.border}`}>
```

### ❌ DON'T: Use white/black directly for text
```tsx
// BAD
<p className="text-white">Text</p>

// GOOD
<p className={theme.text.primary}>Text</p>
```

### ❌ DON'T: Forget to add border when using border colors
```tsx
// BAD - border color without border
<div className={theme.card.border}>

// GOOD - includes 'border'
<div className={`${theme.card.border} border`}>
```

### ❌ DON'T: Hardcode purple/pink/blue theme colors
```tsx
// BAD - specific to current theme
<div className="bg-purple-500">

// GOOD - works with all themes
<div className={theme.button.primary.background}>
```

## Testing Your Component

### Manual Testing Process

1. **Start the application**
2. **Navigate to Settings** (gear icon from main menu)
3. **For each theme, verify:**
   - Current (Glassmorphism)
   - Light
   - Dark
   - Grayscale
   - Vibrant
   - Match Device (test both light and dark system preferences)

4. **In each theme, check:**
   - All text is readable (good contrast)
   - Backgrounds apply correctly
   - Borders are visible
   - Hover states work properly
   - Interactive elements are clearly distinguishable
   - No jarring color combinations
   - Icons/accents are appropriately colored

### Visual Checklist

For each theme, verify your component has:
- [ ] Readable heading text
- [ ] Readable body text
- [ ] Readable muted/helper text
- [ ] Proper card backgrounds with blur
- [ ] Visible borders
- [ ] Clear button states (normal, hover)
- [ ] Proper input field styling
- [ ] Appropriate icon colors
- [ ] Smooth hover transitions

## Code Review Checklist

Before submitting a PR or considering a component complete:

- [ ] Theme hook imported and used
- [ ] No hardcoded `text-white`, `text-black`, `bg-white`, `bg-slate-*`, `bg-purple-*` (except approved special cases)
- [ ] All backgrounds use theme properties
- [ ] All text uses theme text properties
- [ ] All buttons use theme button properties
- [ ] All inputs use theme input properties
- [ ] Tested visually in all 6 themes
- [ ] Contrast ratios meet WCAG AA standards
- [ ] Hover states are theme-aware
- [ ] No accessibility warnings in browser console

## Examples from Existing Components

### Example 1: MainMenu.tsx

```tsx
import { useTheme } from '../contexts/ThemeContext';

export function MainMenu() {
  const { theme } = useTheme();
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Logo with theme-aware card */}
      <div className={`p-8 rounded-3xl ${theme.card.background} ${theme.card.border} border shadow-2xl`}>
        <Play className={`w-16 h-16 ${theme.accent}`} />
      </div>
      
      {/* Title with theme-aware text */}
      <h1 className={`text-4xl ${theme.text.primary}`}>
        Game Engine
      </h1>
      
      {/* Primary button */}
      <Button
        className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}`}
      >
        Play Game
      </Button>
    </div>
  );
}
```

### Example 2: Settings.tsx

```tsx
import { useTheme } from '../contexts/ThemeContext';

export function Settings({ onBack }: SettingsProps) {
  const { theme, themeType, setThemeType } = useTheme();
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button with theme-aware hover */}
      <Button
        onClick={onBack}
        variant="ghost"
        className={`${theme.text.primary} ${theme.card.hover}`}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </Button>
      
      {/* Settings card */}
      <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`text-xl ${theme.text.primary} flex items-center`}>
          <Volume2 className={`w-6 h-6 mr-2 ${theme.accent}`} />
          Audio
        </h2>
        
        <Label className={theme.text.secondary}>
          Sound Effects
        </Label>
        
        <p className={`text-sm ${theme.text.muted}`}>
          Adjust volume levels
        </p>
      </div>
    </div>
  );
}
```

## Adding New Themes

If you need to add a new theme to the system:

1. **Open `/contexts/ThemeContext.tsx`**
2. **Add your theme to the `themes` object**
3. **Ensure ALL properties are defined**
4. **Test contrast ratios** using a contrast checker
5. **Update the theme selector** in Settings.tsx
6. **Test all existing components** with the new theme

### New Theme Template

```tsx
mytheme: {
  name: 'My Theme',
  background: 'bg-gradient-to-br from-[color1] via-[color2] to-[color3]',
  particles: {
    primary: 'bg-[color]/20',
    secondary: 'bg-[color]/20',
    tertiary: 'bg-[color]/20',
  },
  card: {
    background: 'bg-[color]/[opacity] backdrop-blur-xl',
    border: 'border-[color]/[opacity]',
    hover: 'hover:bg-[color]/[opacity]',
  },
  text: {
    primary: 'text-[color]',     // Must have 4.5:1 contrast with card.background
    secondary: 'text-[color]',   // Must have 4.5:1 contrast with card.background
    muted: 'text-[color]',       // Must have 4.5:1 contrast with card.background
  },
  button: {
    primary: {
      background: 'bg-[color] or bg-gradient-to-r from-[color] to-[color]',
      hover: 'hover:bg-[color] or hover:from-[color] hover:to-[color]',
      text: 'text-[color]',      // Must have 4.5:1 contrast with button background
    },
    secondary: {
      background: 'bg-[color]/[opacity]',
      hover: 'hover:bg-[color]/[opacity]',
      text: 'text-[color]',      // Must have 4.5:1 contrast with button background
    },
  },
  input: {
    background: 'bg-[color]/[opacity]',
    border: 'border-[color]/[opacity]',
    text: 'text-[color]',
    placeholder: 'placeholder:text-[color]/[opacity]',
  },
  accent: 'text-[color]',        // Used for icons, highlights
},
```

## Quick Reference

### Most Common Classes

```tsx
// Containers
${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl

// Text hierarchy
${theme.text.primary}    // Headings, important text
${theme.text.secondary}  // Body text, labels
${theme.text.muted}      // Helper text, timestamps

// Buttons
${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}
${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text}

// Icons
${theme.accent}

// Hover states
${theme.card.hover}

// Inputs
${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}
```

## Summary

**Golden Rules:**
1. ✅ Always import and use `useTheme()`
2. ✅ Always use theme properties instead of hardcoded colors
3. ✅ Always test in all 6 themes
4. ✅ Always ensure proper contrast ratios
5. ✅ Always include `backdrop-blur-xl` with card backgrounds
6. ✅ Always include `border` when using border colors

Following these guidelines ensures a consistent, accessible, and maintainable theme system across the entire application.
