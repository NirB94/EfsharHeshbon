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
  const [errorCells, setErrorCells] = useState(new Set()); // Track cells with errors
  
  // Navigation state
  const [showNavigationButtons, setShowNavigationButtons] = useState(false);
  const [currentFocusedInput, setCurrentFocusedInput] = useState(null);
  
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [solveResults, setSolveResults] = useState(null);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);

  /**
   * Get all input elements in tab order
   */
  const getAllInputsInOrder = () => {
    const inputs = [];
    
    // Board cells (row by row, left to right)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const input = document.querySelector(`input[data-cell="${row}-${col}"]`);
        if (input) inputs.push(input);
      }
    }
    
    // Row targets
    for (let row = 0; row < 5; row++) {
      const input = document.querySelector(`input[data-row-target="${row}"]`);
      if (input) inputs.push(input);
    }
    
    // Column targets
    for (let col = 0; col < 5; col++) {
      const input = document.querySelector(`input[data-col-target="${col}"]`);
      if (input) inputs.push(input);
    }
    
    return inputs;
  };

  /**
   * Handle keyboard navigation between input fields
   */
  const handleKeyDown = (e) => {
    // Handle arrow keys and Enter
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      return;
    }

    e.preventDefault();
    
    const allInputs = getAllInputsInOrder();
    const currentInput = e.target;
    const currentIndex = allInputs.indexOf(currentInput);
    
    if (currentIndex === -1) return;
    
    let nextIndex = -1;
    
    if (e.key === 'ArrowDown') {
      // Like Tab - move to next field
      if (currentIndex < allInputs.length - 1) {
        nextIndex = currentIndex + 1;
      }
    } else if (e.key === 'ArrowUp') {
      // Like Shift+Tab - move to previous field
      if (currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }
    } else if (e.key === 'Enter') {
      // Enter - move to next field or blur if last
      if (currentIndex < allInputs.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        // Last field - blur to close keyboard
        currentInput.blur();
        return;
      }
    }
    
    if (nextIndex >= 0 && nextIndex < allInputs.length) {
      const nextInput = allInputs[nextIndex];
      nextInput.focus();
      nextInput.select();
    }
  };

  /**
   * Handle key press to prevent non-numeric characters
   */
  const handleKeyPress = (e) => {
    // Allow only digits
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  /**
   * Handle input focus - show navigation buttons
   */
  const handleInputFocus = (e) => {
    // Clear any pending hide timeouts
    clearTimeout(window.navButtonsTimeout);
    
    setShowNavigationButtons(true);
    setCurrentFocusedInput(e.target);
  };

  /**
   * Handle input blur - hide navigation buttons after a delay
   */
  const handleInputBlur = (e) => {
    // Check if the blur is caused by clicking on navigation buttons
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && relatedTarget.closest('.mobile-navigation-buttons')) {
      // Don't hide buttons if clicking on navigation
      return;
    }
    
    // Small delay to allow button clicks to register
    window.navButtonsTimeout = setTimeout(() => {
      // Check if any input still has focus
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.hasAttribute('data-cell') ||
        activeElement.hasAttribute('data-row-target') ||
        activeElement.hasAttribute('data-col-target')
      );
      
      if (!isInputFocused) {
        setShowNavigationButtons(false);
        setCurrentFocusedInput(null);
      }
    }, 150);
  };

  /**
   * Navigate to previous/next input or handle Enter
   */
  const navigateInput = (direction, event) => {
    // Prevent the button click from causing blur
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Clear any pending hide timeouts
    clearTimeout(window.navButtonsTimeout);
    
    if (!currentFocusedInput) return;
    
    if (direction === 'enter') {
      // Enter behavior: move to next field or blur if last field
      const allInputs = getAllInputsInOrder();
      const currentIndex = allInputs.indexOf(currentFocusedInput);
      
      if (currentIndex === -1) return;
      
      if (currentIndex < allInputs.length - 1) {
        // Move to next field
        const nextInput = allInputs[currentIndex + 1];
        nextInput.focus();
        nextInput.select();
        setCurrentFocusedInput(nextInput);
      } else {
        // Last field - blur to close keyboard
        currentFocusedInput.blur();
        setShowNavigationButtons(false);
        setCurrentFocusedInput(null);
      }
      return;
    }
    
    const allInputs = getAllInputsInOrder();
    const currentIndex = allInputs.indexOf(currentFocusedInput);
    
    if (currentIndex === -1) return;
    
    let nextIndex = -1;
    
    if (direction === 'next' && currentIndex < allInputs.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }
    
    if (nextIndex >= 0 && nextIndex < allInputs.length) {
      const nextInput = allInputs[nextIndex];
      nextInput.focus();
      nextInput.select();
      setCurrentFocusedInput(nextInput);
    }
  };

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
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
      setErrorCells(new Set());
    }
    
    // Auto-advance for board cells: move to next field when any single digit is entered
    if (value.length === 1 && /^[0-9]$/.test(value)) {
      setTimeout(() => {
        const allInputs = getAllInputsInOrder();
        const currentInput = document.querySelector(`input[data-cell="${row}-${col}"]`);
        const currentIndex = allInputs.indexOf(currentInput);
        
        if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
          const nextInput = allInputs[currentIndex + 1];
          nextInput.focus();
          nextInput.select();
          setCurrentFocusedInput(nextInput);
        }
      }, 10);
    }
  };

  /**
   * Handle row target change
   */
  const handleRowTargetChange = (index, value) => {
    const newTargets = [...targetRows];
    newTargets[index] = value;
    setTargetRows(newTargets);
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
      setErrorCells(new Set());
    }
    
    // Auto-advance for target cells: move to next field when 2 digits are entered
    if (value.length === 2 && /^[0-9]{2}$/.test(value)) {
      setTimeout(() => {
        const allInputs = getAllInputsInOrder();
        const currentInput = document.querySelector(`input[data-row-target="${index}"]`);
        const currentIndex = allInputs.indexOf(currentInput);
        
        if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
          const nextInput = allInputs[currentIndex + 1];
          nextInput.focus();
          nextInput.select();
          setCurrentFocusedInput(nextInput);
        }
      }, 10);
    }
  };

  /**
   * Handle column target change
   */
  const handleColTargetChange = (index, value) => {
    const newTargets = [...targetCols];
    newTargets[index] = value;
    setTargetCols(newTargets);
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
      setErrorCells(new Set());
    }
    
    // Auto-advance for target cells: move to next field when 2 digits are entered
    if (value.length === 2 && /^[0-9]{2}$/.test(value)) {
      setTimeout(() => {
        const allInputs = getAllInputsInOrder();
        const currentInput = document.querySelector(`input[data-col-target="${index}"]`);
        const currentIndex = allInputs.indexOf(currentInput);
        
        if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
          const nextInput = allInputs[currentIndex + 1];
          nextInput.focus();
          nextInput.select();
          setCurrentFocusedInput(nextInput);
        }
      }, 10);
    }
  };

  /**
   * Validate input before sending to backend
   */
  const validateInput = () => {
    const errorTypes = {
      emptyCells: [],
      invalidRangeMultiply: [],
      invalidRangeAdd: [],
      invalidRowTargets: [],
      invalidColTargets: [],
      leadingZeroTargets: []
    };
    
    const errorCellsSet = new Set();
    
    // Check if all board cells are filled
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const value = board[i][j];
        const cellKey = `board-${i}-${j}`;
        
        if (value === '' || isNaN(value)) {
          errorTypes.emptyCells.push({ row: i, col: j });
          errorCellsSet.add(cellKey);
        } else {
          const num = parseInt(value);
          if (operation === '*' && (num < 2 || num > 9)) {
            errorTypes.invalidRangeMultiply.push({ row: i, col: j, value: num });
            errorCellsSet.add(cellKey);
          } else if (operation === '+' && (num < 1 || num > 9)) {
            errorTypes.invalidRangeAdd.push({ row: i, col: j, value: num });
            errorCellsSet.add(cellKey);
          }
        }
      }
    }
    
    // Check row targets
    for (let i = 0; i < 5; i++) {
      const value = targetRows[i];
      if (value === '' || isNaN(value) || parseInt(value) <= 0) {
        errorTypes.invalidRowTargets.push(i);
        errorCellsSet.add(`row-target-${i}`);
      } else if (value.length > 1 && value.startsWith('0')) {
        // Check for leading zero (e.g., "01", "02", etc.)
        errorTypes.leadingZeroTargets.push({ type: 'row', index: i });
        errorCellsSet.add(`row-target-${i}`);
      }
    }
    
    // Check column targets
    for (let i = 0; i < 5; i++) {
      const value = targetCols[i];
      if (value === '' || isNaN(value) || parseInt(value) <= 0) {
        errorTypes.invalidColTargets.push(i);
        errorCellsSet.add(`col-target-${i}`);
      } else if (value.length > 1 && value.startsWith('0')) {
        // Check for leading zero (e.g., "01", "02", etc.)
        errorTypes.leadingZeroTargets.push({ type: 'col', index: i });
        errorCellsSet.add(`col-target-${i}`);
      }
    }
    
    // Generate user-friendly error messages
    const errorMessages = [];
    
    if (errorTypes.emptyCells.length > 0) {
      errorMessages.push('יש תאים ריקים בלוח - אנא מלא את כל התאים במספרים');
    }
    
    if (errorTypes.invalidRangeMultiply.length > 0) {
      errorMessages.push('עבור כפל, כל המספרים בלוח חייבים להיות בין 2-9');
    }
    
    if (errorTypes.invalidRangeAdd.length > 0) {
      errorMessages.push('עבור חיבור, כל המספרים בלוח חייבים להיות בין 1-9');
    }
    
    if (errorTypes.invalidRowTargets.length > 0) {
      errorMessages.push('יעדי השורות חייבים להיות מספרים חיוביים');
    }
    
    if (errorTypes.invalidColTargets.length > 0) {
      errorMessages.push('יעדי העמודות חייבים להיות מספרים חיוביים');
    }
    
    if (errorTypes.leadingZeroTargets.length > 0) {
      errorMessages.push('יעדים לא יכולים להתחיל באפס (לדוגמה: 01, 02)');
    }
    
    return { errorMessages, errorCells: errorCellsSet };
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
    const validationResult = validateInput();
    if (validationResult.errorMessages.length > 0) {
      setErrors(validationResult.errorMessages);
      setErrorCells(validationResult.errorCells);
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
    setErrorCells(new Set());
    setShowResults(false);
    setSolveResults(null);
  };

  /**
   * Go back to editing mode
   */
  const handleBackToEdit = () => {
    setShowResults(false);
    setErrors([]);
    setErrorCells(new Set());
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
  const handleTryYourself = async () => {
    // Validate input first
    const validationResult = validateInput();
    if (validationResult.errorMessages.length > 0) {
      setErrors(validationResult.errorMessages);
      setErrorCells(validationResult.errorCells);
      return;
    }

    setLoading(true);
    
    try {
      const backendUrl = getBackendUrl();
      const requestData = prepareDataForBackend();
      
      // Check if the puzzle has a solution before proceeding
      const response = await fetch(`${backendUrl}/solve_manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // Show validation errors instead of navigating to a new screen
        setErrors(result.validation_errors || ['הלוח שהזנת אינו חוקי או שאין לו פתרון']);
        return;
      }
      
      // If puzzle has a solution, proceed to the game screen
      const puzzleData = {
        board: requestData.board,
        targetRows: requestData.target_rows,
        targetCols: requestData.target_cols,
        operation: requestData.operation,
        solution: null, // No solution provided - user will solve manually
        markedCount: 0,
        totalSolutions: result.total_solutions,
        solutionStats: result.solution_stats,
        allSolutions: result.all_solutions || [],
        fromManualInput: true // Flag to indicate this came from manual input
      };
      
      onSolve(puzzleData);
      
    } catch (error) {
      setErrors(['שגיאה בחיבור לשרת']);
    } finally {
      setLoading(false);
    }
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
            <div className="solution-display">
              {/* Left arrow for navigation */}
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
            onClick={() => {
              setOperation(operation === '*' ? '+' : '*');
              // Clear errors when operation changes
              if (errors.length > 0) {
                setErrors([]);
                setErrorCells(new Set());
              }
            }}
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
                inputMode="numeric"
                pattern="[0-9]*"
                min={operation === '*' ? '2' : '1'}
                max="9"
                value={cell}
                onChange={(e) => handleBoardChange(rowIndex, colIndex, e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                data-cell={`${rowIndex}-${colIndex}`}
                className={`board-cell ${errorCells.has(`board-${rowIndex}-${colIndex}`) ? 'error-cell' : ''}`}
              />
            ))}
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              value={targetRows[rowIndex]}
              onChange={(e) => handleRowTargetChange(rowIndex, e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              data-row-target={rowIndex}
              className={`target-input row-target ${errorCells.has(`row-target-${rowIndex}`) ? 'error-cell' : ''}`}
            />
          </div>
        ))}
        
        {/* Column targets below the board */}
        <div className="col-targets">
          {targetCols.map((target, index) => (
            <input
              key={`col-${index}`}
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              value={target}
              onChange={(e) => handleColTargetChange(index, e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              data-col-target={index}
              className={`target-input col-target ${errorCells.has(`col-target-${index}`) ? 'error-cell' : ''}`}
            />
          ))}
          <div className="empty-corner"></div>
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

      {/* Navigation buttons for mobile */}
      {showNavigationButtons && (
        <div 
          className="mobile-navigation-buttons"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          <button 
            className="nav-btn nav-next"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateInput('next', e);
            }}
            disabled={!currentFocusedInput || getAllInputsInOrder().indexOf(currentFocusedInput) === getAllInputsInOrder().length - 1}
            title="שדה הבא"
            tabIndex="-1"
          >
            →
          </button>
          <button 
            className="nav-btn nav-enter"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateInput('enter', e);
            }}
            title="Enter"
            tabIndex="-1"
          >
            ↵
          </button>
          <button 
            className="nav-btn nav-prev"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateInput('prev', e);
            }}
            disabled={!currentFocusedInput || getAllInputsInOrder().indexOf(currentFocusedInput) === 0}
            title="שדה קודם"
            tabIndex="-1"
          >
            ←
          </button>
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