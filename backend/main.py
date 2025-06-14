from fastapi import FastAPI, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import core_logic as cl
import operator

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

class GameRequest(BaseModel):
    """
    Request body schema for the /new_game endpoint.
    """
    operation: str

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
        request (GameRequest): Requested operation ('*' or '+').

    Returns:
        dict: Puzzle board and targets, including minimal solution if found.
    """
    operation = request.operation
    for _ in range(20):
        board, target_rows, target_cols, solution = cl.generate_board_from_solution(operation, size=5)
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
                "marked_count": best_solution[0]
            }

    return {"error": "Failed to generate a valid board. Please try again."}
