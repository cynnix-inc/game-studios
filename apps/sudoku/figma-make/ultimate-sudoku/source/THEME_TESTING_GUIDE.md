# Theme Testing Guide

## Why Test All Themes?

Each theme has different:
- Background colors
- Text colors
- Contrast ratios
- Visual effects

A component that looks perfect in the Current theme might have readability issues in Light or Grayscale themes. **Always test all 6 themes.**

---

## Quick Testing Workflow

### 1. Launch the App
```bash
npm run dev
# or your start command
```

### 2. Navigate to Settings
1. From the main menu, click the **Settings icon** (gear icon at bottom)
2. Scroll to the **Display & Language** section
3. Find the **Theme** dropdown

### 3. Test Each Theme

**Test in this order for best coverage:**

#### ✅ Current (Glassmorphism)
- Default theme with purple/pink gradients
- Test that your component maintains the glassmorphic aesthetic
- Check backdrop blur effects
- Verify particle/glow effects don't interfere

#### ✅ Light
- **Most important for contrast testing**
- Check all text is readable (should be dark on light backgrounds)
- Verify borders are visible
- Ensure buttons have sufficient contrast
- Check input fields are clearly defined

#### ✅ Dark
- High contrast dark theme
- Check all text is bright enough
- Verify backgrounds are dark enough
- Ensure elements are distinguishable

#### ✅ Grayscale
- **Best for testing visual hierarchy**
- Removes all color - relies on contrast only
- Check that information hierarchy is still clear
- Verify interactive elements are distinguishable without color

#### ✅ Vibrant
- Bright, saturated theme
- Check text remains readable on colorful backgrounds
- Verify elements don't become overwhelming
- Ensure sufficient contrast with vibrant backgrounds

#### ✅ Match Device
- Switches based on system theme preference
- Test **both** by changing your OS theme:
  - **Dark system theme** → Should use Dark theme colors
  - **Light system theme** → Should use Light theme colors

---

## What to Check in Each Theme

### Visual Checklist

For **each theme**, verify:

#### Text Readability
- [ ] Headings are clearly readable
- [ ] Body text is easy to read
- [ ] Muted/helper text is still legible (not too faded)
- [ ] Text on buttons is readable
- [ ] Placeholder text in inputs is visible

#### Backgrounds & Borders
- [ ] Card backgrounds have proper blur effect
- [ ] Borders are visible and defined
- [ ] Borders don't overpower the design
- [ ] Background gradients don't interfere with content

#### Interactive Elements
- [ ] Buttons are clearly identifiable
- [ ] Hover states are visible and smooth
- [ ] Active/focused states are clear
- [ ] Links are distinguishable
- [ ] Input fields have clear boundaries

#### Visual Hierarchy
- [ ] Primary content stands out
- [ ] Secondary content is clearly subordinate
- [ ] Muted content is appropriately subtle
- [ ] Icons/accents draw appropriate attention

#### Spacing & Layout
- [ ] Padding and margins are consistent
- [ ] Content doesn't feel cramped
- [ ] White space (or dark space) is appropriate
- [ ] Elements don't overlap

---

## Common Issues by Theme

### Light Theme Issues

**Problem**: Text becomes invisible
- **Cause**: Using light text colors meant for dark backgrounds
- **Fix**: Use `theme.text.primary` instead of hardcoded colors

**Problem**: Borders disappear
- **Cause**: Border colors too light
- **Fix**: The theme provides darker borders for light theme

**Problem**: Buttons look washed out
- **Cause**: Not enough contrast
- **Fix**: Use theme button styles which auto-adjust

### Dark Theme Issues

**Problem**: Text is hard to read
- **Cause**: Not enough contrast with dark background
- **Fix**: Dark theme provides bright text colors - use `theme.text.primary`

**Problem**: Elements blend together
- **Cause**: Everything is too dark
- **Fix**: Use theme borders and proper card backgrounds

### Grayscale Theme Issues

**Problem**: Can't tell elements apart
- **Cause**: Relying on color for differentiation
- **Fix**: Ensure visual hierarchy through size, weight, spacing

**Problem**: Hover states are subtle
- **Cause**: Color was the primary hover indicator
- **Fix**: Grayscale theme adjusts opacity - trust the theme

### Vibrant Theme Issues

**Problem**: Text hard to read on bright backgrounds
- **Cause**: Background too saturated
- **Fix**: Vibrant theme provides appropriate contrast - use theme properties

**Problem**: Too visually overwhelming
- **Cause**: Adding extra colors on top of vibrant theme
- **Fix**: Let the theme provide the color; keep content neutral

---

## Testing Specific Component Types

### Forms & Inputs

Check in all themes:
1. Input field boundaries are clear
2. Placeholder text is visible but not too prominent
3. Focus states are obvious
4. Error states (if any) are clear
5. Labels are readable

### Cards & Panels

Check in all themes:
1. Card stands out from background
2. Backdrop blur effect works
3. Border is visible but not harsh
4. Hover effect (if applicable) is smooth
5. Content inside is properly contrasted

### Buttons

Check in all themes:
1. Button text is readable
2. Button is clearly clickable
3. Hover state is obvious
4. Disabled state (if applicable) is clear
5. Primary vs secondary buttons are distinguishable

### Lists & Tables

Check in all themes:
1. Rows are distinguishable
2. Dividers are visible
3. Hover states on rows work
4. Selected states (if any) are clear
5. Headers stand out from content

### Navigation

Check in all themes:
1. Current page/section is obvious
2. Hover states are clear
3. Icons are visible
4. Text is readable
5. Active states stand out

---

## Automated Contrast Testing

### Using Browser DevTools

1. **Open DevTools** (F12)
2. **Navigate to Elements tab**
3. **Select text element**
4. **Check Contrast Ratio** in the Styles panel
   - Look for the contrast ratio indicator
   - Should show AA or AAA compliance

### Required Contrast Ratios (WCAG AA)

- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+): 3:1 minimum
- **UI components**: 3:1 minimum

### Quick Contrast Check

For each theme, verify:
```
✓ theme.text.primary vs theme.card.background = >= 4.5:1
✓ theme.text.secondary vs theme.card.background = >= 4.5:1
✓ theme.text.muted vs theme.card.background = >= 4.5:1
✓ theme.button.primary.text vs theme.button.primary.background = >= 4.5:1
✓ theme.button.secondary.text vs theme.button.secondary.background = >= 4.5:1
```

---

## Testing Different Screen Sizes

After testing themes, also verify responsive behavior:

### Desktop (1920x1080+)
```
1. Open DevTools (F12)
2. Click responsive design mode
3. Set to 1920x1080
4. Test all themes at this size
```

### Tablet (768x1024)
```
1. Set responsive mode to 768x1024
2. Test all themes
3. Check that layouts adapt properly
4. Verify touch targets are large enough
```

### Mobile (375x667)
```
1. Set responsive mode to 375x667
2. Test all themes
3. Check text is still readable
4. Verify buttons are tappable
5. Ensure content doesn't overflow
```

---

## Theme Testing Checklist Template

Copy this for each new component:

```markdown
## Component: [Component Name]

### Theme Testing

- [ ] **Current Theme**
  - [ ] Text readable
  - [ ] Backgrounds correct
  - [ ] Borders visible
  - [ ] Hover states work
  - [ ] No layout issues

- [ ] **Light Theme**
  - [ ] Text readable
  - [ ] Backgrounds correct
  - [ ] Borders visible
  - [ ] Hover states work
  - [ ] No layout issues

- [ ] **Dark Theme**
  - [ ] Text readable
  - [ ] Backgrounds correct
  - [ ] Borders visible
  - [ ] Hover states work
  - [ ] No layout issues

- [ ] **Grayscale Theme**
  - [ ] Text readable
  - [ ] Backgrounds correct
  - [ ] Borders visible
  - [ ] Hover states work
  - [ ] No layout issues
  - [ ] Visual hierarchy clear without color

- [ ] **Vibrant Theme**
  - [ ] Text readable
  - [ ] Backgrounds correct
  - [ ] Borders visible
  - [ ] Hover states work
  - [ ] No layout issues

- [ ] **Match Device Theme**
  - [ ] Works with light OS theme
  - [ ] Works with dark OS theme
  - [ ] Transitions smoothly

### Accessibility
- [ ] Contrast ratios meet WCAG AA
- [ ] Focus states are visible
- [ ] Interactive elements are keyboard accessible
- [ ] Screen reader friendly (if applicable)

### Responsive
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Notes
[Any issues or special considerations]
```

---

## Common Testing Mistakes

### ❌ Mistake 1: Only testing Current theme
**Why it's bad**: Your component might break in other themes
**Fix**: Test all 6 themes every time

### ❌ Mistake 2: Not testing hover states
**Why it's bad**: Hover effects might not be visible in some themes
**Fix**: Hover over every interactive element in each theme

### ❌ Mistake 3: Skipping contrast checks
**Why it's bad**: Low contrast makes content inaccessible
**Fix**: Use DevTools to check contrast ratios

### ❌ Mistake 4: Only testing on one screen size
**Why it's bad**: Themes might behave differently on mobile
**Fix**: Test desktop, tablet, and mobile in each theme

### ❌ Mistake 5: Testing in isolation
**Why it's bad**: Your component might look good alone but bad with others
**Fix**: Test your component in the context of the full app

---

## Quick Testing Script

Run through this quickly for each component:

```
1. Open component in browser
2. Go to Settings → Theme
3. For each theme:
   a. Switch to theme
   b. Quick visual scan - anything look broken?
   c. Hover over buttons - states visible?
   d. Read all text - is it readable?
   e. Check borders - are they visible?
4. If all looks good → ✅ Pass
5. If any issue → Fix and repeat
```

**Time estimate**: 2-3 minutes per component

---

## Getting Help

If you're unsure whether your component passes theme testing:

1. **Check the examples**: See `/COMPONENT_TEMPLATE.tsx`
2. **Review existing components**: Look at `MainMenu.tsx`, `Settings.tsx`
3. **Use the helper**: See `/types/theme-usage-examples.ts`
4. **Read the guidelines**: See `/THEME_GUIDELINES.md`

---

## Remember

**Every component must work in every theme.**

No exceptions. If it looks good in Current but breaks in Light, it's not done.

The 5 minutes you spend testing all themes will save hours of bug fixes later.
