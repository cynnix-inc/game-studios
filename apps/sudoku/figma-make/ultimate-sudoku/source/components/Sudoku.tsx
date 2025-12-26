import { useState, useEffect } from 'react';
import { Lightbulb, Undo, Edit3, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

interface SudokuProps {
  onWin?: () => void;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  onMistake?: () => void;
  onHintUsed?: () => void;
  mistakes?: number;
  hintsUsed?: number;
}

type Cell = {
  value: number;
  isFixed: boolean;
  notes: number[];
};

export function Sudoku({ onWin, difficulty, onMistake, onHintUsed, mistakes = 0, hintsUsed = 0 }: SudokuProps) {
  const { theme } = useTheme();
  const settings = useSettings();
  const [board, setBoard] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [lockMode, setLockMode] = useState(false);
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
    generatePuzzle();
  }, [difficulty]);

  const generatePuzzle = () => {
    // Generate a complete solved board
    const newSolution = generateCompleteSudoku();
    setSolution(newSolution);

    // Create puzzle by removing numbers based on difficulty
    const cellsToRemove = {
      easy: 35,
      medium: 45,
      hard: 52,
      expert: 58,
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
        if (onWin) onWin();
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
    if (!selectedCell || board[row][col].value === 0) return false;
    return board[row][col].value === board[selectedCell.row][selectedCell.col].value;
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
            Mistakes: {mistakes} • Hints: {hintsUsed}
          </p>
        </div>
      )}

      {/* Sudoku Board */}
      <div 
        className={`${theme.card.background} ${theme.card.border} border rounded-3xl p-3 md:p-6 shadow-xl backdrop-blur-xl`}
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

                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            className={`
                              aspect-square flex items-center justify-center relative
                              transition-all duration-200
                              ${isSelected ? theme.sudoku.selected + ' z-10' : ''}
                              ${isHighlight && !isSelected && !isSameNum ? theme.sudoku.rowColumn : ''}
                              ${isBox && !isHighlight && !isSelected && !isSameNum ? theme.sudoku.box : ''}
                              ${isSameNum && !isSelected ? theme.sudoku.sameNumber : ''}
                              ${hasConflict ? 'bg-red-500/20' : ''}
                              ${cell.isFixed ? theme.text.primary : theme.text.secondary}
                              ${!isRightEdge ? `border-r ${theme.card.border}` : ''}
                              ${!isBottomEdge ? `border-b ${theme.card.border}` : ''}
                              ${theme.card.hover}
                            `}
                            disabled={isComplete}
                          >
                            {cell.value !== 0 ? (
                              <span 
                                className={`${cell.isFixed ? 'opacity-100' : 'opacity-80'}`}
                                style={{ fontSize: `${digitFontSize}px`, lineHeight: 1 }}
                              >
                                {cell.value}
                              </span>
                            ) : (
                              <div className="absolute inset-0 grid grid-cols-3 gap-0 p-0.5 overflow-hidden">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                  <div
                                    key={num}
                                    className={`flex items-center justify-center ${
                                      cell.notes.includes(num) ? theme.text.muted : 'opacity-0'
                                    }`}
                                    style={{ 
                                      fontSize: `${noteFontSize}px`, 
                                      lineHeight: 1,
                                      maxWidth: '100%',
                                      maxHeight: '100%'
                                    }}
                                  >
                                    {num}
                                  </div>
                                ))}
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

      {/* Number Input Buttons */}
      <div className="px-3 md:px-6">
        <div className="grid grid-cols-9 gap-px">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumberInput(num)}
              className={`
                ${lockedNumber === num && lockMode ? theme.button.primary.background : theme.button.secondary.background}
                ${lockedNumber === num && lockMode ? theme.button.primary.hover : theme.button.secondary.hover}
                ${lockedNumber === num && lockMode ? theme.button.primary.text : theme.button.secondary.text}
                ${theme.card.border} 
                border 
                aspect-square p-0 w-full h-full min-h-[48px] md:min-h-[64px]
                transition-all duration-300
              `}
              disabled={!lockMode && (!selectedCell || isComplete)}
              style={{ fontSize: `${digitFontSize}px`, lineHeight: 1 }}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="px-3 md:px-6">
        <div className="grid grid-cols-4 gap-3">
          <Button
            onClick={handleUndo}
            className={`
              ${theme.button.secondary.background} 
              ${theme.button.secondary.hover} 
              ${theme.button.secondary.text} 
              ${theme.card.border} 
              border 
              transition-all duration-300
            `}
            disabled={history.length <= 1 || isComplete}
          >
            <Undo className="w-5 h-5 mr-2" />
            Undo
          </Button>

          <Button
            onClick={() => setNotesMode(!notesMode)}
            className={`
              ${notesMode ? theme.button.primary.background : theme.button.secondary.background} 
              ${notesMode ? theme.button.primary.hover : theme.button.secondary.hover} 
              ${notesMode ? theme.button.primary.text : theme.button.secondary.text} 
              ${theme.card.border} 
              border 
              transition-all duration-300
            `}
            disabled={isComplete}
          >
            <Edit3 className="w-5 h-5 mr-2" />
            Notes
          </Button>

          <Button
            onClick={() => {
              setLockMode(!lockMode);
              if (lockMode) {
                setLockedNumber(null); // Clear locked number when turning off lock mode
              }
            }}
            className={`
              ${lockMode ? theme.button.primary.background : theme.button.secondary.background} 
              ${lockMode ? theme.button.primary.hover : theme.button.secondary.hover} 
              ${lockMode ? theme.button.primary.text : theme.button.secondary.text} 
              ${theme.card.border} 
              border 
              transition-all duration-300
            `}
            disabled={isComplete}
          >
            <Lock className="w-5 h-5 mr-2" />
            Lock
          </Button>

          <Button
            onClick={handleHint}
            className={`
              ${theme.button.secondary.background} 
              ${theme.button.secondary.hover} 
              ${theme.button.secondary.text} 
              ${theme.card.border} 
              border 
              transition-all duration-300
            `}
            disabled={isComplete}
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            Hint
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
    </div>
  );
}