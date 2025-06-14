import React, { useState, useEffect } from 'react';
import './PuzzleBoard.css';

export default function PuzzleBoard({ board, targetRows, targetCols, operation, onBack }) {
  const [userGrid, setUserGrid] = useState(
    board.map(row => row.map(() => 0))
  );
  const [solutionGrid, setSolutionGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const toggleCell = (i, j) => {
    setUserGrid(prev =>
      prev.map((row, rowIndex) =>
        rowIndex === i
          ? row.map((val, colIndex) => (colIndex === j ? 1 - val : val))
          : row
      )
    );
  };

  // קריאה ל-API בעת עלייה
  useEffect(() => {
    const fetchSolution = async () => {
      try {
        const res = await fetch('http://localhost:8000/solve', {
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
      } catch (err) {
        console.error('Failed to fetch solution:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSolution();
  }, [board, targetRows, targetCols, operation]);

  const checkSolution = () => {
    if (!solutionGrid) return;

    const isCorrect = userGrid.every((row, i) =>
      row.every((val, j) => val === solutionGrid[i][j])
    );

    setMessage(isCorrect ? '✅ Correct! Well done.' : '❌ Not quite. Try again.');
  };

  if (loading) return <p>Loading puzzle...</p>;
  if (!solutionGrid) return <p>Error: Could not solve the puzzle.</p>;

  return (
    <div className="puzzle-container">
      <h2>Operation: {operation}</h2>

      <div className="puzzle-grid">
        {/* מטרות עמודות */}
        <div className="row">
          <div className="corner" />
          {targetCols.map((target, j) => (
            <div key={`col-${j}`} className="target col-target">
              {target}
            </div>
          ))}
        </div>

        {/* לוח המשחק + מטרות שורות */}
        {board.map((row, i) => (
          <div key={i} className="row">
            {row.map((val, j) => (
              <button
                key={j}
                className={`cell ${userGrid[i][j] ? 'marked' : ''}`}
                onClick={() => toggleCell(i, j)}
              >
                {val}
              </button>
            ))}
            <div className="target row-target">{targetRows[i]}</div>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={checkSolution}>Check My Solution</button>
        <button onClick={onBack}>Back to Menu</button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
