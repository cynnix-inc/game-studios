# Theme System Checklist ✅

**Print this or keep it visible while developing**

---

## Before You Start

- [ ] Read `/THEME_QUICK_REFERENCE.md` (5 minutes)
- [ ] Have `/THEME_QUICK_REFERENCE.md` open in another tab
- [ ] Understand which component you're building

---

## While Coding

### Required Import
- [ ] Added `import { useTheme } from '../contexts/ThemeContext';`
- [ ] Added `const { theme } = useTheme();` in component

### Backgrounds
- [ ] Card backgrounds use `${theme.card.background}`
- [ ] Include `backdrop-blur-xl` with card backgrounds
- [ ] No hardcoded `bg-white`, `bg-slate-*`, `bg-purple-*`

### Borders
- [ ] All borders use `${theme.card.border}`
- [ ] Include `border` class when using border colors
- [ ] Borders are consistent thickness

### Text
- [ ] Headings use `${theme.text.primary}`
- [ ] Body text uses `${theme.text.secondary}`
- [ ] Helper/muted text uses `${theme.text.muted}`
- [ ] No hardcoded `text-white` or `text-black`

### Buttons
- [ ] Primary CTAs use `${theme.button.primary.background}` `${theme.button.primary.hover}` `${theme.button.primary.text}`
- [ ] Secondary buttons use `${theme.button.secondary.background}` `${theme.button.secondary.hover}` `${theme.button.secondary.text}`
- [ ] All buttons have hover states

### Inputs
- [ ] Use `${theme.input.background}`
- [ ] Use `${theme.input.border}`
- [ ] Use `${theme.input.text}`
- [ ] Use `${theme.input.placeholder}`

### Icons
- [ ] Icons use `${theme.accent}` (unless special case)
- [ ] Icon sizes are consistent
- [ ] Icons are visible in all themes

### Hover States
- [ ] Interactive cards use `${theme.card.hover}`
- [ ] Buttons use theme hover classes
- [ ] Transitions are smooth (300ms typical)
- [ ] Hover states tested in all themes

---

## Before Committing

### Code Quality
- [ ] No hardcoded colors (except approved: game pieces, status indicators, ranks)
- [ ] No `text-white`, `text-black`, `bg-white`, `bg-purple-*`, etc.
- [ ] All classes use theme properties
- [ ] Code is clean and readable

### Testing - Theme Switching
Open app → Settings → Theme selector

#### Current Theme
- [ ] Component displays correctly
- [ ] Text is readable
- [ ] Backgrounds have blur effect
- [ ] Borders are visible
- [ ] Hover states work
- [ ] No visual bugs

#### Light Theme  
- [ ] Component displays correctly
- [ ] Text is DARK and readable
- [ ] Backgrounds are bright
- [ ] Borders are visible (dark)
- [ ] Hover states work
- [ ] Good contrast maintained

#### Dark Theme
- [ ] Component displays correctly
- [ ] Text is BRIGHT and readable
- [ ] Backgrounds are very dark
- [ ] Borders are visible (light)
- [ ] Hover states work
- [ ] High contrast maintained

#### Grayscale Theme
- [ ] Component displays correctly
- [ ] Text is readable
- [ ] Visual hierarchy clear WITHOUT color
- [ ] Interactive elements obvious
- [ ] Hover states work
- [ ] No information lost due to lack of color

#### Vibrant Theme
- [ ] Component displays correctly
- [ ] Text readable on bright backgrounds
- [ ] Not visually overwhelming
- [ ] Proper contrast maintained
- [ ] Hover states work
- [ ] Complements (not fights) theme colors

#### Match Device Theme
- [ ] Works with dark system preference
- [ ] Works with light system preference
- [ ] Transitions smoothly
- [ ] No flickering or layout shifts

### Accessibility
- [ ] Primary text has 4.5:1 contrast ratio (use DevTools)
- [ ] Secondary text has 4.5:1 contrast ratio
- [ ] Button text has 4.5:1 contrast ratio
- [ ] Interactive elements have 3:1 contrast ratio
- [ ] Focus states are visible
- [ ] Keyboard navigation works

### Responsive Testing
- [ ] Desktop (1920x1080) - test all themes
- [ ] Tablet (768x1024) - test all themes
- [ ] Mobile (375x667) - test all themes

### Documentation
- [ ] Component has clear props interface
- [ ] Any theme-specific behavior is documented
- [ ] Special cases are commented

---

## Pre-PR Checklist

- [ ] All 6 themes tested ✅
- [ ] All 3 screen sizes tested ✅
- [ ] No console errors ✅
- [ ] No accessibility warnings ✅
- [ ] Code follows theme guidelines ✅
- [ ] Component uses theme properties ✅
- [ ] Testing checklist completed ✅

---

## Quick Reference

### Glass Card
```tsx
<div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl backdrop-blur-xl`}>
```

### Primary Button
```tsx
<button className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}`}>
```

### Text Hierarchy
```tsx
<h1 className={theme.text.primary}>Main</h1>
<p className={theme.text.secondary}>Body</p>
<span className={`text-sm ${theme.text.muted}`}>Helper</span>
```

---

## Common Mistakes

### ❌ Don't Do This
```tsx
className="text-white bg-purple-500"
className="bg-white/10 border-white/20"
className="hover:bg-white/20"
```

### ✅ Do This
```tsx
className={theme.text.primary}
className={`${theme.card.background} ${theme.card.border} border`}
className={theme.card.hover}
```

---

## When Stuck

1. Check `/THEME_QUICK_REFERENCE.md`
2. Look at existing component (MainMenu.tsx, Settings.tsx)
3. Copy from `/COMPONENT_TEMPLATE.tsx`
4. Search `/types/theme-usage-examples.ts`
5. Read relevant section in `/THEME_GUIDELINES.md`

---

## Approved Hardcoded Colors

Only these cases can use hardcoded colors:

✅ Game pieces: `<X className="text-purple-400" />`  
✅ Status colors: `<Badge className="bg-green-500">Victory</Badge>`  
✅ Rank colors: `<Crown className="text-yellow-400" />`

Everything else MUST use theme properties.

---

## Final Check

Before you say "I'm done":

1. **Visual Test**: Does it look good in all 6 themes?
2. **Contrast Test**: Can you read all text in all themes?
3. **Interaction Test**: Do hover/focus states work in all themes?
4. **Code Test**: No hardcoded colors (except approved)?
5. **Accessibility Test**: 4.5:1 contrast ratio verified?
6. **Responsive Test**: Works on mobile, tablet, desktop?

If all YES → You're done! 🎉  
If any NO → Keep working 💪

---

**Remember:** A component isn't complete until it works perfectly in all 6 themes.

**Questions?** See `/THEME_SYSTEM_README.md`

---

## Print Version

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THEME SYSTEM QUICK CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Import useTheme
□ Use theme properties (no hardcoded colors)
□ Test Current theme
□ Test Light theme
□ Test Dark theme
□ Test Grayscale theme
□ Test Vibrant theme
□ Test Match Device theme
□ Verify contrast ratios
□ Test hover states
□ Test responsive (mobile/tablet/desktop)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
