import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';

interface SudokuLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  darkMode?: boolean; // For loading screen
  onTripleClick?: () => void; // For accessing design lab
}

export function SudokuLogo({ size = 'md', animated = false, darkMode = false, onTripleClick }: SudokuLogoProps) {
  const { theme } = useTheme();
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'notes' | 'solving' | 'complete'>('initial');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [visibleNotes, setVisibleNotes] = useState<string[]>([]); // Changed to string array like "1-3" (cellIdx-number)
  const [visibleSolutions, setVisibleSolutions] = useState<number[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimeout, setClickTimeoutState] = useState<NodeJS.Timeout | null>(null);

  // Triple-click detection
  const handleClick = () => {
    if (!onTripleClick) return;

    setClickCount(prev => prev + 1);

    // Clear existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setClickCount(0);
    }, 500); // 500ms window for triple-click

    setClickTimeoutState(timeout);
  };

  // Trigger onTripleClick when clickCount reaches 3
  useEffect(() => {
    if (clickCount === 3 && onTripleClick) {
      onTripleClick();
      setClickCount(0);
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    }
  }, [clickCount, onTripleClick, clickTimeout]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Animation sequence
  useEffect(() => {
    if (!animated || prefersReducedMotion) {
      setAnimationPhase('complete');
      // Show all notes and solutions immediately
      const allNotes: string[] = [];
      Object.entries(pencilMarks).forEach(([cellIdx, marks]) => {
        marks.forEach(mark => {
          allNotes.push(`${cellIdx}-${mark}`);
        });
      });
      setVisibleNotes(allNotes);
      setVisibleSolutions([1, 3, 4, 7]);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Start notes phase after initial delay
    timers.push(setTimeout(() => {
      setAnimationPhase('notes');
    }, 500));

    // Phase 2: Show each individual pencil mark one at a time
    // Build array of all individual pencil marks - interleaved between cells for realistic solving
    const allPencilMarks: Array<{ cellIdx: number; mark: number }> = [
      { cellIdx: 1, mark: 3 },   // Start with cell 1
      { cellIdx: 3, mark: 2 },   // Jump to cell 3
      { cellIdx: 1, mark: 6 },   // Back to cell 1
      { cellIdx: 4, mark: 6 },   // Jump to cell 4
      { cellIdx: 7, mark: 9 },   // Jump to cell 7
      { cellIdx: 3, mark: 9 },   // Back to cell 3
      { cellIdx: 1, mark: 9 },   // Back to cell 1
      { cellIdx: 4, mark: 9 },   // Back to cell 4
      { cellIdx: 7, mark: 3 },   // Back to cell 7
    ];

    allPencilMarks.forEach((item, i) => {
      timers.push(setTimeout(() => {
        setVisibleNotes(prev => [...prev, `${item.cellIdx}-${item.mark}`]);
      }, 800 + (i * 300))); // 300ms between each individual pencil mark
    });

    // Phase 3: Start solving phase
    const notesEndTime = 800 + (allPencilMarks.length * 300) + 400;
    timers.push(setTimeout(() => {
      setAnimationPhase('solving');
    }, notesEndTime));

    // Phase 4: Fill in solutions one by one
    const solvingCells = [1, 3, 4, 7];
    solvingCells.forEach((cellIdx, i) => {
      timers.push(setTimeout(() => {
        setVisibleSolutions(prev => [...prev, cellIdx]);
      }, notesEndTime + 400 + (i * 500))); // 500ms between each solution
    });

    // Phase 5: Complete
    timers.push(setTimeout(() => {
      setAnimationPhase('complete');
    }, notesEndTime + 400 + (solvingCells.length * 500) + 300));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [animated, prefersReducedMotion]);

  const sizeConfig = {
    sm: { container: 'w-16 h-16 md:w-20 md:h-20', cell: 'text-xs md:text-sm', notes: 'text-[6px] md:text-[7px]' },
    md: { container: 'w-24 h-24 md:w-32 md:h-32', cell: 'text-sm md:text-lg', notes: 'text-[7px] md:text-[9px]' },
    lg: { container: 'w-32 h-32 md:w-40 md:h-40', cell: 'text-base md:text-xl', notes: 'text-[8px] md:text-[10px]' },
  };

  const config = sizeConfig[size];

  // Valid 3x3 Sudoku grid (one complete box from a larger puzzle)
  // Final solution:
  // 5 3 7
  // 2 6 4
  // 1 9 8
  
  // Grid definition: null = solving cell, number = pre-filled
  const gridData = [
    5, null, 7,      // Top row: 5 pre-filled, solving 3, 7 pre-filled
    null, null, 4,   // Middle row: solving 2, solving 6, 4 pre-filled  
    1, null, 8       // Bottom row: 1 pre-filled, solving 9, 8 pre-filled
  ];

  // Realistic pencil marks based on what's already filled
  // For each solving cell, show candidates that make sense
  const pencilMarks: { [key: number]: number[] } = {
    1: [3, 6, 9],    // Top center: missing 3 from {1,2,3,4,6,8,9}
    3: [2, 9],       // Middle left: missing 2 from available
    4: [6, 9],       // Middle center: missing 6 from available
    7: [3, 9],       // Bottom center: missing 9 from available
  };

  // Final solutions for solving cells
  const solutions: { [key: number]: number } = {
    1: 3,  // Top center
    3: 2,  // Middle left
    4: 6,  // Middle center
    7: 9,  // Bottom center
  };

  const cellBgColor = darkMode 
    ? 'bg-white/10 border-white/30'
    : `${theme.card.background} ${theme.card.border}`;

  const textColor = darkMode ? 'text-white' : theme.text.primary;
  const notesColor = darkMode ? 'text-white/50' : theme.text.muted;
  const accentColor = darkMode ? 'text-purple-300' : theme.accent;

  return (
    <div 
      className={`${config.container} relative`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px',
        padding: '4px',
        background: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: darkMode ? '2px solid rgba(255, 255, 255, 0.2)' : `2px solid`,
        borderColor: darkMode ? undefined : theme.card.border.replace('border-', ''),
      }}
      onClick={handleClick}
    >
      {gridData.map((cell, idx) => {
        const isSolving = cell === null;
        const hasPencilMarks = isSolving && pencilMarks[idx];
        const showSolution = isSolving && (animationPhase === 'solving' || animationPhase === 'complete') && visibleSolutions.includes(idx);
        const isComplete = animationPhase === 'complete';

        return (
          <div
            key={idx}
            className={`${cellBgColor} border backdrop-blur-xl rounded flex items-center justify-center relative transition-all duration-500 aspect-square overflow-hidden`}
            style={{
              boxShadow: isComplete && isSolving ? '0 0 12px rgba(168, 85, 247, 0.4)' : undefined,
            }}
          >
            {/* Pre-filled numbers */}
            {typeof cell === 'number' && (
              <span className={`${textColor} ${config.cell} font-semibold`}>
                {cell}
              </span>
            )}

            {/* Pencil marks */}
            {hasPencilMarks && !showSolution && (
              <div className={`grid grid-cols-3 grid-rows-3 absolute inset-0 p-1 ${notesColor} ${config.notes} leading-none`}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                  const isPencilMark = pencilMarks[idx].includes(num);
                  const isVisible = isPencilMark && visibleNotes.includes(`${idx}-${num}`);
                  
                  return (
                    <div key={num} className="flex items-center justify-center">
                      {isVisible ? num : ''}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Solution numbers (animated) */}
            {showSolution && solutions[idx] && (
              <span 
                className={`${isComplete ? accentColor : textColor} ${config.cell} font-semibold transition-all duration-500`}
                style={{
                  animation: animationPhase === 'solving' ? 'popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : undefined,
                }}
              >
                {solutions[idx]}
              </span>
            )}
          </div>
        );
      })}

      {/* Completion glow */}
      {animationPhase === 'complete' && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out',
          }}
        />
      )}

      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}