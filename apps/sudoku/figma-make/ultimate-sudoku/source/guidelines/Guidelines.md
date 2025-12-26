# Game Engine UI Framework Guidelines

## Critical Rules - Theme System

### Every Component MUST Use Themes

**ALWAYS do this when creating or modifying components:**

```tsx
import { useTheme } from '../contexts/ThemeContext';

export function MyComponent() {
  const { theme } = useTheme();
  // Use theme properties for ALL styling
}
```

### Never Use Hardcoded Colors

❌ **NEVER do this:**
```tsx
className="text-white bg-purple-500 border-white/20"
```

✅ **ALWAYS do this:**
```tsx
className={`${theme.text.primary} ${theme.button.primary.background} ${theme.card.border} border`}
```

### Theme Properties Quick Reference

Use these properties instead of hardcoded colors:

- **Backgrounds**: `theme.card.background` (always include `backdrop-blur-xl`)
- **Borders**: `theme.card.border` (always include `border` class)
- **Text**: `theme.text.primary` | `theme.text.secondary` | `theme.text.muted`
- **Buttons**: `theme.button.primary.*` or `theme.button.secondary.*`
- **Inputs**: `theme.input.background` | `theme.input.border` | `theme.input.text`
- **Icons**: `theme.accent`
- **Hover**: `theme.card.hover` or `theme.button.*.hover`

### Exceptions (Only Cases Where Hardcoded Colors Are Allowed)

1. **Game-specific elements**: `<X className="text-purple-400" />`
2. **Universal status colors**: `<Badge className="bg-green-500">Victory</Badge>`
3. **Standard rank colors**: `<Crown className="text-yellow-400" />`

### Testing Requirement

Before considering ANY component complete:
- Test in Current theme
- Test in Light theme  
- Test in Dark theme
- Test in Grayscale theme
- Test in Vibrant theme
- Test in Match Device theme (both light and dark system preferences)

**A component that only works in one theme is broken.**

---

## General Guidelines

### Layout
- Use flexbox and grid for layouts by default
- Only use absolute positioning when necessary for overlays/modals
- Ensure responsive design for mobile (375px), tablet (768px), and desktop (1920px+)

### Code Organization
- Keep components small and focused
- Extract reusable logic into separate files
- Use the `/components` directory for all React components
- Use `/components/ui` for shadcn components only

### Component Structure
- Always use TypeScript with proper interface definitions
- Export components as named exports
- Include proper prop types

### Styling Rules
- **NEVER use font size, weight, or line-height Tailwind classes** unless explicitly requested
  - ❌ NO: `text-2xl`, `font-bold`, `leading-none`
  - ✅ YES: Use default typography from `styles/globals.css`
- Always use theme properties for colors (see Theme System above)
- Use consistent spacing (multiples of 4: p-4, p-6, p-8, etc.)
- Use consistent border radius (rounded-xl, rounded-2xl, rounded-3xl)

### Accessibility
- Maintain WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI components)
- Ensure keyboard navigation works
- Include proper ARIA labels where needed
- Test with screen readers when applicable

---

## Design System - Glassmorphism

### Core Aesthetic
- Semi-transparent backgrounds with backdrop blur
- Layered depth with shadows
- Smooth transitions (300ms is standard)
- Glowing particle effects in background

### Card Pattern (Most Common)
```tsx
<div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl backdrop-blur-xl`}>
  <h2 className={theme.text.primary}>Title</h2>
  <p className={theme.text.secondary}>Content</p>
</div>
```

### Button Patterns

**Primary Button (Main CTAs):**
```tsx
<Button className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300`}>
  Primary Action
</Button>
```

**Secondary Button (Supporting Actions):**
```tsx
<Button className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300`}>
  Secondary Action
</Button>
```

### Input Pattern
```tsx
<Input className={`${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`} />
```

---

## Component-Specific Rules

### Buttons
- Primary buttons for main actions (one per section)
- Secondary buttons for supporting actions
- Always include hover states with smooth transitions
- Icon buttons should be square with consistent padding

### Forms
- Labels should use `theme.text.secondary`
- Inputs must use all theme.input.* properties
- Helper text should use `theme.text.muted`
- Focus states should be visible

### Cards/Panels
- Always use glass effect: `backdrop-blur-xl` with `theme.card.background`
- Always include borders: `${theme.card.border} border`
- Use `theme.card.hover` for interactive cards
- Include `shadow-xl` for depth

### Icons
- Default size: w-6 h-6
- Use `theme.accent` for standard icons
- Maintain consistent sizing throughout app
- Icons should scale appropriately on mobile

### Lists
- Use dividers between items: `<div className={`border-t ${theme.card.border}`} />`
- Hoverable list items should use `theme.card.hover`
- Maintain consistent padding

---

## File Organization

### Component Files
- Main components: `/components/[ComponentName].tsx`
- UI primitives: `/components/ui/[component].tsx` (shadcn only)
- Templates: `/COMPONENT_TEMPLATE.tsx` (reference for new components)

### Context Files
- Theme context: `/contexts/ThemeContext.tsx`

### Documentation
- Theme system docs: `/THEME_*.md` files
- Main guidelines: `/guidelines/Guidelines.md` (this file)

---

## When Creating New Components

1. **Start with template**: Reference `/COMPONENT_TEMPLATE.tsx`
2. **Import theme**: Add `import { useTheme } from '../contexts/ThemeContext';`
3. **Use theme properties**: Never hardcode colors
4. **Test all themes**: Use Settings → Theme to test all 6 themes
5. **Check accessibility**: Verify contrast ratios in DevTools
6. **Test responsive**: Check mobile, tablet, desktop

---

## When Modifying Existing Components

1. **Check theme usage**: Ensure component already uses `useTheme`
2. **Maintain theme compatibility**: Don't introduce hardcoded colors
3. **Test across themes**: Verify changes work in all 6 themes
4. **Preserve structure**: Don't break existing layout unless necessary
5. **Update carefully**: Small, focused changes are better

---

## Quick Checks Before Completing Work

- [ ] Theme hook imported and used
- [ ] No hardcoded colors (except approved cases)
- [ ] Tested in all 6 themes
- [ ] Proper contrast ratios
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] Hover states work
- [ ] Keyboard navigation works

---

## Resources

For detailed information, see:
- **Quick reference while coding**: `/THEME_QUICK_REFERENCE.md`
- **Complete guidelines**: `/THEME_GUIDELINES.md`
- **Testing workflow**: `/THEME_TESTING_GUIDE.md`
- **Component template**: `/COMPONENT_TEMPLATE.tsx`
- **Code examples**: `/types/theme-usage-examples.ts`

---

## Remember

**Three Cardinal Rules:**
1. ✅ **ALWAYS use the theme system** - Import and use `useTheme()` in every component
2. ✅ **NEVER hardcode colors** - Use theme properties exclusively (except approved cases)
3. ✅ **TEST all themes** - A component isn't done until it works in all 6 themes

**These are non-negotiable.**
