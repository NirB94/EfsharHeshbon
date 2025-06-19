import React, { useState, useEffect } from 'react';
import Menu from './components/Menu.jsx';
import PuzzleBoard from './components/PuzzleBoard.jsx';
import ManualInput from './components/ManualInput.jsx';
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

  const [screen, setScreen] = useState('menu'); // Possible values: 'menu', 'operation', 'difficulty', 'board', 'manual'
  const [puzzleData, setPuzzleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);

  /**
   * Get the appropriate backend URL based on environment
   */
  const getBackendUrl = () => {
    // Use localhost for development, production URL for deployment
    return window.location.hostname === 'localhost' 
      ? 'http://127.0.0.1:8000'
      : 'https://efsharheshbon.onrender.com';
  };

  /**
   * Apply theme changes to document body and store preference.
   */
  useEffect(() => {
    document.body.className = dark ? 'dark' : '';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  /**
   * Handle manual input selection
   */
  const handleManualInput = () => {
    setScreen('manual');
  };

  /**
   * Handle manual puzzle solve result
   */
  const handleManualSolve = (data) => {
    setPuzzleData({
      board: data.board,
      targetRows: data.targetRows,
      targetCols: data.targetCols,
      operation: data.operation,
      solution: data.solution,
      markedCount: data.markedCount,
      totalSolutions: data.totalSolutions,
      solutionStats: data.solutionStats,
      isManual: true,
      fromManualInput: data.fromManualInput || false
    });
    setScreen('board');
  };

  /**
   * Start a new game by requesting puzzle data from the backend.
   * @param {'+' | '*'} op - Operation to use for puzzle generation.
   * @param {'easy' | 'medium' | 'hard'} difficulty - Difficulty level.
   */
  const startGame = async (op, difficulty = 'medium') => {
    setLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/new_game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operation: op, difficulty: difficulty })
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
        difficulty: data.difficulty
      });
      setScreen('board');
    } catch (e) {
      alert('שגיאה בטעינת הלוח');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle operation selection and move to difficulty selection
   */
  const handleOperationSelect = (operation) => {
    setSelectedOperation(operation);
    setScreen('difficulty');
  };

  /**
   * Handle difficulty selection and start the game
   */
  const handleDifficultySelect = (difficulty) => {
    startGame(selectedOperation, difficulty);
  };

  /**
   * Return to the main menu and reset puzzle state.
   */
  const handleBack = () => {
    setScreen('menu');
    setPuzzleData(null);
  };

  /**
   * Start a new game with the same operation and difficulty
   */
  const handleNewGame = () => {
    if (puzzleData) {
      setLoading(true);
      startGame(puzzleData.operation, puzzleData.difficulty);
    }
  };

  /**
   * Go back to main menu from game
   */
  const handleBackToMenu = () => {
    setScreen('menu');
    setPuzzleData(null);
  };

  /**
   * Go back to manual input from puzzle board
   */
  const handleBackToManualInput = () => {
    setScreen('manual');
    // Keep puzzle data for returning to the same state - it will be passed to ManualInput
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
          <button onClick={handleManualInput}>הכנסה ידנית</button>
        </div>
      )}

      {/* Operation selection screen */}
      {screen === 'operation' && !loading && (
        <div className="menu operation-menu" dir="rtl">
          <button
            className="back-button"
            onClick={() => setScreen('menu')}
            title="חזרה לתפריט הראשי"
          >
            →{/* אותו חץ */}
          </button>
          <h2 dir="rtl">בחר סוג משחק:</h2>
          <div className="operation-selector">
            <button onClick={() => handleOperationSelect('+')}>חיבור</button>
            <button onClick={() => handleOperationSelect('*')}>כפל</button>
          </div>
        </div>
      )}

      {/* Loading screen */}
      {(screen === 'operation' || screen === 'difficulty') && loading && (
        <div className="menu">
          <p>לוח בטעינה...</p>
        </div>
      )}

      {/* Difficulty selection screen */}
      {screen === 'difficulty' && !loading && (
        <div className="menu difficulty-menu" dir="rtl">
          <button
            className="back-button"
            onClick={() => setScreen('operation')}
            title="חזרה לבחירת סוג משחק"
          >
            →{/* אותו חץ */}
          </button>
          <h2 dir="rtl">בחר רמת קושי:</h2>
          <div className="difficulty-options">
            <div className="difficulty-option">
              <button onClick={() => handleDifficultySelect('easy')}>קל</button>
            </div>
            <div className="difficulty-option">
              <button onClick={() => handleDifficultySelect('medium')}>בינוני</button>
            </div>
            <div className="difficulty-option">
              <button onClick={() => handleDifficultySelect('hard')}>קשה</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual input screen */}
      {screen === 'manual' && (
        <ManualInput
          onBack={() => setScreen('menu')}
          onSolve={handleManualSolve}
          existingPuzzleData={puzzleData}
        />
      )}

      {/* Puzzle board screen */}
      {screen === 'board' && puzzleData && (
        <PuzzleBoard
          board={puzzleData.board}
          targetRows={puzzleData.targetRows}
          targetCols={puzzleData.targetCols}
          operation={puzzleData.operation}
          difficulty={puzzleData.difficulty || 'medium'}
          solution={puzzleData.solution}
          isManual={puzzleData.isManual}
          fromManualInput={puzzleData.fromManualInput}
          onBack={puzzleData.fromManualInput ? handleBackToManualInput : handleBack}
          onNewGame={handleNewGame}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
