import React, { useState, useEffect } from 'react';
import './ManualInput.css';

/**
 * ManualInput Component
 * 
 * Allows users to manually input a 5x5 puzzle board with row and column targets,
 * then sends it to the backend to find the optimal solution.
 */
export default function ManualInput({ onBack, onSolve, existingPuzzleData }) {
  // Initialize board - use existing data if available
  const [board, setBoard] = useState(() => {
    if (existingPuzzleData && existingPuzzleData.board) {
      return existingPuzzleData.board.map(row => row.map(cell => cell.toString()));
    }
    return Array(5).fill().map(() => Array(5).fill(''));
  });
  
  // Initialize targets - use existing data if available
  const [targetRows, setTargetRows] = useState(() => {
    if (existingPuzzleData && existingPuzzleData.targetRows) {
      return existingPuzzleData.targetRows.map(target => target.toString());
    }
    return Array(5).fill('');
  });
  
  const [targetCols, setTargetCols] = useState(() => {
    if (existingPuzzleData && existingPuzzleData.targetCols) {
      return existingPuzzleData.targetCols.map(target => target.toString());
    }
    return Array(5).fill('');
  });
  
  // Operation selection - use existing operation if available
  const [operation, setOperation] = useState(() => {
    if (existingPuzzleData && existingPuzzleData.operation) {
      return existingPuzzleData.operation;
    }
    return '+';
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [solveResults, setSolveResults] = useState(null);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);

  // Reset results state when coming from board with existing data
  useEffect(() => {
    if (existingPuzzleData && existingPuzzleData.fromManualInput) {
      setShowResults(false);
      setSolveResults(null);
      setCurrentSolutionIndex(0);
    }
  }, [existingPuzzleData]);

  /**
   * Get the appropriate backend URL based on environment
   */
  const getBackendUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://127.0.0.1:8000'
      : 'https://efsharheshbon.onrender.com';
  };

  /**
   * Handle board cell value change
   */
  const handleBoardChange = (row, col, value) => {
    const newBoard = [...board];
    newBoard[row][col] = value;
    setBoard(newBoard);
  };

  /**
   * Handle row target change
   */
  const handleRowTargetChange = (index, value) => {
    const newTargets = [...targetRows];
    newTargets[index] = value;
    setTargetRows(newTargets);
  };

  /**
   * Handle column target change
   */
  const handleColTargetChange = (index, value) => {
    const newTargets = [...targetCols];
    newTargets[index] = value;
    setTargetCols(newTargets);
  };

  /**
   * Validate input before sending to backend
   */
  const validateInput = () => {
    const validationErrors = [];
    
    // Check if all board cells are filled
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const value = board[i][j];
        if (value === '' || isNaN(value)) {
          validationErrors.push(`תא בשורה ${i+1}, עמודה ${j+1} חייב להכיל מספר`);
        } else {
          const num = parseInt(value);
          if (operation === '*' && (num < 2 || num > 9)) {
            validationErrors.push(`ערך בשורה ${i+1}, עמודה ${j+1} חייב להיות בין 2-9 עבור כפל`);
          } else if (operation === '+' && (num < 1 || num > 9)) {
            validationErrors.push(`ערך בשורה ${i+1}, עמודה ${j+1} חייב להיות בין 1-9 עבור חיבור`);
          }
        }
      }
    }
    
    // Check row targets
    for (let i = 0; i < 5; i++) {
      const value = targetRows[i];
      if (value === '' || isNaN(value) || parseInt(value) <= 0) {
        validationErrors.push(`יעד שורה ${i+1} חייב להיות מספר חיובי`);
      }
    }
    
    // Check column targets
    for (let i = 0; i < 5; i++) {
      const value = targetCols[i];
      if (value === '' || isNaN(value) || parseInt(value) <= 0) {
        validationErrors.push(`יעד עמודה ${i+1} חייב להיות מספר חיובי`);
      }
    }
    
    return validationErrors;
  };

  /**
   * Convert string inputs to numbers for backend
   */
  const prepareDataForBackend = () => {
    const numericBoard = board.map(row => 
      row.map(cell => parseInt(cell))
    );
    const numericRowTargets = targetRows.map(target => parseInt(target));
    const numericColTargets = targetCols.map(target => parseInt(target));
    
    return {
      board: numericBoard,
      target_rows: numericRowTargets,
      target_cols: numericColTargets,
      operation: operation
    };
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors([]);
    
    // Validate input
    const validationErrors = validateInput();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const backendUrl = getBackendUrl();
      const requestData = prepareDataForBackend();
      
      const response = await fetch(`${backendUrl}/solve_manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setErrors(result.validation_errors || ['שגיאה לא ידועה']);
        return;
      }
      
      // Store results and show them
      const resultData = {
        board: requestData.board,
        targetRows: requestData.target_rows,
        targetCols: requestData.target_cols,
        operation: requestData.operation,
        solution: result.optimal_solution,
        markedCount: result.marked_count,
        totalSolutions: result.total_solutions,
        solutionStats: result.solution_stats,
        allSolutions: result.all_solutions || (result.optimal_solution ? [result.optimal_solution] : [])
      };
      
      setSolveResults(resultData);
      setShowResults(true);
      setCurrentSolutionIndex(0);
      
      console.log('=== BACKEND RESPONSE ===');
      console.log('Full result object:', result);
      console.log('result.all_solutions exists?', 'all_solutions' in result);
      console.log('result.all_solutions:', result.all_solutions);
      console.log('result.all_solutions length:', result.all_solutions ? result.all_solutions.length : 'undefined');
      console.log('=== PROCESSED RESULT DATA ===');
      console.log('Results set:', resultData);
      console.log('resultData.allSolutions:', resultData.allSolutions);
      console.log('resultData.allSolutions length:', resultData.allSolutions ? resultData.allSolutions.length : 'undefined');
      
    } catch (error) {
      setErrors(['שגיאה בחיבור לשרת']);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all inputs
   */
  const handleClear = () => {
    setBoard(Array(5).fill().map(() => Array(5).fill('')));
    setTargetRows(Array(5).fill(''));
    setTargetCols(Array(5).fill(''));
    setErrors([]);
    setShowResults(false);
    setSolveResults(null);
  };

  /**
   * Go back to editing mode
   */
  const handleBackToEdit = () => {
    setShowResults(false);
    setErrors([]);
    setCurrentSolutionIndex(0);
  };

  /**
   * Send to full puzzle board view
   */
  const handleShowFullSolution = () => {
    if (solveResults) {
      // Send the currently viewed solution
      const currentSolution = solveResults.allSolutions[currentSolutionIndex];
      const solutionData = {
        ...solveResults,
        solution: currentSolution,
        markedCount: currentSolution.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0)
      };
      onSolve(solutionData);
    }
  };

  /**
   * Navigate to previous solution
   */
  const handlePreviousSolution = () => {
    if (solveResults && solveResults.allSolutions) {
      setCurrentSolutionIndex(prev => 
        prev > 0 ? prev - 1 : solveResults.allSolutions.length - 1
      );
    }
  };

  /**
   * Navigate to next solution
   */
  const handleNextSolution = () => {
    if (solveResults && solveResults.allSolutions) {
      setCurrentSolutionIndex(prev => 
        prev < solveResults.allSolutions.length - 1 ? prev + 1 : 0
      );
    }
  };

  /**
   * Get the number of marked cells for a specific solution
   */
  const getMarkedCount = (solution) => {
    return solution.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
  };

  /**
   * Handle "Try it yourself" - send puzzle data for manual solving
   */
  const handleTryYourself = () => {
    // Validate input first
    const validationErrors = validateInput();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const requestData = prepareDataForBackend();
    const puzzleData = {
      board: requestData.board,
      targetRows: requestData.target_rows,
      targetCols: requestData.target_cols,
      operation: requestData.operation,
      solution: null, // No solution provided - user will solve manually
      markedCount: 0,
      totalSolutions: 0,
      solutionStats: null,
      allSolutions: [],
      fromManualInput: true // Flag to indicate this came from manual input
    };
    
    onSolve(puzzleData);
  };

  return (
    <div className="manual-input" dir="rtl">
      <div className="manual-input-header">
        <button
          className="back-button"
          onClick={onBack}
          title="חזרה לתפריט הראשי"
        >
          →
        </button>
      </div>

      {showResults && solveResults ? (
        // Results view
        <div className="results-view">
          {/* Debug info */}
          {console.log('Rendering results, showResults:', showResults, 'solveResults:', solveResults)}
          <div className="results-summary">
            <h3>סיכום הפתרון:</h3>
            <p><strong>פעולה:</strong> {solveResults.operation === '*' ? 'כפל' : 'חיבור'}</p>
            <p><strong>מספר פתרונות שנמצאו:</strong> {solveResults.totalSolutions}</p>
            <p><strong>מספר תאים מינימלי:</strong> {solveResults.markedCount}</p>
            {solveResults.allSolutions && solveResults.allSolutions.length > 0 && (
              <div className="solution-navigation-info">
                <p><strong>פתרון {currentSolutionIndex + 1} מתוך {solveResults.allSolutions.length}</strong></p>
                <p><strong>מספר צעדים בפתרון זה:</strong> {getMarkedCount(solveResults.allSolutions[currentSolutionIndex])}</p>
              </div>
            )}
          </div>

          <div className="results-grid">
            {console.log('allSolutions:', solveResults.allSolutions, 'length:', solveResults.allSolutions?.length)}
            
            <div className="solution-display">
              {/* Left arrow for navigation */}
              {console.log('Arrow condition check:', solveResults.allSolutions?.length, 'should show arrows:', solveResults.allSolutions && solveResults.allSolutions.length > 1)}
              {console.log('Current solution index:', currentSolutionIndex)}
              {console.log('All solutions array:', solveResults.allSolutions)}
              {solveResults.allSolutions && solveResults.allSolutions.length > 1 && (
                <button 
                  className="nav-arrow nav-arrow-left"
                  onClick={handlePreviousSolution}
                  title="פתרון קודם"
                >
                  →
                </button>
              )}
              
              <div className="manual-input-grid" dir="ltr">
                {/* Board rows with solution highlighting */}
                {solveResults.board && solveResults.board.map((row, rowIndex) => (
                  <div key={`result-row-${rowIndex}`} className="board-row">
                    {row.map((cell, colIndex) => (
                      <div
                        key={`result-cell-${rowIndex}-${colIndex}`}
                        className={`board-cell-display ${
                          (solveResults.allSolutions && solveResults.allSolutions.length > 0 && 
                           solveResults.allSolutions[currentSolutionIndex] &&
                           solveResults.allSolutions[currentSolutionIndex][rowIndex][colIndex] === 1) ? 'marked' : ''
                        }`}
                      >
                        {cell}
                      </div>
                    ))}
                    <div className="target-display row-target">
                      {solveResults.targetRows[rowIndex]}
                    </div>
                  </div>
                ))}
                
                {/* Column targets below */}
                <div className="col-targets">
                  {solveResults.targetCols.map((target, index) => (
                    <div key={`result-col-${index}`} className="target-display col-target">
                      {target}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right arrow for navigation */}
              {solveResults.allSolutions && solveResults.allSolutions.length > 1 && (
                <button 
                  className="nav-arrow nav-arrow-right"
                  onClick={handleNextSolution}
                  title="פתרון הבא"
                >
                  ←
                </button>
              )}
            </div>
          </div>

          <div className="results-actions">
            <button onClick={handleBackToEdit} className="edit-button">
              חזור לעריכה
            </button>
            <button onClick={handleShowFullSolution} className="full-solution-button">
              לנסות לבד?
            </button>
          </div>
        </div>
      ) : (
        // Edit view
        <div className="edit-view">
          {/* Operation selector */}
      <div className="operation-selector">
        <div className="operation-toggle-container">
          <span className="operation-label">פעולה:</span>
          <div 
            className="operation-toggle-switch"
            onClick={() => setOperation(operation === '*' ? '+' : '*')}
          >
            <div className="toggle-options">
              <span className={`toggle-option ${operation === '+' ? 'active' : ''}`}>חיבור (+)</span>
              <span className={`toggle-option ${operation === '*' ? 'active' : ''}`}>כפל (×)</span>
            </div>
            <div className={`toggle-slider ${operation === '+' ? 'right' : 'left'}`}></div>
          </div>
        </div>
      </div>

                {/* Input grid */}
          <div className="manual-input-grid" dir="ltr">
        {/* Board rows with row targets on the right */}
        {board.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="board-row">
            {row.map((cell, colIndex) => (
              <input
                key={`cell-${rowIndex}-${colIndex}`}
                type="number"
                min={operation === '*' ? '2' : '1'}
                max="9"
                value={cell}
                onChange={(e) => handleBoardChange(rowIndex, colIndex, e.target.value)}
                className="board-cell"
              />
            ))}
            <input
              type="number"
              min="1"
              value={targetRows[rowIndex]}
              onChange={(e) => handleRowTargetChange(rowIndex, e.target.value)}
              placeholder="יעד"
              className="target-input row-target"
            />
          </div>
        ))}
        
        {/* Column targets below the board */}
        <div className="col-targets">
          {targetCols.map((target, index) => (
            <input
              key={`col-${index}`}
              type="number"
              min="1"
              value={target}
              onChange={(e) => handleColTargetChange(index, e.target.value)}
              placeholder="יעד"
              className="target-input col-target"
            />
          ))}
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="error-messages">
          <h4>שגיאות:</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="action-buttons">
        <button 
          onClick={handleClear}
          className="clear-button"
          disabled={loading}
        >
          נקה הכל
        </button>
        <button 
          onClick={handleSubmit}
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'מחפש פתרון...' : 'מצא פתרון'}
        </button>
        <button 
          onClick={handleTryYourself}
          className="try-yourself-button"
          disabled={loading}
        >
          נסה זאת בעצמך
        </button>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <p>מלא את כל התאים ({operation === '*' ? '2-9' : '1-9'}) והזן יעדים לכל שורה ועמודה</p>
      </div>
        </div>
      )}
    </div>
  );
} 