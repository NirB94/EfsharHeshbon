import React, { useState } from 'react';
import Menu from './components/Menu.jsx';
import PuzzleBoard from './components/PuzzleBoard.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [puzzleData, setPuzzleData] = useState(null);

  const handleStartPredefined = () => {
    const board = [
      [9, 3, 3, 9, 2],
      [3, 3, 8, 4, 3],
      [3, 9, 8, 3, 3],
      [5, 3, 2, 4, 2],
      [3, 8, 4, 4, 6]
    ];
    const targetRows = [18, 72, 27, 24, 96];
    const targetCols = [81, 72, 32, 12, 36];
    const operation = '*';

    setPuzzleData({ board, targetRows, targetCols, operation });
    setScreen('board');
  };

  return (
    <div className="App">
      {screen === 'menu' && (
        <Menu onStartPredefined={handleStartPredefined} />
      )}
      {screen === 'board' && puzzleData && (
        <PuzzleBoard
          board={puzzleData.board}
          targetRows={puzzleData.targetRows}
          targetCols={puzzleData.targetCols}
          operation={puzzleData.operation}
          onBack={() => setScreen('menu')}
        />
      )}
    </div>
  );
}
