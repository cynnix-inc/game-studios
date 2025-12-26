# Theme System - Quick Reference Card

## Import (Required in Every Component)

```tsx
import { useTheme } from '../contexts/ThemeContext';
const { theme } = useTheme();
```

---

## Theme Properties Cheat Sheet

| Use Case | Property | Example |
|----------|----------|---------|
| **Main background** | `theme.background` | Full page gradient |
| **Card/Panel background** | `theme.card.background` | Glass panels |
| **Card border** | `theme.card.border` + `border` | Panel borders |
| **Card hover state** | `theme.card.hover` | Interactive cards |
| **Main heading text** | `theme.text.primary` | Titles, headings |
| **Body text** | `theme.text.secondary` | Descriptions, labels |
| **Subtle text** | `theme.text.muted` | Timestamps, hints |
| **Primary CTA button** | `theme.button.primary.*` | Main action buttons |
| **Secondary button** | `theme.button.secondary.*` | Less important actions |
| **Input field** | `theme.input.*` | Text inputs, selects |
| **Icon/accent color** | `theme.accent` | Icons, highlights |
| **Particles/glows** | `theme.particles.*` | Background effects |

---

## Copy-Paste Snippets

### Glass Card
```tsx
<div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
  <h2 className={theme.text.primary}>Title</h2>
  <p className={theme.text.secondary}>Content</p>
</div>
```

### Primary Button
```tsx
<Button className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}`}>
  Action
</Button>
```

### Secondary Button
```tsx
<Button className={`${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border`}>
  Action
</Button>
```

### Input Field
```tsx
<Input className={`${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`} />
```

### Icon with Accent
```tsx
<Icon className={`w-6 h-6 ${theme.accent}`} />
```

### Hoverable Card
```tsx
<div className={`${theme.card.background} ${theme.card.border} ${theme.card.hover} border transition-colors`}>
  Content
</div>
```

### Text Hierarchy
```tsx
<h1 className={theme.text.primary}>Main Title</h1>
<p className={theme.text.secondary}>Description</p>
<span className={`text-sm ${theme.text.muted}`}>Helper text</span>
```

---

## Common Mistakes (Don't Do This!)

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `text-white` | `theme.text.primary` |
| `bg-purple-500` | `theme.button.primary.background` |
| `bg-white/10` | `theme.card.background` |
| `border-white/20` | `theme.card.border` |
| `text-purple-400` | `theme.accent` |

---

## Testing Checklist

Before completing any component:

- [ ] Tested in **Current** theme
- [ ] Tested in **Light** theme
- [ ] Tested in **Dark** theme
- [ ] Tested in **Grayscale** theme
- [ ] Tested in **Vibrant** theme
- [ ] Tested in **Match Device** theme
- [ ] All text is readable in every theme
- [ ] Hover states work in every theme
- [ ] No hardcoded colors (except approved cases)

---

## When Hardcoded Colors ARE Allowed

1. **Game-specific elements**: `<X className="text-purple-400" />`
2. **Universal status colors**: `<Badge className="bg-green-500">Victory</Badge>`
3. **Standard rank colors**: `<Crown className="text-yellow-400" />`

---

## Need More Info?

See full guidelines in `/THEME_GUIDELINES.md`
