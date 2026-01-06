/**
 * Component Template
 * 
 * Copy this template when creating new components to ensure theme compatibility.
 * 
 * REMEMBER:
 * 1. Import and use the theme hook
 * 2. Replace ALL hardcoded colors with theme properties
 * 3. Test in all 6 themes before considering complete
 * 
 * See /THEME_GUIDELINES.md for full documentation
 */

import { useTheme } from '../contexts/ThemeContext';
// Import other dependencies...

interface MyComponentProps {
  // Define your props here
}

export function MyComponent({ /* props */ }: MyComponentProps) {
  // 1. REQUIRED: Get theme hook
  const { theme } = useTheme();
  
  // 2. Component logic here...
  
  return (
    <div className="max-w-4xl mx-auto min-h-screen py-8">
      
      {/* EXAMPLE: Page Header */}
      <div className="mb-8 px-4">
        <h1 className={`text-3xl md:text-4xl ${theme.text.primary}`}>
          Component Title
        </h1>
        <p className={`mt-2 ${theme.text.secondary}`}>
          Component description
        </p>
      </div>

      {/* EXAMPLE: Glass Card Container */}
      <div className="px-4 space-y-4">
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-6 shadow-xl`}>
          
          {/* EXAMPLE: Section Header with Icon */}
          <h2 className={`text-xl ${theme.text.primary} mb-4 flex items-center`}>
            {/* Icon with accent color */}
            <IconComponent className={`w-6 h-6 mr-2 ${theme.accent}`} />
            Section Title
          </h2>

          {/* EXAMPLE: Content with text hierarchy */}
          <div className="space-y-3">
            <div>
              <p className={theme.text.primary}>Primary text</p>
              <p className={`text-sm ${theme.text.secondary}`}>Secondary text</p>
              <p className={`text-xs ${theme.text.muted}`}>Helper text</p>
            </div>
          </div>

          {/* EXAMPLE: Action Buttons */}
          <div className="flex gap-3 mt-6">
            {/* Primary Button */}
            <button
              className={`px-6 py-3 rounded-xl ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} transition-all duration-300`}
            >
              Primary Action
            </button>

            {/* Secondary Button */}
            <button
              className={`px-6 py-3 rounded-xl ${theme.button.secondary.background} ${theme.button.secondary.hover} ${theme.button.secondary.text} ${theme.card.border} border transition-all duration-300`}
            >
              Secondary Action
            </button>
          </div>
        </div>

        {/* EXAMPLE: Hoverable Interactive Card */}
        <div className={`${theme.card.background} ${theme.card.border} ${theme.card.hover} border rounded-2xl p-6 transition-colors cursor-pointer shadow-xl`}>
          <p className={theme.text.primary}>Interactive card content</p>
        </div>

        {/* EXAMPLE: Input Field */}
        <div className="space-y-2">
          <label className={`text-sm ${theme.text.secondary}`}>
            Input Label
          </label>
          <input
            type="text"
            placeholder="Enter text..."
            className={`w-full px-4 py-3 rounded-xl ${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder} border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>

        {/* EXAMPLE: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 shadow-xl`}
            >
              <p className={theme.text.primary}>Grid Item {item}</p>
            </div>
          ))}
        </div>

        {/* EXAMPLE: List with Dividers */}
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl overflow-hidden shadow-xl`}>
          {[1, 2, 3].map((item, index, arr) => (
            <div key={item}>
              <div className="p-4">
                <p className={theme.text.primary}>List Item {item}</p>
                <p className={`text-sm ${theme.text.muted}`}>Description</p>
              </div>
              {index < arr.length - 1 && (
                <div className={`border-t ${theme.card.border}`} />
              )}
            </div>
          ))}
        </div>

        {/* EXAMPLE: Stats/Metrics Display */}
        <div className="grid grid-cols-3 gap-4">
          {['Metric 1', 'Metric 2', 'Metric 3'].map((metric) => (
            <div
              key={metric}
              className={`${theme.card.background} ${theme.card.border} border rounded-xl p-4 text-center shadow-xl`}
            >
              <p className={`text-2xl ${theme.text.primary} mb-1`}>123</p>
              <p className={`text-xs ${theme.text.muted}`}>{metric}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/**
 * TESTING CHECKLIST
 * 
 * Before submitting this component, verify:
 * 
 * [ ] Theme hook is imported and used
 * [ ] No hardcoded text-white, text-black, bg-white, bg-purple-*, etc.
 * [ ] All text uses theme.text.primary/secondary/muted
 * [ ] All backgrounds use theme.card.background
 * [ ] All borders use theme.card.border + border
 * [ ] All buttons use theme.button.primary/secondary
 * [ ] All inputs use theme.input.*
 * [ ] All icons use theme.accent or appropriate color
 * [ ] Hover states use theme.card.hover or theme.button.*.hover
 * [ ] Tested visually in Current theme
 * [ ] Tested visually in Light theme
 * [ ] Tested visually in Dark theme
 * [ ] Tested visually in Grayscale theme
 * [ ] Tested visually in Vibrant theme
 * [ ] Tested visually in Match Device theme
 * [ ] All text is readable in all themes
 * [ ] Contrast ratios meet WCAG AA standards
 * [ ] No console errors or warnings
 */
