import React, { useState, useEffect } from 'react';
import Menu from './components/Menu.jsx';
import PuzzleBoard from './components/PuzzleBoard.jsx';
import './MobileAdjustments.css';

/**
 * App Component
 *
 * Main entry point for the puzzle game application.
 * Handles:
 * - Theme toggling (light/dark)
 * - Navigation between screens (menu, operation selection, game board)
 * - Loading puzzle data from backend or predefined example
 */
export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [screen, setScreen] = useState('menu'); // Possible values: 'menu', 'operation', 'board'
  const [puzzleData, setPuzzleData] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Apply theme changes to document body and store preference.
   */
  useEffect(() => {
    document.body.className = dark ? 'dark' : '';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  /**
   * Load a predefined board and switch to game screen.
   */
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

  /**
   * Start a new game by requesting puzzle data from the backend.
   * @param {'+' | '*'} op - Operation to use for puzzle generation.
   */
  const startGame = async (op) => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/new_game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operation: op })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      setPuzzleData({
        board: data.board,
        targetRows: data.target_rows,
        targetCols: data.target_cols,
        operation: data.operation,
      });
      setScreen('board');
    } catch (e) {
      alert('שגיאה בטעינת הלוח');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Return to the main menu and reset puzzle state.
   */
  const handleBack = () => {
    setScreen('menu');
    setPuzzleData(null);
  };

  return (
    <div className="App">
      {/* Theme toggle button */}
      <button
        onClick={() => setDark(prev => !prev)}
        className="theme-toggle"
        aria-label="Toggle Theme"
        title={dark ? 'מצב בהיר' : 'מצב כהה'}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      {/* Main menu screen */}
      {screen === 'menu' && (
        <div className="menu">
          <h1>אפשר חשבון</h1>
          <button onClick={() => setScreen('operation')}>משחק חדש</button>
          <button onClick={handleStartPredefined}>חידה לדוגמה</button>
        </div>
      )}

      {/* Operation selection screen */}
      {screen === 'operation' && !loading && (
        <div className="menu" dir="rtl">
          <h2 dir="rtl">בחר סוג משחק:</h2>
          <button onClick={() => startGame('+')}>חיבור</button>
          <button onClick={() => startGame('*')}>כפל</button>
        </div>
      )}

      {/* Loading screen */}
      {screen === 'operation' && loading && (
        <div className="menu">
          <p>לוח בטעינה...</p>
        </div>
      )}

      {/* Puzzle board screen */}
      {screen === 'board' && puzzleData && (
        <PuzzleBoard
          board={puzzleData.board}
          targetRows={puzzleData.targetRows}
          targetCols={puzzleData.targetCols}
          operation={puzzleData.operation}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
