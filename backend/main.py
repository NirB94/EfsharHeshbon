from fastapi import FastAPI, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import core_logic as cl
import manual_input as mi
import operator
from enum import Enum

app = FastAPI()

# Enable CORS for React frontend (adjust allowed origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PuzzleRequest(BaseModel):
    """
    Request body schema for the /solve endpoint.
    """
    board: list[list[int]]
    target_rows: list[int]
    target_cols: list[int]
    operation: str  # Either "*" or "+"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class GameRequest(BaseModel):
    """
    Request body schema for the /new_game endpoint.
    """
    operation: str
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM

class ManualInputRequest(BaseModel):
    """
    Request body schema for the /solve_manual endpoint.
    """
    board: list[list[int]]
    target_rows: list[int]
    target_cols: list[int]
    operation: str  # Either "*" or "+"

@app.post("/solve")
def solve_puzzle(req: PuzzleRequest):
    """
    Solve a given puzzle board and return the optimal solution and all valid solutions.

    Args:
        req (PuzzleRequest): Puzzle configuration including board, targets, and operation.

    Returns:
        dict: {
            "solution": grid with minimal marks,
            "marked_count": number of selected cells,
            "all_solutions": list of all valid solution grids
        }
    """
    board = req.board
    target_rows = req.target_rows
    target_cols = req.target_cols
    op = operator.mul if req.operation == "*" else operator.add

    row_possibilities = [
        cl.find_matching_subsets(row, target, op)
        for row, target in zip(board, target_rows)
    ]

    empty_grid = [[0] * len(board[0]) for _ in range(len(board))]
    best_solution = [float("inf"), None]
    all_solutions = []

    def solve_and_collect(grid, row_idx):
        if row_idx == len(board):
            if cl.is_valid_columns(grid, board, target_cols, op):
                marked = cl.count_marked(grid)
                if marked < best_solution[0]:
                    best_solution[0] = marked
                    best_solution[1] = [row[:] for row in grid]
                all_solutions.append([row[:] for row in grid])
            return

        for row_option in row_possibilities[row_idx]:
            new_row = [1 if i in row_option else 0 for i in range(len(board[0]))]
            grid[row_idx] = new_row

            if cl.is_partial_valid_columns(grid, row_idx, board, target_cols, op):
                solve_and_collect(grid, row_idx + 1)

        grid[row_idx] = [0] * len(board[0])

    solve_and_collect(empty_grid, 0)

    if not all_solutions:
        return {"solution": None, "marked_count": 0, "all_solutions": []}

    return {
        "solution": best_solution[1],
        "marked_count": best_solution[0],
        "all_solutions": all_solutions
    }

@app.post("/new_game")
def new_game(request: GameRequest):
    """
    Generate a new puzzle with a guaranteed valid and minimal solution.

    Args:
        request (GameRequest): Requested operation ('*' or '+') and difficulty level.

    Returns:
        dict: Puzzle board and targets, including minimal solution if found.
    """
    operation = request.operation
    difficulty = request.difficulty.value
    
    for _ in range(20):
        board, target_rows, target_cols, solution = cl.generate_board_from_solution(
            operation, 
            size=5,
            difficulty=difficulty
        )
        op = operator.mul if operation == "*" else operator.add

        row_possibilities = [
            cl.find_matching_subsets(row, target, op)
            for row, target in zip(board, target_rows)
        ]
        empty_grid = [[0] * 5 for _ in range(5)]
        best_solution = [float("inf"), None]
        cl.solve_minimal(empty_grid, 0, board, target_rows, target_cols, op, row_possibilities, best_solution)

        if best_solution[1] is not None:
            return {
                "board": board,
                "target_rows": target_rows,
                "target_cols": target_cols,
                "operation": operation,
                "solution": solution,
                "minimal_solution": best_solution[1],
                "marked_count": best_solution[0],
                "difficulty": difficulty
            }

    return {"error": "Failed to generate a valid board. Please try again."}

@app.get("/test_difficulty/{difficulty}")
def test_difficulty(difficulty: str):
    """
    Test endpoint to verify difficulty generation is working correctly.
    """
    try:
        operation = "*"
        board, target_rows, target_cols, solution = cl.generate_board_from_solution(
            operation, 
            size=5,
            difficulty=difficulty
        )
        
        # Count single-cell rows
        single_cell_count = sum(1 for row in solution if sum(row) == 1)
        
        # Calculate average target values
        avg_row_target = sum(target_rows) / len(target_rows)
        avg_col_target = sum(target_cols) / len(target_cols)
        
        # Define valid digits for analysis
        valid_digits = list(range(2, 10)) if operation == '*' else list(range(1, 10))
        
        # Analyze factors for multiplication targets
        factor_analysis = []
        if operation == "*":
            for target in target_rows + target_cols:
                if target > 0:
                    factors = [n for n in range(2, 10) if target % n == 0]
                    factor_analysis.append({
                        "target": target,
                        "factor_count": len(factors),
                        "factors": factors
                    })
        
        # Calculate confusion score for hard difficulty
        confusion_score = 0
        if difficulty == "hard":
            confusion_score = cl.evaluate_board_confusion(board, target_rows, target_cols, solution, valid_digits)
        
        return {
            "difficulty": difficulty,
            "operation": operation,
            "board": board,
            "target_rows": target_rows,
            "target_cols": target_cols,
            "solution": solution,
            "single_cell_rows": single_cell_count,
            "avg_row_target": round(avg_row_target, 2),
            "avg_col_target": round(avg_col_target, 2),
            "min_target": min(target_rows + target_cols),
            "max_target": max(target_rows + target_cols),
            "factor_analysis": factor_analysis,
            "targets_with_many_factors": len([f for f in factor_analysis if f["factor_count"] >= 3]),
            "confusion_score": confusion_score
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/solve_manual")
def solve_manual_puzzle(req: ManualInputRequest):
    """
    Solve a manually entered puzzle and return the optimal solution.
    
    Args:
        req (ManualInputRequest): Manual puzzle including board, targets, and operation.
        
    Returns:
        dict: {
            "success": bool,
            "optimal_solution": grid with minimal marks (or None),
            "marked_count": number of selected cells in optimal solution,
            "total_solutions": number of total solutions found,
            "validation_errors": list of validation errors (if any),
            "solution_stats": statistics about all solutions found
        }
    """
    try:
        result = mi.solve_manual_puzzle(
            req.board, 
            req.target_rows, 
            req.target_cols, 
            req.operation
        )
        
        # Add solution statistics if solutions were found
        if result["success"] and result["all_solutions"]:
            result["solution_stats"] = mi.get_solution_stats(result["all_solutions"])
        else:
            result["solution_stats"] = mi.get_solution_stats([])
        
        # Keep all_solutions for navigation in frontend
        # result.pop("all_solutions", None)
        
        print(f"Backend returning: success={result.get('success')}, total_solutions={result.get('total_solutions')}, all_solutions_length={len(result.get('all_solutions', []))}")
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "optimal_solution": None,
            "marked_count": 0,
            "total_solutions": 0,
            "validation_errors": [f"שגיאה פנימית: {str(e)}"],
            "solution_stats": mi.get_solution_stats([])
        }
