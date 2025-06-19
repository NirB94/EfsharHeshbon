"""
manual_input.py

This module handles manual puzzle input functionality.
Allows users to input their own 5x5 puzzle with row and column targets,
then finds and returns the optimal solution with minimal steps.

Functions included:
- validate_manual_input: Validate user input for correctness
- solve_manual_puzzle: Find optimal solution for manually entered puzzle  
- find_all_solutions: Find all possible solutions for the puzzle
- get_solution_stats: Get statistics about the solutions found
"""

import operator
from itertools import combinations
from functools import reduce
import core_logic as cl

def validate_manual_input(board, target_rows, target_cols, operation):
    """
    Validate that the manual input is correct and solvable.
    
    Args:
        board: 5x5 grid of numbers
        target_rows: List of 5 target values for rows
        target_cols: List of 5 target values for columns  
        operation: Either "*" or "+"
        
    Returns:
        dict: {"valid": bool, "errors": list of error messages}
    """
    errors = []
    
    # Basic structure validation
    if not board or len(board) != 5:
        errors.append("הלוח חייב להיות בגודל 5x5")
        return {"valid": False, "errors": errors}
    
    for i, row in enumerate(board):
        if not row or len(row) != 5:
            errors.append(f"שורה {i+1} חייבת להכיל 5 מספרים")
            return {"valid": False, "errors": errors}
    
    if not target_rows or len(target_rows) != 5:
        errors.append("חייבים להיות 5 יעדי שורות")
        return {"valid": False, "errors": errors}
        
    if not target_cols or len(target_cols) != 5:
        errors.append("חייבים להיות 5 יעדי עמודות")
        return {"valid": False, "errors": errors}
    
    if operation not in ["*", "+"]:
        errors.append("הפעולה חייבת להיות כפל (*) או חיבור (+)")
        return {"valid": False, "errors": errors}
    
    # Value validation
    valid_range = range(1, 10) if operation == "+" else range(2, 10)
    
    for i, row in enumerate(board):
        for j, val in enumerate(row):
            if not isinstance(val, int) or val not in valid_range:
                if operation == "+":
                    errors.append(f"ערך בשורה {i+1}, עמודה {j+1} חייב להיות מספר שלם בין 1-9")
                else:
                    errors.append(f"ערך בשורה {i+1}, עמודה {j+1} חייב להיות מספר שלם בין 2-9")
    
    # Target validation
    for i, target in enumerate(target_rows):
        if not isinstance(target, int) or target <= 0:
            errors.append(f"יעד שורה {i+1} חייב להיות מספר חיובי")
    
    for i, target in enumerate(target_cols):
        if not isinstance(target, int) or target <= 0:
            errors.append(f"יעד עמודה {i+1} חייב להיות מספר חיובי")
    
    # Mathematical feasibility check
    if operation == "*":
        # For multiplication, check if targets are feasible
        for i, target in enumerate(target_rows):
            max_possible = reduce(operator.mul, [9] * 5)  # Maximum possible product
            min_possible = reduce(operator.mul, [2] * 1)  # Minimum possible product (single cell)
            if target > max_possible:
                errors.append(f"יעד שורה {i+1} ({target}) גבוה מדי - המקסימום האפשרי הוא {max_possible}")
            elif target < min_possible:
                errors.append(f"יעד שורה {i+1} ({target}) נמוך מדי - המינימום האפשרי הוא {min_possible}")
        
        for i, target in enumerate(target_cols):
            max_possible = reduce(operator.mul, [9] * 5)
            min_possible = reduce(operator.mul, [2] * 1)
            if target > max_possible:
                errors.append(f"יעד עמודה {i+1} ({target}) גבוה מדי - המקסימום האפשרי הוא {max_possible}")
            elif target < min_possible:
                errors.append(f"יעד עמודה {i+1} ({target}) נמוך מדי - המינימום האפשרי הוא {min_possible}")
    
    else:  # addition
        # For addition, check if targets are feasible
        for i, target in enumerate(target_rows):
            max_possible = 9 * 5  # Maximum possible sum
            min_possible = 1  # Minimum possible sum (single cell)
            if target > max_possible:
                errors.append(f"יעד שורה {i+1} ({target}) גבוה מדי - המקסימום האפשרי הוא {max_possible}")
            elif target < min_possible:
                errors.append(f"יעד שורה {i+1} ({target}) נמוך מדי - המינימום האפשרי הוא {min_possible}")
        
        for i, target in enumerate(target_cols):
            max_possible = 9 * 5
            min_possible = 1
            if target > max_possible:
                errors.append(f"יעד עמודה {i+1} ({target}) גבוה מדי - המקסימום האפשרי הוא {max_possible}")
            elif target < min_possible:
                errors.append(f"יעד עמודה {i+1} ({target}) נמוך מדי - המינימום האפשרי הוא {min_possible}")
    
    return {"valid": len(errors) == 0, "errors": errors}

def find_all_solutions(board, target_rows, target_cols, operation):
    """
    Find all possible solutions for the manually entered puzzle.
    
    Args:
        board: 5x5 grid of numbers
        target_rows: List of target values for rows
        target_cols: List of target values for columns
        operation: Either "*" or "+"
        
    Returns:
        list: List of all valid solution grids
    """
    op = operator.mul if operation == "*" else operator.add
    
    # Find all possible row combinations for each row
    row_possibilities = [
        cl.find_matching_subsets(row, target, op)
        for row, target in zip(board, target_rows)
    ]
    
    # Check if any row has no valid combinations
    for i, possibilities in enumerate(row_possibilities):
        if not possibilities:
            return []  # No solution possible
    
    all_solutions = []
    empty_grid = [[0] * 5 for _ in range(5)]
    
    def find_solutions_recursive(grid, row_idx):
        if row_idx == 5:
            # Check if all columns are valid
            if cl.is_valid_columns(grid, board, target_cols, op):
                # Add a copy of the current solution
                all_solutions.append([row[:] for row in grid])
                print(f"[DEBUG] Found solution #{len(all_solutions)}: {grid}")
            return
        
        # Try each possible combination for this row
        for row_option in row_possibilities[row_idx]:
            new_row = [1 if i in row_option else 0 for i in range(5)]
            grid[row_idx] = new_row
            
            # Check partial validity before continuing
            if cl.is_partial_valid_columns(grid, row_idx, board, target_cols, op):
                find_solutions_recursive(grid, row_idx + 1)
        
        # Reset the row
        grid[row_idx] = [0] * 5
    
    find_solutions_recursive(empty_grid, 0)
    print(f"[DEBUG] find_all_solutions returning {len(all_solutions)} solutions")
    return all_solutions

def solve_manual_puzzle(board, target_rows, target_cols, operation):
    """
    Solve a manually entered puzzle and return the optimal solution.
    
    Args:
        board: 5x5 grid of numbers
        target_rows: List of target values for rows
        target_cols: List of target values for columns
        operation: Either "*" or "+"
        
    Returns:
        dict: {
            "success": bool,
            "optimal_solution": grid with minimal marks (or None),
            "marked_count": number of selected cells in optimal solution,
            "total_solutions": number of total solutions found,
            "all_solutions": list of all valid solution grids,
            "validation_errors": list of validation errors (if any)
        }
    """
    # First validate the input
    validation = validate_manual_input(board, target_rows, target_cols, operation)
    if not validation["valid"]:
        return {
            "success": False,
            "optimal_solution": None,
            "marked_count": 0,
            "total_solutions": 0,
            "all_solutions": [],
            "validation_errors": validation["errors"]
        }
    
    # Find all solutions
    all_solutions = find_all_solutions(board, target_rows, target_cols, operation)
    
    print(f"[DEBUG] Found {len(all_solutions)} solutions")
    print(f"[DEBUG] All solutions: {all_solutions}")
    
    if not all_solutions:
        return {
            "success": False,
            "optimal_solution": None,
            "marked_count": 0,
            "total_solutions": 0,
            "all_solutions": [],
            "validation_errors": ["לא נמצא פתרון אפשרי לחידה זו"]
        }
    
    # Find the optimal solution (minimal marked cells)
    optimal_solution = None
    min_marked = float('inf')
    
    for solution in all_solutions:
        marked_count = cl.count_marked(solution)
        if marked_count < min_marked:
            min_marked = marked_count
            optimal_solution = solution
    
    return {
        "success": True,
        "optimal_solution": optimal_solution,
        "marked_count": min_marked,
        "total_solutions": len(all_solutions),
        "all_solutions": all_solutions,
        "validation_errors": []
    }

def get_solution_stats(all_solutions):
    """
    Get statistics about the solutions found.
    
    Args:
        all_solutions: List of solution grids
        
    Returns:
        dict: Statistics about the solutions
    """
    if not all_solutions:
        return {
            "total_solutions": 0,
            "min_marked": 0,
            "max_marked": 0,
            "avg_marked": 0,
            "marked_distribution": {}
        }
    
    marked_counts = [cl.count_marked(solution) for solution in all_solutions]
    
    # Count distribution of marked cells
    marked_distribution = {}
    for count in marked_counts:
        marked_distribution[count] = marked_distribution.get(count, 0) + 1
    
    return {
        "total_solutions": len(all_solutions),
        "min_marked": min(marked_counts),
        "max_marked": max(marked_counts),
        "avg_marked": round(sum(marked_counts) / len(marked_counts), 2),
        "marked_distribution": marked_distribution
    } 