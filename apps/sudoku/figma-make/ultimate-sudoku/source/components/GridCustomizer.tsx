import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { Sudoku } from './Sudoku';

interface GridCustomizerProps {
  initialSettings: {
    gridSize: number;
    digitSize: number;
    noteSize: number;
    highlightContrast: number;
    highlightAssistance: boolean;
  };
  onSave: (settings: {
    gridSize: number;
    digitSize: number;
    noteSize: number;
    highlightContrast: number;
    highlightAssistance: boolean;
  }) => void;
  onCancel: () => void;
}

type GridSizeOption = 'S' | 'M' | 'L' | 'XL';
type DigitSizeOption = 'XS' | 'S' | 'M' | 'L' | 'XL';
type NoteSizeOption = 'XS' | 'S' | 'M' | 'L' | 'XL';
type ContrastOption = 'Off' | 'Normal' | 'High' | 'Max';

type Cell = {
  value: number;
  isFixed: boolean;
  notes: number[];
};

// Mapping functions
const gridSizeToNumber = (size: GridSizeOption): number => {
  const map: Record<GridSizeOption, number> = { S: 80, M: 100, L: 120, XL: 140 };
  return map[size];
};

const numberToGridSize = (num: number): GridSizeOption => {
  if (num <= 85) return 'S';
  if (num <= 110) return 'M';
  if (num <= 130) return 'L';
  return 'XL';
};

const digitSizeToNumber = (size: DigitSizeOption): number => {
  const map: Record<DigitSizeOption, number> = { XS: 70, S: 85, M: 100, L: 130, XL: 170 };
  return map[size];
};

const numberToDigitSize = (num: number): DigitSizeOption => {
  if (num <= 75) return 'XS';
  if (num <= 90) return 'S';
  if (num <= 115) return 'M';
  if (num <= 150) return 'L';
  return 'XL';
};

const noteSizeToNumber = (size: NoteSizeOption): number => {
  const map: Record<NoteSizeOption, number> = { XS: 120, S: 160, M: 200, L: 250, XL: 300 };
  return map[size];
};

const numberToNoteSize = (num: number): NoteSizeOption => {
  if (num <= 140) return 'XS';
  if (num <= 180) return 'S';
  if (num <= 225) return 'M';
  if (num <= 275) return 'L';
  return 'XL';
};

const contrastToNumber = (contrast: ContrastOption): number => {
  const map: Record<ContrastOption, number> = { Off: 0, Normal: 100, High: 150, Max: 200 };
  return map[contrast];
};

const numberToContrast = (num: number): ContrastOption => {
  if (num <= 25) return 'Off';
  if (num <= 125) return 'Normal';
  if (num <= 175) return 'High';
  return 'Max';
};

export function GridCustomizer({ initialSettings, onSave, onCancel }: GridCustomizerProps) {
  const { theme } = useTheme();
  
  // Convert initial numeric settings to string options
  const [gridSize, setGridSize] = useState<GridSizeOption>(numberToGridSize(initialSettings.gridSize));
  const [digitSize, setDigitSize] = useState<DigitSizeOption>(numberToDigitSize(initialSettings.digitSize));
  const [noteSize, setNoteSize] = useState<NoteSizeOption>(numberToNoteSize(initialSettings.noteSize));
  const [contrast, setContrast] = useState<ContrastOption>(numberToContrast(initialSettings.highlightContrast));
  
  // Position state for draggable modal
  const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault(); // Prevent text selection
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault(); // Prevent text selection
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add/remove drag listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleSave = () => {
    // Convert string options back to numbers
    const numericSettings = {
      gridSize: gridSizeToNumber(gridSize),
      digitSize: digitSizeToNumber(digitSize),
      noteSize: noteSizeToNumber(noteSize),
      highlightContrast: contrastToNumber(contrast),
      highlightAssistance: contrast !== 'Off', // Highlight assistance is on unless contrast is Off
    };
    onSave(numericSettings);
  };

  // Sample board for preview
  const sampleBoard: Cell[][] = [
    [
      { value: 5, isFixed: true, notes: [] },
      { value: 3, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [4, 7] },
      { value: 0, isFixed: false, notes: [] },
      { value: 7, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [1, 2] },
      { value: 0, isFixed: false, notes: [] },
    ],
    [
      { value: 6, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [2, 4] },
      { value: 3, isFixed: true, notes: [] },
      { value: 9, isFixed: false, notes: [] },
      { value: 5, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 3, isFixed: false, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [1, 8] },
      { value: 9, isFixed: true, notes: [] },
      { value: 8, isFixed: false, notes: [] },
      { value: 4, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [5, 6] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [1, 2] },
      { value: 0, isFixed: false, notes: [] },
      { value: 7, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 1, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 2, isFixed: false, notes: [] },
      { value: 3, isFixed: true, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [1, 2] },
      { value: 0, isFixed: false, notes: [3, 6, 7] },
      { value: 5, isFixed: false, notes: [] },
      { value: 2, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 6, isFixed: true, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 1, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [4, 8] },
      { value: 3, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [2, 6] },
      { value: 0, isFixed: false, notes: [] },
      { value: 9, isFixed: true, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [2, 5] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 3, isFixed: true, notes: [] },
      { value: 2, isFixed: false, notes: [] },
      { value: 4, isFixed: false, notes: [] },
      { value: 7, isFixed: false, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [] },
      { value: 4, isFixed: false, notes: [] },
      { value: 3, isFixed: true, notes: [] },
      { value: 9, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 7, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [1, 6] },
      { value: 8, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
    ],
    [
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [5, 8] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 0, isFixed: false, notes: [] },
      { value: 6, isFixed: true, notes: [] },
      { value: 3, isFixed: true, notes: [] },
      { value: 9, isFixed: true, notes: [] },
      { value: 0, isFixed: false, notes: [] },
    ],
  ];

  const selectedCell = { row: 4, col: 3 };

  // Custom slider component with discrete snap points
  const DiscreteSlider = ({ 
    label,
    options,
    value,
    onChange 
  }: { 
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
  }) => {
    const currentIndex = options.indexOf(value);
    const percentage = (currentIndex / (options.length - 1)) * 100;
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isSliding, setIsSliding] = useState(false);
    
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsSliding(true);
    };
    
    useEffect(() => {
      if (!isSliding) return;
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!sliderRef.current) return;
        
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const index = Math.round((clickPercentage / 100) * (options.length - 1));
        onChange(options[index]);
      };
      
      const handleMouseUp = () => {
        setIsSliding(false);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isSliding, options, onChange]);
    
    const handleTrackClick = (e: React.MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const index = Math.round((clickPercentage / 100) * (options.length - 1));
      onChange(options[index]);
    };
    
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className={`text-sm ${theme.text.secondary}`}>{label}</label>
          <span className={`text-sm ${theme.text.primary} px-2.5 py-0.5 rounded-lg ${theme.card.border} border`}>
            {value}
          </span>
        </div>
        <div className="relative pt-1 pb-1">
          {/* Track - Interactive */}
          <div 
            ref={sliderRef}
            onClick={handleTrackClick}
            className={`h-2 rounded-full ${theme.card.border} border overflow-hidden cursor-pointer select-none`}
          >
            {/* Fill */}
            <div 
              className={`h-full ${theme.button.primary.background} transition-all duration-150 pointer-events-none`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {/* Snap points */}
          <div className="absolute top-1 left-0 right-0 flex justify-between items-center h-2 pointer-events-none">
            {options.map((_, index) => (
              <div 
                key={index}
                className={`w-1 h-1 rounded-full transition-all duration-150 ${
                  index <= currentIndex 
                    ? `${theme.button.primary.text} scale-125` 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          
          {/* Thumb/Handle - Draggable */}
          <div 
            className="absolute top-0 h-4 transition-all duration-150"
            style={{ left: `calc(${percentage}% - 10px)` }}
          >
            <div 
              onMouseDown={handleMouseDown}
              className={`w-5 h-5 rounded-full ${theme.button.primary.background} shadow-lg border-2 ${theme.button.primary.text} cursor-grab active:cursor-grabbing`}
            />
          </div>
          
          {/* Option labels */}
          <div className="flex justify-between mt-2 px-1">
            {options.map((option, index) => (
              <button
                key={option}
                onClick={() => onChange(option)}
                className={`text-xs transition-all duration-200 ${
                  index === currentIndex
                    ? theme.text.primary
                    : theme.text.muted
                } hover:${theme.text.secondary}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Get current numeric settings for preview
  const currentSettings = {
    gridSize: gridSizeToNumber(gridSize),
    digitSize: digitSizeToNumber(digitSize),
    noteSize: noteSizeToNumber(noteSize),
    highlightContrast: contrastToNumber(contrast),
    highlightAssistance: contrast !== 'Off',
  };

  return (
    <div className="fixed inset-0 z-[200]" style={{ userSelect: isDragging ? 'none' : 'auto' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      
      {/* Full-width preview board */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Sudoku
          difficulty="skilled"
          mode="play"
          previewMode={true}
          initialBoard={sampleBoard}
          previewSettings={currentSettings}
          previewSelectedCell={selectedCell}
        />
      </div>

      {/* Floating draggable control panel */}
      <div
        ref={modalRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        className={`w-80 ${theme.card.background} ${theme.card.border} border backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden pointer-events-auto`}
      >
        {/* Drag handle header */}
        <div className={`drag-handle flex items-center justify-between px-4 py-3 ${theme.card.border} border-b cursor-grab active:cursor-grabbing`}>
          <div className="flex items-center gap-2">
            <GripVertical className={`w-4 h-4 ${theme.text.muted}`} />
            <span className={`text-sm ${theme.text.primary}`}>Grid Settings</span>
          </div>
          <button
            onClick={onCancel}
            className={`${theme.text.muted} hover:${theme.text.primary} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Grid Size */}
          <DiscreteSlider
            label="Grid Size"
            options={['S', 'M', 'L', 'XL']}
            value={gridSize}
            onChange={setGridSize}
          />

          {/* Digit Size */}
          <DiscreteSlider
            label="Digit Size"
            options={['XS', 'S', 'M', 'L', 'XL']}
            value={digitSize}
            onChange={setDigitSize}
          />

          {/* Note Size */}
          <DiscreteSlider
            label="Note Size"
            options={['XS', 'S', 'M', 'L', 'XL']}
            value={noteSize}
            onChange={setNoteSize}
          />

          {/* Highlight Contrast */}
          <DiscreteSlider
            label="Highlight"
            options={['Off', 'Normal', 'High', 'Max']}
            value={contrast}
            onChange={setContrast}
          />
        </div>

        {/* Footer with Save button */}
        <div className={`px-4 py-3 ${theme.card.border} border-t`}>
          <Button
            onClick={handleSave}
            className={`w-full ${theme.button.primary.background} ${theme.button.primary.hover} ${theme.button.primary.text}`}
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Settings
          </Button>
        </div>
      </div>
    </div>
  );
}