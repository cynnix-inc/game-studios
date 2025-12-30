// Sudoku variant types for Ultimate Sudoku

export type Variant = 
  | 'classic'
  | 'sudoku-x'
  | 'killer'
  | 'thermo'
  | 'arrow'
  | 'even-odd'
  | 'kropki'
  | 'renban'
  | 'palindrome'
  | 'windoku'
  | 'jigsaw';

export type ClassicSubVariant = '4x4' | '6x6' | '9x9' | '12x12' | '16x16';
export type SudokuXSubVariant = 'single-diagonal' | 'double-diagonal' | 'diagonal-windoku';

export interface VariantDefinition {
  id: Variant;
  name: string;
  icon: string;
  description: string;
  shortDescription: string;
  popularityRank: number; // Lower = more popular (1 = most popular)
  subVariants?: {
    type: 'grid-size' | 'diagonal-type';
    options: readonly string[];
    default: string;
    label: string;
  };
}

export const VARIANT_DEFINITIONS: Record<Variant, VariantDefinition> = {
  'classic': {
    id: 'classic',
    name: 'Classic Sudoku',
    icon: '🔢',
    description: 'Classic Sudoku with extra structure. More connections, more "aha" moments.',
    shortDescription: 'The timeless original',
    popularityRank: 1,
    subVariants: {
      type: 'grid-size',
      options: ['4x4', '6x6', '9x9', '12x12', '16x16'],
      default: '9x9',
      label: 'Grid Size'
    }
  },
  'sudoku-x': {
    id: 'sudoku-x',
    name: 'Sudoku X',
    icon: '⚡',
    description: 'Normal Sudoku rules, plus diagonals must contain 1–9. Extra structure, more "aha" moments.',
    shortDescription: 'Diagonals add structure',
    popularityRank: 2,
    subVariants: {
      type: 'diagonal-type',
      options: ['single-diagonal', 'double-diagonal', 'diagonal-windoku'],
      default: 'double-diagonal',
      label: 'Diagonal Type'
    }
  },
  'killer': {
    id: 'killer',
    name: 'Killer Sudoku',
    icon: '🎯',
    description: 'Groups of cells (cages) have a sum. Digits cannot repeat inside a cage. Sudoku meets mental math.',
    shortDescription: 'Math meets logic puzzles',
    popularityRank: 3
  },
  'thermo': {
    id: 'thermo',
    name: 'Thermo Sudoku',
    icon: '🌡️',
    description: 'Thermometer shapes must strictly increase from bulb to tip. Super visual and intuitive.',
    shortDescription: 'Temperatures rise visually',
    popularityRank: 4
  },
  'arrow': {
    id: 'arrow',
    name: 'Arrow Sudoku',
    icon: '🏹',
    description: 'Digits on the arrow sum to the digit in the circle. Killer-style sums with a twist.',
    shortDescription: 'Arrows point to totals',
    popularityRank: 5
  },
  'even-odd': {
    id: 'even-odd',
    name: 'Even/Odd Sudoku',
    icon: '⚖️',
    description: 'Marked cells must be even or odd. Friendly and fast, patterns pop early.',
    shortDescription: 'Parity helps eliminate',
    popularityRank: 6
  },
  'kropki': {
    id: 'kropki',
    name: 'Kropki Sudoku',
    icon: '⚫⚪',
    description: 'Dots show relationships. White = consecutive, black = double/half. Number logic and chaining.',
    shortDescription: 'Dots create constraints',
    popularityRank: 7
  },
  'renban': {
    id: 'renban',
    name: 'Renban Sudoku',
    icon: '📏',
    description: 'Cells on a line must be consecutive digits in any order. Smooth, set-based reasoning.',
    shortDescription: 'Lines are consecutive',
    popularityRank: 8
  },
  'palindrome': {
    id: 'palindrome',
    name: 'Palindrome Sudoku',
    icon: '🔄',
    description: 'Digits on a line read the same forward and backward. Satisfying mirrored deductions.',
    shortDescription: 'Symmetry guides solutions',
    popularityRank: 9
  },
  'windoku': {
    id: 'windoku',
    name: 'Windoku',
    icon: '🪟',
    description: 'Four extra shaded 3x3 regions must contain 1–9. Denser classic Sudoku with more constraints.',
    shortDescription: 'Extra boxes, tighter logic',
    popularityRank: 10
  },
  'jigsaw': {
    id: 'jigsaw',
    name: 'Jigsaw Sudoku',
    icon: '🧩',
    description: 'Boxes replaced by irregular regions, each containing 1–9. Breaks habits, forces flexible thinking.',
    shortDescription: 'Irregular shapes challenge',
    popularityRank: 11
  }
};

export const VARIANTS: readonly Variant[] = Object.keys(VARIANT_DEFINITIONS) as Variant[];

// Helper to get sorted variants by usage and popularity
export function getSortedVariants(usageStats?: Record<Variant, number>): Variant[] {
  return [...VARIANTS].sort((a, b) => {
    const usageA = usageStats?.[a] || 0;
    const usageB = usageStats?.[b] || 0;
    
    // Sort by usage first (higher usage first)
    if (usageA !== usageB) {
      return usageB - usageA;
    }
    
    // Then by popularity rank (lower rank = more popular)
    return VARIANT_DEFINITIONS[a].popularityRank - VARIANT_DEFINITIONS[b].popularityRank;
  });
}
