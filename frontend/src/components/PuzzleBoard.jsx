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
 */
export default function PuzzleBoard({ board, targetRows, targetCols, operation, onBack }) {
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
          setMoves(prev => prev + 1);
          return;
        }
      }
    }
  };

    /**
   * Fetch the correct solution(s) from the server.
   */
  useEffect(() => {
    const fetchSolution = async () => {
      try {
        const res = await fetch('http://localhost:8000/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ board, target_rows: targetRows, target_cols: targetCols, operation })
        });
        const data = await res.json();
        setSolutionGrid(data.solution);
        setAllSolutions(data.all_solutions || []);
      } catch (err) {
        console.error('שגיאה בעת שליחת הבקשה לשרת:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSolution();
    setMoves(0);
  }, [board, targetRows, targetCols, operation]);

  /**
   * Automatically validate the current board against the solution.
   */
  useEffect(() => {
    if (!solutionGrid || !manualSolve) return;
    const solved = userGrid.every((row, i) =>
      row.every((val, j) => val === solutionGrid[i][j])
    );
    if (solved) setShowModal(true);
  }, [userGrid, solutionGrid, manualSolve]);

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
    setUserGrid(solutionGrid);
    setManualSolve(false);
    setMessage('📌 הפתרון סומן על הלוח.');
  };

  /**
   * Calculate the minimal number of moves in the solution.
   */
  const getMinimalSteps = () => {
    if (!solutionGrid) return null;
    return solutionGrid.flat().filter(v => v === 1).length;
  };

  const operationLabel = operation === '*' ? 'כפל' : 'חיבור';

  if (loading) return <p>טוען את הלוח...</p>;
  if (!solutionGrid) return <p>שגיאה: לא ניתן לחשב את הפתרון.</p>;

  return (
    <div className="puzzle-container" dir="rtl">
      <button className="back-button" onClick={onBack} title="חזרה לתפריט הראשי">→</button>
      <h2>פעולה: {operationLabel}</h2>

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
              } ${!isRowActive(i) && getRowStatus(i) !== null && !isRowOver(i) ? 'compact' : ''}`}
            >
              <div>{targetRows[i]}</div>
              {!isRowActive(i) && !isRowOver(i) && getRowStatus(i) !== null && (
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
              } ${!isColActive(j) && getColStatus(j) !== null && !isColOver(j) ? 'compact' : ''}`}
            >
              <div>{targetCols[j]}</div>
              {!isColActive(j) && !isColOver(j) && getColStatus(j) !== null && (
                <div className="target-hint">({getColStatus(j)})</div>
              )}
            </div>
          ))}
          <div className="corner" />
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
              <button className="solution-button" onClick={showSolution}>הצג פתרון</button>
            </div>
            {message && <p className="message">{message}</p>}
          </div>
        </div>
      </div>

      {/* מודאל סיום */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <h2>🎉 כל הכבוד!</h2>
            {moves > getMinimalSteps() ? (
              <>
                <p>פתרת את החידה בהצלחה תוך <strong>{moves}</strong> צעדים!</p>
                <p style={{ fontSize: '13px', marginTop: '8px', color: '#666' }}>
                  מספר הצעדים המינימלי הנדרש לפתור את החידה הוא <strong>{getMinimalSteps()}</strong>
                </p>
              </>
            ) : (
              <p>פתרת את החידה, ועשית זאת עם מספר הצעדים המינימלי! 🧠</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
