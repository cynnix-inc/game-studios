import { useState, useEffect } from 'react';
import { X, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

interface TicTacToeProps {
  onWin?: () => void;
}

type Player = 'X' | 'O' | null;

export function TicTacToe({ onWin }: TicTacToeProps) {
  const { theme } = useTheme();
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  const checkWinner = (squares: Player[]): Player | null => {
    for (const [a, b, c] of winningCombinations) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  useEffect(() => {
    const gameWinner = checkWinner(board);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner === 'X' && onWin) {
        onWin();
      }
    } else if (board.every(cell => cell !== null)) {
      setWinner('Draw');
    }
  }, [board]);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const renderCell = (index: number) => {
    const value = board[index];
    return (
      <button
        onClick={() => handleClick(index)}
        className={`w-full aspect-square ${theme.button.secondary.background} ${theme.button.secondary.hover} backdrop-blur-xl border-2 ${theme.card.border} rounded-2xl transition-all duration-300 flex items-center justify-center group disabled:cursor-not-allowed`}
        disabled={!!winner || !!value}
      >
        {value === 'X' && (
          <X className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-purple-400 stroke-[3]" />
        )}
        {value === 'O' && (
          <Circle className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-pink-400 stroke-[3]" />
        )}
        {!value && !winner && (
          <div className="opacity-0 group-hover:opacity-30 transition-opacity">
            {isXNext ? (
              <X className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 ${theme.text.primary}`} />
            ) : (
              <Circle className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 ${theme.text.primary}`} />
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 px-4">
      {/* Game Status */}
      <div className="text-center">
        {winner ? (
          <div className="space-y-2">
            <h2 className={`text-2xl md:text-4xl ${theme.text.primary}`}>
              {winner === 'Draw' ? "It's a Draw!" : `Player ${winner} Wins!`}
            </h2>
            {winner === 'X' && (
              <p className="text-lg text-green-400">+100 points!</p>
            )}
          </div>
        ) : (
          <h2 className={`text-xl md:text-2xl ${theme.text.primary}`}>
            Current Turn:{' '}
            <span className={isXNext ? 'text-purple-400' : 'text-pink-400'}>
              Player {isXNext ? 'X' : 'O'}
            </span>
          </h2>
        )}
      </div>

      {/* Game Board - Glass tile styling for puzzle game */}
      <div className={`${theme.card.background} ${theme.card.border} border rounded-3xl p-4 md:p-8 shadow-xl`}>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {board.map((_, index) => (
            <div key={index}>
              {renderCell(index)}
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      {winner && (
        <div className="text-center">
          <Button
            onClick={resetGame}
            className={`${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text} px-8`}
          >
            Play Again
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className={`text-center text-sm ${theme.text.muted}`}>
        <p>Tic-Tac-Toe Placeholder Game</p>
        <p className="text-xs mt-1">Replace this with your actual game!</p>
      </div>
    </div>
  );
}