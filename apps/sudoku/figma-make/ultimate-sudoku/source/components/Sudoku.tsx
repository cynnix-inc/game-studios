import { useState, useEffect } from 'react';
import { Eraser, RefreshCw, Lightbulb, Pencil, Lock, CheckCircle2, Undo, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Difficulty } from '../types/difficulty';

interface SudokuProps {
  difficulty: Difficulty;
  mode: 'play' | 'edit';
  onComplete?: () => void;
  onHintUsed?: () => void;
  onMistake?: () => void;
  initialLivesCount?: number;
  initialBoard?: Cell[][];
  initialSolution?: number[][];
  // Preview mode for grid customizer
  previewMode?: boolean;
  previewSettings?: {
    gridSize: number;
    digitSize: number;
    noteSize: number;
    highlightContrast: number;
    highlightAssistance: boolean;
  };
  previewSelectedCell?: { row: number; col: number } | null;
}

type Cell = {
  value: number;
  isFixed: boolean;
  notes: number[];
};

export function Sudoku({ 
  difficulty, 
  mode, 
  onComplete, 
  onHintUsed, 
  onMistake,
  initialLivesCount, 
  initialBoard, 
  initialSolution,
  previewMode = false,
  previewSettings,
  previewSelectedCell
}: SudokuProps) {
  const { theme, themeType } = useTheme();
  const contextSettings = useSettings();
  
  // Use preview settings if in preview mode, otherwise use context settings
  const settings = previewMode && previewSettings ? previewSettings : contextSettings;
  
  const [board, setBoard] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(previewSelectedCell || null);
  const [notesMode, setNotesMode] = useState(false);
  const [lockMode, setLockMode] = useState(() => {
    // Load lock mode preference from localStorage, default to true for new users
    const saved = localStorage.getItem('lockModePreference');
    return saved !== null ? saved === 'true' : true;
  });
  const [lockedNumber, setLockedNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<Cell[][][]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showErrors, setShowErrors] = useState(true);
  
  // Calculate cell size based on grid scale
  // The actual cell size will be determined by CSS (aspect-square + percentage-based grid),
  // but we need an approximate size for calculating note font size
  // Base cell size scales with container width: mobile ~40px, desktop ~80px
  const baseCellSize = window.innerWidth < 768 ? 40 : 80; // Responsive base
  const cellSize = (baseCellSize * settings.gridSize) / 100;
  
  // Calculate font sizes based on settings - responsive for mobile vs desktop
  const baseDigitSize = window.innerWidth < 768 ? 16 : 32; // Smaller on mobile
  const digitFontSize = (baseDigitSize * settings.digitSize) / 100;
  
  // Note size as PERCENTAGE of sub-cell - matches GridPreview logic
  const subCellSize = cellSize / 3;
  const notePercentage = 0.5 + (settings.noteSize - 100) / 500; // Maps 100→50%, 150→60%, 200→70%, 250→80%, 300→90%
  const noteFontSize = subCellSize * notePercentage;

  // Generate a Sudoku puzzle
  useEffect(() => {
    // Skip puzzle generation in preview mode - use initialBoard instead
    if (previewMode && initialBoard) {
      setBoard(initialBoard);
      setSelectedCell(previewSelectedCell || null);
      return;
    }
    
    // Try to load saved game state first
    const savedState = localStorage.getItem('sudokuGameState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Verify it matches current difficulty
        if (parsed.difficulty === difficulty) {
          setBoard(parsed.board);
          setSolution(parsed.solution);
          setHistory([JSON.parse(JSON.stringify(parsed.board))]);
          setIsComplete(false);
          return;
        }
      } catch (e) {
        console.error('Failed to load saved game:', e);
      }
    }
    
    // No saved game or wrong difficulty - generate new puzzle
    generatePuzzle();
  }, [difficulty, previewMode, initialBoard, previewSelectedCell]);

  // Save game state whenever board changes
  useEffect(() => {
    if (board.length > 0 && solution.length > 0 && !isComplete) {
      localStorage.setItem('sudokuGameState', JSON.stringify({
        board,
        solution,
        difficulty
      }));
    }
  }, [board, solution, difficulty, isComplete]);

  const generatePuzzle = () => {
    // Generate a complete solved board
    const newSolution = generateCompleteSudoku();
    setSolution(newSolution);

    // Create puzzle by removing numbers based on difficulty
    const cellsToRemove = {
      novice: 40,      // 41-45 clues
      skilled: 47,     // 34-38 clues
      advanced: 53,    // 28-32 clues
      expert: 56,      // 25-28 clues
      fiendish: 58,    // 23-25 clues
      ultimate: 60,    // 21-23 clues
    }[difficulty];

    const newBoard: Cell[][] = newSolution.map((row) =>
      row.map((val) => ({ value: val, isFixed: true, notes: [] }))
    );

    // Remove cells to create puzzle
    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (newBoard[row][col].value !== 0) {
        newBoard[row][col].value = 0;
        newBoard[row][col].isFixed = false;
        removed++;
      }
    }

    setBoard(newBoard);
    setHistory([JSON.parse(JSON.stringify(newBoard))]);
    setIsComplete(false);
  };

  // Generate a complete valid Sudoku board
  const generateCompleteSudoku = (): number[][] => {
    const board = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0));

    const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
      // Check row
      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
      }

      // Check column
      for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[boxRow + i][boxCol + j] === num) return false;
        }
      }

      return true;
    };

    const solve = (board: number[][]): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (const num of numbers) {
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                if (solve(board)) return true;
                board[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    solve(board);
    return board;
  };

  const handleCellClick = (row: number, col: number) => {
    // Disable interactions in preview mode
    if (previewMode) return;
    
    setSelectedCell({ row, col });
    
    // Guard against uninitialized board
    if (!board[row] || !board[row][col]) return;
    
    // If lock mode is on and cell has a value, lock to that number
    if (lockMode && board[row][col].value !== 0) {
      setLockedNumber(board[row][col].value);
    }
    
    // If lock mode is on and a number is locked, place it in the cell
    if (lockMode && lockedNumber !== null && !board[row][col].isFixed && !isComplete) {
      const newBoard = JSON.parse(JSON.stringify(board));
      
      if (notesMode) {
        // Toggle note
        const noteIndex = newBoard[row][col].notes.indexOf(lockedNumber);
        if (noteIndex > -1) {
          newBoard[row][col].notes.splice(noteIndex, 1);
        } else {
          newBoard[row][col].notes.push(lockedNumber);
          newBoard[row][col].notes.sort();
        }
      } else {
        // Set value
        if (newBoard[row][col].value === lockedNumber) {
          newBoard[row][col].value = 0;
        } else {
          newBoard[row][col].value = lockedNumber;
          newBoard[row][col].notes = [];
          
          // Check if incorrect
          if (solution[row][col] !== lockedNumber && showErrors) {
            if (onMistake) onMistake();
          }
        }
      }
      
      setBoard(newBoard);
      setHistory([...history, newBoard]);
      checkCompletion(newBoard);
    }
  };

  const handleNumberInput = (num: number) => {
    // If lock mode is on, set this as the locked number
    if (lockMode) {
      setLockedNumber(lockedNumber === num ? null : num);
      return;
    }
    
    if (!selectedCell || isComplete) return;
    const { row, col } = selectedCell;
    if (board[row][col].isFixed) return;

    const newBoard = JSON.parse(JSON.stringify(board));

    if (notesMode) {
      // Toggle note
      const noteIndex = newBoard[row][col].notes.indexOf(num);
      if (noteIndex > -1) {
        newBoard[row][col].notes.splice(noteIndex, 1);
      } else {
        newBoard[row][col].notes.push(num);
        newBoard[row][col].notes.sort();
      }
    } else {
      // Set value
      if (newBoard[row][col].value === num) {
        newBoard[row][col].value = 0;
      } else {
        newBoard[row][col].value = num;
        newBoard[row][col].notes = [];
        
        // Check if incorrect
        if (solution[row][col] !== num && showErrors) {
          if (onMistake) onMistake();
        }
      }
    }

    setBoard(newBoard);
    setHistory([...history, newBoard]);

    // Check if puzzle is complete
    checkCompletion(newBoard);
  };

  const checkCompletion = (currentBoard: Cell[][]) => {
    const isFullyFilled = currentBoard.every((row) =>
      row.every((cell) => cell.value !== 0)
    );

    if (isFullyFilled) {
      const isCorrect = currentBoard.every((row, i) =>
        row.every((cell, j) => cell.value === solution[i][j])
      );

      if (isCorrect) {
        setIsComplete(true);
        // Clear saved game state on completion
        localStorage.removeItem('sudokuGameState');
        if (onComplete) onComplete();
      }
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setBoard(JSON.parse(JSON.stringify(newHistory[newHistory.length - 1])));
      setHistory(newHistory);
    }
  };

  const handleHint = () => {
    if (isComplete) return;
    
    // Find an empty cell and fill it with correct value
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!board[row][col].isFixed && board[row][col].value === 0) {
          const newBoard = JSON.parse(JSON.stringify(board));
          newBoard[row][col].value = solution[row][col];
          newBoard[row][col].notes = [];
          setBoard(newBoard);
          setHistory([...history, newBoard]);
          if (onHintUsed) onHintUsed();
          setSelectedCell({ row, col });
          checkCompletion(newBoard);
          return;
        }
      }
    }
  };

  const getCellConflicts = (row: number, col: number): boolean => {
    if (!showErrors || board[row][col].value === 0) return false;

    const value = board[row][col].value;

    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c].value === value) return true;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col].value === value) return true;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if ((r !== row || c !== col) && board[r][c].value === value) return true;
      }
    }

    return false;
  };

  const isHighlighted = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    const { row: selRow, col: selCol } = selectedCell;
    
    // Same cell
    if (row === selRow && col === selCol) return true;
    
    // Same row or column
    if (row === selRow || col === selCol) return true;
    
    return false;
  };

  const isInSameBox = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    const { row: selRow, col: selCol } = selectedCell;
    
    // Same 3x3 box
    const boxRow = Math.floor(row / 3) === Math.floor(selRow / 3);
    const boxCol = Math.floor(col / 3) === Math.floor(selCol / 3);
    return boxRow && boxCol;
  };

  const isSameNumber = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    
    const selectedValue = board[selectedCell.row][selectedCell.col].value;
    if (selectedValue === 0) return false;
    
    // Only highlight cells with the same value (not notes)
    if (board[row][col].value === selectedValue) return true;
    
    return false;
  };

  const getNumberCount = (num: number): number => {
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row]?.[col]?.value === num) {
          count++;
        }
      }
    }
    return count;
  };
  
  // Helper function to get highlight background color with dynamic opacity
  const getHighlightStyle = (type: 'selected' | 'rowColumn' | 'box' | 'sameNumber' | 'conflict'): React.CSSProperties => {
    // Always show selected cell and conflicts, even when assistance is disabled
    if (!settings.highlightAssistance && type !== 'conflict' && type !== 'selected') {
      return {};
    }
    
    // Convert contrast setting (50-200) to multiplier (0.5-2.0)
    const contrast = settings.highlightContrast / 100;
    
    // Determine if we're in light theme
    const isLightTheme = themeType === 'light';
    
    // Base opacities optimized for accessibility (WCAG AA contrast)
    // Light theme uses dark overlays (less opacity needed for visibility)
    // Dark themes use white overlays (more opacity needed for visibility)
    const baseOpacities = isLightTheme ? {
      selected: 0.20,      // Primary selection - most prominent
      rowColumn: 0.10,     // Row/column assistance
      box: 0.05,           // Box grouping - subtle
      sameNumber: 0.15,    // Same number highlighting
      conflict: 0.30,      // Conflicts - highly visible
    } : {
      selected: 0.25,      // Needs higher opacity on dark backgrounds
      rowColumn: 0.12,     // Slightly more visible
      box: 0.06,           // Slightly more visible
      sameNumber: 0.18,    // More prominent on dark
      conflict: 0.35,      // More prominent on dark
    };
    
    // Calculate final opacity with contrast adjustment
    const opacity = baseOpacities[type] * contrast;
    
    // Base colors for overlays
    const baseColor = isLightTheme ? '15, 23, 42' : '255, 255, 255'; // slate-900 or white
    
    // Special handling for conflicts - always use red with good contrast
    if (type === 'conflict') {
      // Use brighter red on dark themes, darker red on light theme
      const conflictColor = isLightTheme ? '220, 38, 38' : '248, 113, 113'; // red-700 or red-400
      return { backgroundColor: `rgba(${conflictColor}, ${opacity})` };
    }
    
    return { backgroundColor: `rgba(${baseColor}, ${opacity})` };
  };

  return (
    <div 
      className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-3 md:space-y-4 px-2 md:px-4"
      style={{
        transform: `scale(${settings.gridSize / 100})`,
        transformOrigin: 'top center'
      }}
    >
      {/* Victory Message */}
      {isComplete && (
        <div className={`${theme.card.background} ${theme.card.border} border rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-xl text-center space-y-2`}>
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className={`text-2xl ${theme.text.primary}`}>Puzzle Complete!</h2>
          <p className="text-green-400">+250 points!</p>
          <p className={`text-sm ${theme.text.muted}`}>
            Mistakes: {initialLivesCount} • Hints: {hintsUsed}
          </p>
        </div>
      )}

      {/* Sudoku Board */}
      <div 
        className={`${theme.card.background} ${theme.card.border} border rounded-xl p-2 md:p-3 shadow-xl backdrop-blur-xl`}
      >
        <div className="aspect-square w-full">
          {/* Outer wrapper with gap background */}
          <div className={`w-full h-full rounded-lg overflow-hidden p-1.5`}
            style={{ backgroundColor: 'var(--border-color)' }}
          >
            {/* 3x3 major grid with gaps */}
            <div className="grid grid-cols-3 gap-1.5 w-full h-full">
              {[0, 1, 2].map((majorRow) => (
                [0, 1, 2].map((majorCol) => (
                  <div key={`${majorRow}-${majorCol}`} className={`${theme.card.background} grid grid-cols-3 gap-0`}>
                    {/* 3x3 minor grid of cells */}
                    {[0, 1, 2].map((minorRow) => (
                      [0, 1, 2].map((minorCol) => {
                        const rowIndex = majorRow * 3 + minorRow;
                        const colIndex = majorCol * 3 + minorCol;
                        const cell = board[rowIndex]?.[colIndex];
                        
                        if (!cell) return null;
                        
                        const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                        const isHighlight = isHighlighted(rowIndex, colIndex);
                        const isBox = isInSameBox(rowIndex, colIndex);
                        const hasConflict = getCellConflicts(rowIndex, colIndex);
                        const isSameNum = isSameNumber(rowIndex, colIndex);
                        const isRightEdge = minorCol === 2;
                        const isBottomEdge = minorRow === 2;
                        
                        // Determine which highlight style to apply (priority order)
                        let highlightStyle: React.CSSProperties = {};
                        if (hasConflict) {
                          highlightStyle = getHighlightStyle('conflict');
                        } else if (isSelected) {
                          highlightStyle = getHighlightStyle('selected');
                        } else if (isSameNum) {
                          highlightStyle = getHighlightStyle('sameNumber');
                        } else if (isHighlight) {
                          highlightStyle = getHighlightStyle('rowColumn');
                        } else if (isBox) {
                          highlightStyle = getHighlightStyle('box');
                        }

                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            className={`
                              aspect-square flex items-center justify-center relative
                              transition-all duration-200
                              ${isSelected ? 'z-10' : ''}
                              ${cell.isFixed ? theme.text.primary : theme.text.secondary}
                              ${!isRightEdge ? `border-r ${theme.card.border}` : ''}
                              ${!isBottomEdge ? `border-b ${theme.card.border}` : ''}
                              ${theme.card.hover}
                            `}
                            style={highlightStyle}
                            disabled={isComplete}
                          >
                            {cell.value !== 0 ? (
                              <span 
                                className={`${cell.isFixed ? `${theme.text.primary} font-semibold` : theme.sudoku.userFilled}`}
                                style={{ fontSize: `${digitFontSize}px`, lineHeight: 1 }}
                              >
                                {cell.value}
                              </span>
                            ) : (
                              <div className="absolute inset-0 grid grid-cols-3 gap-0 p-0.5 overflow-hidden">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                                  const hasNote = cell.notes.includes(num);
                                  const isHighlightedNote = selectedCell && 
                                    board[selectedCell.row][selectedCell.col].value === num && 
                                    hasNote;
                                  
                                  // Get subcell highlight style - same intensity as full cell highlights
                                  const subcellHighlight = isHighlightedNote 
                                    ? getHighlightStyle('sameNumber')
                                    : {};
                                  
                                  return (
                                    <div
                                      key={num}
                                      className={`flex items-center justify-center ${
                                        hasNote ? theme.text.muted : 'opacity-0'
                                      }`}
                                      style={{ 
                                        fontSize: `${noteFontSize}px`, 
                                        lineHeight: 1,
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        ...subcellHighlight
                                      }}
                                    >
                                      {num}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </button>
                        );
                      })
                    ))}
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hide controls in preview mode */}
      {!previewMode && (
        <>
          {/* Number Input Buttons */}
          <div className="px-3 md:px-6">
            <div className="grid grid-cols-9 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isNumberComplete = getNumberCount(num) === 9;
                const isLocked = lockedNumber === num && lockMode;
                return (
                  <Button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    className={`
                      ${isLocked ? theme.button.primary.background : theme.button.secondary.background}
                      ${isLocked ? theme.button.primary.hover : 'hover:bg-white/20'}
                      ${isLocked ? theme.button.primary.text : theme.button.secondary.text}
                      ${isLocked ? `${theme.card.border} border` : 'border-0'}
                      aspect-square p-0 w-full h-full min-h-[48px] md:min-h-[64px]
                      transition-all duration-300
                      ${isNumberComplete ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                    disabled={isNumberComplete || (!lockMode && (!selectedCell || isComplete))}
                    style={{ fontSize: `${digitFontSize}px`, lineHeight: 1 }}
                  >
                    {num}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Control Buttons - Reordered: Hint, Undo, Notes, Lock */}
          <div className="px-3 md:px-6 pt-1">
            <div className="grid grid-cols-4 gap-2">
              {/* Hint - Most important action */}
              <Button
                onClick={handleHint}
                className={`
                  ${theme.button.secondary.background} 
                  ${theme.button.secondary.hover} 
                  ${theme.button.secondary.text} 
                  ${theme.card.border} 
                  border 
                  transition-all duration-300
                  aspect-square p-0
                `}
                disabled={isComplete}
              >
                <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />
              </Button>

              {/* Undo */}
              <Button
                onClick={handleUndo}
                className={`
                  ${theme.button.secondary.background} 
                  ${theme.button.secondary.hover} 
                  ${theme.button.secondary.text} 
                  ${theme.card.border} 
                  border 
                  transition-all duration-300
                  aspect-square p-0
                `}
                disabled={history.length <= 1 || isComplete}
              >
                <Undo className="w-5 h-5 md:w-6 md:h-6" />
              </Button>

              {/* Notes - Stronger active state */}
              <Button
                onClick={() => setNotesMode(!notesMode)}
                className={`
                  ${theme.button.secondary.background} 
                  ${theme.button.secondary.hover} 
                  ${theme.button.secondary.text} 
                  ${theme.card.border} 
                  border 
                  transition-all duration-300
                  aspect-square p-0
                  ${notesMode ? 'bg-blue-500/20' : ''}
                `}
                disabled={isComplete}
              >
                <Edit3 className={`w-5 h-5 md:w-6 md:h-6 ${notesMode ? 'text-blue-400' : ''}`} />
              </Button>

              {/* Lock - Stronger active state */}
              <Button
                onClick={() => {
                  const newLockMode = !lockMode;
                  setLockMode(newLockMode);
                  // Save preference to localStorage
                  localStorage.setItem('lockModePreference', newLockMode.toString());
                  if (newLockMode === false) {
                    setLockedNumber(null); // Clear locked number when turning off lock mode
                  }
                }}
                className={`
                  ${theme.button.secondary.background} 
                  ${theme.button.secondary.hover} 
                  ${theme.button.secondary.text} 
                  ${theme.card.border} 
                  border 
                  transition-all duration-300
                  aspect-square p-0
                  ${lockMode ? 'bg-purple-500/20' : ''}
                `}
                disabled={isComplete}
              >
                <Lock className={`w-5 h-5 md:w-6 md:h-6 ${lockMode ? 'text-purple-400' : ''}`} />
              </Button>
            </div>
          </div>

          {/* New Puzzle Button */}
          {isComplete && (
            <div className="text-center px-3 md:px-6">
              <Button
                onClick={generatePuzzle}
                className={`
                  ${theme.button.primary.background} 
                  ${theme.button.primary.hover} 
                  ${theme.button.primary.text} 
                  px-8
                  transition-all duration-300
                `}
              >
                New Puzzle
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}