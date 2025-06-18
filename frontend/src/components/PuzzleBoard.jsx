import React, { useState, useEffect } from 'react';
import './PuzzleBoard.css';

/**
 * PuzzleBoard Component
 *
 * Displays the interactive game board where users select cells
 * to match row and column targets based on a mathematical operation.
 *
 * Props:
 * @param {number[][]} board - A 2D matrix representing the numeric board.
 * @param {number[]} targetRows - Array of target numbers for each row.
 * @param {number[]} targetCols - Array of target numbers for each column.
 * @param {'*' | '+'} operation - The operation to be used ('*' for multiplication or '+' for addition).
 * @param {Function} onBack - Callback function to return to the main menu.
 * @param {string} difficulty - The difficulty level of the puzzle.
 * @param {Function} onNewGame - Callback function to start a new game.
 * @param {Function} onBackToMenu - Callback function to return to the main menu from the modal.
 */
export default function PuzzleBoard({ board, targetRows, targetCols, operation, onBack, difficulty, onNewGame, onBackToMenu }) {
  const [userGrid, setUserGrid] = useState(board.map(row => row.map(() => 0)));
  const [solutionGrid, setSolutionGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [moves, setMoves] = useState(0);
  const [markingForbidden, setMarkingForbidden] = useState(false);
  const [forbiddenGrid, setForbiddenGrid] = useState(board.map(row => row.map(() => false)));
  const [manualSolve, setManualSolve] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [allSolutions, setAllSolutions] = useState([]);
  const [badCells, setBadCells] = useState([]);
  const [autoMarkedCells, setAutoMarkedCells] = useState([]);
  const [autoClearedCells, setAutoClearedCells] = useState([]);
  const [solutionShown, setSolutionShown] = useState(false);
  const [solutionEverShown, setSolutionEverShown] = useState(false);
  const [showRemainders, setShowRemainders] = useState(false);

  /**
   * Get the appropriate backend URL based on environment
   */
  const getBackendUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://127.0.0.1:8000'
      : 'https://efsharheshbon.onrender.com';
  };

  /**
   * Toggle a cell between selected/forbidden based on the current mode.
   */
  const toggleCell = (i, j) => {
    if (markingForbidden) {
      setForbiddenGrid(prev =>
        prev.map((row, rowIndex) =>
          rowIndex === i
            ? row.map((val, colIndex) => (colIndex === j ? !val : val))
            : row
        )
      );
    } else {
      if (forbiddenGrid[i][j]) return;
      setUserGrid(prev =>
        prev.map((row, rowIndex) =>
          rowIndex === i
            ? row.map((val, colIndex) => (colIndex === j ? 1 - val : val))
            : row
        )
      );
      setMoves(prev => prev + 1);
    }
  };

  /**
   * Check if row i exactly matches its target.
   */
  const isRowActive = (i) => {
    const values = board[i].filter((_, j) => userGrid[i][j] === 1);
    if (values.length === 0) return false;
    const result = operation === '*'
      ? values.reduce((a, b) => a * b, 1)
      : values.reduce((a, b) => a + b, 0);
    return result === targetRows[i];
  };

  /**
   * Check if column j exactly matches its target.
   */
  const isColActive = (j) => {
    const values = board.map((row, i) => userGrid[i][j] === 1 ? row[j] : null).filter(v => v !== null);
    if (values.length === 0) return false;
    const result = operation === '*'
      ? values.reduce((a, b) => a * b, 1)
      : values.reduce((a, b) => a + b, 0);
    return result === targetCols[j];
  };

  /**
   * Check if row i exceeds its target.
   */
  const isRowOver = (i) => {
    const values = board[i].filter((_, j) => userGrid[i][j] === 1);
    if (values.length === 0) return false;
    const result = operation === '*'
      ? values.reduce((a, b) => a * b, 1)
      : values.reduce((a, b) => a + b, 0);
    return result > targetRows[i];
  };

  /**
   * Check if column j exceeds its target.
   */
  const isColOver = (j) => {
    const values = board.map((row, i) => userGrid[i][j] === 1 ? row[j] : null).filter(v => v !== null);
    if (values.length === 0) return false;
    const result = operation === '*'
      ? values.reduce((a, b) => a * b, 1)
      : values.reduce((a, b) => a + b, 0);
    return result > targetCols[j];
  };

  /**
   * Clear current selections and forbidden cells.
   */
  const clearSelection = () => {
    setUserGrid(board.map(row => row.map(() => 0)));
    setForbiddenGrid(board.map(row => row.map(() => false)));
    setMessage('');
    setManualSolve(true);
    setShowModal(false);
  };
  
  /**
   * Provide a hint by either marking a bad cell or suggesting a correct move.
   */
  const handleHint = () => {
    const markedCells = [];
    userGrid.forEach((row, i) =>
      row.forEach((val, j) => {
        if (val === 1) markedCells.push(`${i},${j}`);
      })
    );

    const matchedSolutions = allSolutions.filter(sol => {
      const solSet = new Set();
      sol.forEach((row, i) =>
        row.forEach((val, j) => {
          if (val === 1) solSet.add(`${i},${j}`);
        })
      );
      return markedCells.every(cell => solSet.has(cell));
    });

    if (markedCells.length > 0) {
      const badCell = markedCells.find(cell => {
        const [i, j] = cell.split(',').map(Number);
        return !allSolutions.some(sol => sol[i][j] === 1);
      });

      if (badCell) {
        const [i, j] = badCell.split(',').map(Number);
        setBadCells([[i, j]]);

        setTimeout(() => {
          setBadCells([]);
          setForbiddenGrid(prev =>
            prev.map((row, rowIdx) =>
              row.map((val, colIdx) =>
                rowIdx === i && colIdx === j ? true : val
              )
            )
          );
          setUserGrid(prev =>
            prev.map((row, rowIdx) =>
              row.map((val, colIdx) =>
                rowIdx === i && colIdx === j ? 0 : val
              )
            )
          );
        }, 1000);

        return;
      }
    }

    let best = null;
    let bestScore = -1;
    let bestMarkedCount = Infinity;

    allSolutions.forEach(sol => {
      const solSet = new Set();
      let markedCount = 0;
      let overlap = 0;

      sol.forEach((row, i) =>
        row.forEach((val, j) => {
          if (val === 1) {
            markedCount++;
            if (userGrid[i][j] === 1) overlap++;
          }
        })
      );

      if (
        overlap > bestScore ||
        (overlap === bestScore && markedCount < bestMarkedCount)
      ) {
        bestScore = overlap;
        bestMarkedCount = markedCount;
        best = sol;
      }
    });

    if (!best) return;

    for (let i = 0; i < best.length; i++) {
      for (let j = 0; j < best[0].length; j++) {
        if (best[i][j] === 1 && userGrid[i][j] === 0 && !forbiddenGrid[i][j]) {
          const updated = userGrid.map((row, rowIndex) =>
            rowIndex === i
              ? row.map((val, colIndex) => (colIndex === j ? 1 : val))
              : row
          );
          setUserGrid(updated);
          setMoves(prev => prev + 2);
          return;
        }
      }
    }
  };

  /**
   * Reset all game state and fetch solution when a new board is loaded
   */
  useEffect(() => {
    // Reset all game state
    setUserGrid(board.map(row => row.map(() => 0)));
    setForbiddenGrid(board.map(row => row.map(() => false)));
    setMoves(0);
    setMessage('');
    setManualSolve(true);
    setShowModal(false);
    setBadCells([]);
    setAutoMarkedCells([]);
    setAutoClearedCells([]);
    setSolutionShown(false);
    setSolutionEverShown(false);
    setMarkingForbidden(false);
    setLoading(true);

    // Fetch solution
    const fetchSolution = async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board,
            target_rows: targetRows,
            target_cols: targetCols,
            operation
          })
        });
        const data = await res.json();
        setSolutionGrid(data.solution);
        setAllSolutions(data.all_solutions || []);
      } catch (err) {
        console.error('שגיאה בעת שליחת הבקשה לשרת:', err);
        
        // פתרון זמני - יצירת פתרון דמה כדי לבדוק שהמודאל עובד
        console.log('יוצר פתרון זמני לבדיקה...');
        const dummySolution = board.map((row, i) => 
          row.map((val, j) => (i === 0 && j < 2) || (i === 1 && j === 0) ? 1 : 0)
        );
        setSolutionGrid(dummySolution);
        setAllSolutions([dummySolution]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolution();
  }, [board, targetRows, targetCols, operation]);

  /**
   * Automatically validate the current board against all possible solutions.
   */
  useEffect(() => {
    if (!allSolutions || allSolutions.length === 0 || !manualSolve) return;
    
    // Check if current user solution matches any of the valid solutions
    const isValidSolution = allSolutions.some(solution => 
      userGrid.every((row, i) =>
        row.every((val, j) => val === solution[i][j])
      )
    );
    
    // Debug logging - remove this later
    console.log('Checking solution:', {
      allSolutions: allSolutions.length,
      manualSolve,
      isValidSolution,
      userGrid
    });
    
    if (isValidSolution) {
      console.log('Valid solution found! Opening modal...');
      setShowModal(true);
    }
  }, [userGrid, allSolutions, manualSolve]);

  /**
   * Check if the current solution is complete and correct (matches any valid solution)
   */
  const solved = allSolutions && allSolutions.length > 0 ? allSolutions.some(solution =>
    userGrid.every((row, i) =>
      row.every((val, j) => val === solution[i][j])
    )
  ) : false;

  // Debug logging for solved state
  console.log('Solved state:', { solved, allSolutionsCount: allSolutions?.length });

  /**
   * Get the numerical difference from target for a given row.
   */
  const getRowStatus = (i) => {
    const values = board[i].filter((_, j) => userGrid[i][j] === 1);
    if (values.length === 0) return null;
    const result = operation === '*'
      ? values.reduce((a, b) => a * b, 1)
      : values.reduce((a, b) => a + b, 0);
    return operation === '*'
      ? (targetRows[i] / result).toFixed(Number.isInteger(targetRows[i] / result) ? 0 : 2)
      : targetRows[i] - result;
  };

  /**
   * Get the numerical difference from target for a given column.
   */
  const getColStatus = (j) => {
    const values = board.map((row, i) => userGrid[i][j] === 1 ? row[j] : null).filter(v => v !== null);
    if (values.length === 0) return null;
    const result = operation === '*'
      ? values.reduce((a, b) => a * b, 1)
      : values.reduce((a, b) => a + b, 0);
    return operation === '*'
      ? (targetCols[j] / result).toFixed(Number.isInteger(targetCols[j] / result) ? 0 : 2)
      : targetCols[j] - result;
  };

  /**
   * Automatically fill the board with the correct solution.
   */
  const showSolution = () => {
  if (!solutionGrid) return;

  // ביטול הפתרון: החזרת המצב לקדמותו
  if (autoMarkedCells.length > 0 || autoClearedCells.length > 0) {
    const restoredGrid = userGrid.map((row, i) =>
      row.map((val, j) => {
        if (autoMarkedCells.some(([x, y]) => x === i && y === j)) return 0;
        if (autoClearedCells.some(([x, y]) => x === i && y === j)) return 1;
        return val;
      })
    );
    setUserGrid(restoredGrid);
    setAutoMarkedCells([]);
    setAutoClearedCells([]);
    setMessage('');
    setSolutionShown(false);
    return;
  }

  // סימון הפתרון: הוספת החסרים והסרת שגויים
  const newAutoMarked = [];
  const newAutoCleared = [];

  const updated = userGrid.map((row, i) =>
    row.map((val, j) => {
      const shouldBeMarked = solutionGrid[i][j] === 1;
      const isMarked = val === 1;

      if (shouldBeMarked && !isMarked && !forbiddenGrid[i][j]) {
        newAutoMarked.push([i, j]);
        return 1;
      }

      if (!shouldBeMarked && isMarked) {
        newAutoCleared.push([i, j]);
        return 0;
      }

      return val;
    })
  );

  setUserGrid(updated);
  setAutoMarkedCells(newAutoMarked);
  setAutoClearedCells(newAutoCleared);
  setManualSolve(false);
  setMessage('📌 הפתרון סומן על הלוח.');
  setSolutionShown(true);
  setSolutionEverShown(true);
};

  /**
   * Calculate the minimal number of moves in the solution.
   */
  const getMinimalSteps = () => {
    if (!solutionGrid) return null;
    return solutionGrid.flat().filter(v => v === 1).length;
  };

  const operationLabel = operation === '*' ? 'כפל' : 'חיבור';
  const difficultyLabel = difficulty === 'easy' ? 'קל' : difficulty === 'medium' ? 'בינוני' : 'קשה';
  
  const getSuccessMessage = () => {
    // Check if the current solution is the minimal one
    const isMinimalSolution = solutionGrid && userGrid.every((row, i) =>
      row.every((val, j) => val === solutionGrid[i][j])
    );
    
    const baseMessage = isMinimalSolution
      ? `פתרת את החידה, ועשית זאת עם מספר הצעדים המינימלי! 🧠`
      : `פתרת את החידה בהצלחה תוך ${moves} צעדים!`;
    
    return { baseMessage };
  };

  /**
   * Handle new game from modal - close modal first then start new game
   */
  const handleNewGameFromModal = () => {
    setShowModal(false);
    onNewGame();
  };

  if (loading) return <p>טוען את הלוח...</p>;
  if (!solutionGrid) return <p>שגיאה: לא ניתן לחשב את הפתרון.</p>;

  return (
    <div className="puzzle-container" dir="rtl">
      <button className="back-button" onClick={onBack}>
        →
      </button>
      
      {/* כפתור השאריות */}
      <button
        className={`remainder-toggle-button-top ${showRemainders ? 'active' : ''}`}
        onClick={() => setShowRemainders(!showRemainders)}
        title={showRemainders ? "הסתר שאריות" : "הצג שאריות"}
      >
        (1)
      </button>
      
      <div className="puzzle-header">
        <div className="header-center">
          <h1>פעולה: {operation === '*' ? 'כפל' : 'חיבור'}</h1>
        </div>
      </div>

      <div className={`puzzle-grid ${showModal ? 'blurred' : ''}`}>
        {/* כאן מופיע הלוח עצמו */}
        {board.map((row, i) => (
          <div key={i} className="row">
            {row.map((val, j) => (
              <button
                key={j}
                className={`cell ${
                  forbiddenGrid[i][j]
                    ? 'forbidden'
                    : badCells.some(([bi, bj]) => bi === i && bj === j)
                    ? 'bad'
                    : userGrid[i][j]
                    ? 'marked'
                    : ''
                }`}
                onClick={() => toggleCell(i, j)}
              >
                {val}
              </button>
            ))}
            <div
              className={`target row-target ${
                isRowActive(i) ? 'active' : isRowOver(i) ? 'error' : 'inactive'
              } ${!isRowActive(i) && getRowStatus(i) !== null && !isRowOver(i) && showRemainders ? 'compact' : ''}`}
            >
              <div>{targetRows[i]}</div>
              {!isRowActive(i) && !isRowOver(i) && getRowStatus(i) !== null && showRemainders && (
                <div className="target-hint">({getRowStatus(i)})</div>
              )}
            </div>
          </div>
        ))}
        <div className="row">
          {targetCols.map((target, j) => (
            <div
              key={`col-${j}`}
              className={`target col-target ${
                isColActive(j) ? 'active' : isColOver(j) ? 'error' : 'inactive'
              } ${!isColActive(j) && getColStatus(j) !== null && !isColOver(j) && showRemainders ? 'compact' : ''}`}
            >
              <div>{targetCols[j]}</div>
              {!isColActive(j) && !isColOver(j) && getColStatus(j) !== null && showRemainders && (
                <div className="target-hint">({getColStatus(j)})</div>
              )}
            </div>
          ))}
          <div className="corner" />
        </div>
      </div>

      <div className="game-info">
        <div className={`difficulty-indicator difficulty-${difficulty}`}>
          רמת קושי: {difficulty === 'easy' ? 'קל' : difficulty === 'medium' ? 'בינוני' : 'קשה'}
        </div>

      </div>

      {/* ✅ כאן מתחיל הצד השמאלי במצב landscape */}
      <div className="side-panel">
        <div className="side-top">
          <p style={{ fontWeight: 'bold' }}>
            צעדים: {moves}
          </p>
          <p className="minimal-steps">
            אפשר לפתור את הלוח ב־{getMinimalSteps()} צעדים
          </p>
          {allSolutions.length > 1 && (
            <p className="solutions-count">
              {allSolutions.length} פתרונות אפשריים
            </p>
          )}

          <div className="toggle-switch">
            <label className="switch">
              <input
                type="checkbox"
                checked={markingForbidden}
                onChange={() => setMarkingForbidden(prev => !prev)}
              />
              <span className="slider" />
            </label>
            <span className="toggle-label">
              {markingForbidden ? '🚫 סימון אסור' : '✅ מצב רגיל'}
            </span>
          </div>
        </div>

        <div className="side-buttons">
          <div className="controls">
                      <div className="main-controls">
            <button onClick={clearSelection}>נקה בחירה</button>
            <button onClick={handleHint}>💡 רמז</button>
          </div>
            <div className="solution-button-wrapper">
              <button className="solution-button" onClick={showSolution}>
                {solutionShown ? 'הסתר פתרון' : 'הצג פתרון'}
              </button>
            </div>
          </div>

          {solutionEverShown && (
            <p className="message" style={{ marginTop: '12px' }}>
              📌 הפתרון סומן על הלוח.
            </p>
          )}
        </div>
      </div>

      {/* מודאל סיום */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <h2>פתרון!</h2>
            {(() => {
              const { baseMessage } = getSuccessMessage();
              const isMinimalSolution = solutionGrid && userGrid.every((row, i) =>
                row.every((val, j) => val === solutionGrid[i][j])
              );
              return (
                <>
                  <p>{baseMessage}</p>
                  {!isMinimalSolution && (
                    <p style={{ fontSize: '13px', marginTop: '8px', color: '#666' }}>
                      מספר הצעדים המינימלי: <strong>{getMinimalSteps()}</strong>
                    </p>
                  )}
                  <div className="modal-buttons">
                    <button className="modal-button" onClick={handleNewGameFromModal}>
                      משחק חדש
                    </button>
                    <button className="modal-button secondary" onClick={onBackToMenu}>
                      תפריט ראשי
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
