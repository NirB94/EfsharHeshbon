"""
core_logic.py

This module provides the core logic for solving and generating puzzle boards.

Functions included:
- find_matching_subsets: Find all subsets of indices in a row that match a target.
- is_partial_valid_columns: Check column validity up to a specific row.
- is_valid_columns: Validate all columns against their targets.
- count_marked: Count number of marked cells in a grid.
- solve_minimal: Recursively find minimal-marked solution.
- generate_board: Generate a random board.
- compute_targets: Compute row/column targets from a board.
- weighted_choice: Randomly choose number of elements using weighted probability.
- generate_board_from_solution: Generate a puzzle board with a guaranteed solution.
"""

import operator
from itertools import combinations
from functools import reduce
import sys
import random

def find_matching_subsets(values, target, op):
    """
    Find all index subsets in 'values' where applying 'op' gives 'target'.
    Returns a list of sets of indices.
    """
    matching = []
    for r in range(1, len(values) + 1):
        for combo in combinations(enumerate(values), r):
            indices, nums = zip(*combo)
            result = reduce(op, nums)
            if result == target:
                matching.append(set(indices))
    return matching

def is_partial_valid_columns(grid, row_idx, board, target_cols, op):
    """
    Validate columns up to row_idx for partial correctness.
    Returns False early if a column already exceeds its target.
    """
    for col in range(len(grid[0])):
        values = [
            board[r][col]
            for r in range(row_idx + 1)
            if grid[r][col] == 1
        ]
        if not values:
            continue
        result = reduce(op, values)
        if result > target_cols[col]:
            return False
        if op == operator.mul and result == 0 and target_cols[col] != 0:
            return False
    return True

def is_valid_columns(grid, board, target_cols, op):
    """
    Check if all columns match their target values.
    """
    for col in range(len(grid[0])):
        values = [
            board[r][col]
            for r in range(len(board))
            if grid[r][col] == 1
        ]
        if not values:
            return False
        result = reduce(op, values)
        if result != target_cols[col]:
            return False
    return True

def count_marked(grid):
    """
    Count the number of marked cells (value == 1) in the grid.
    """
    return sum(sum(row) for row in grid)

def solve_minimal(grid, row_idx, board, target_rows, target_cols, op, row_possibilities, best_solution):
    """
    Recursively find the solution with the minimal number of marked cells.
    Updates best_solution in place.
    """
    if row_idx == len(board):
        if is_valid_columns(grid, board, target_cols, op):
            marked = count_marked(grid)
            if marked < best_solution[0]:
                best_solution[0] = marked
                best_solution[1] = [row[:] for row in grid]
        return

    for row_option in row_possibilities[row_idx]:
        new_row = [1 if i in row_option else 0 for i in range(len(board[0]))]
        grid[row_idx] = new_row

        if is_partial_valid_columns(grid, row_idx, board, target_cols, op):
            solve_minimal(grid, row_idx + 1, board, target_rows, target_cols, op, row_possibilities, best_solution)

    grid[row_idx] = [0] * len(board[0])

def generate_board(rows, cols, min_val=1, max_val=9):
    """
    Generate a random board of given size with values between min_val and max_val.
    """
    return [[random.randint(min_val, max_val) for _ in range(cols)] for _ in range(rows)]

def compute_targets(board, operation):
    """
    Compute target values for each row and column based on the operation.
    """
    rows_targets = []
    cols_targets = []

    for row in board:
        val = sum(row) if operation == '+' else eval('*'.join(map(str, row)))
        rows_targets.append(val)

    for col in zip(*board):
        val = sum(col) if operation == '+' else eval('*'.join(map(str, col)))
        cols_targets.append(val)

    return rows_targets, cols_targets

def weighted_choice(weights):
    """
    Choose an index from 1 to len(weights) based on the given weight distribution.
    """
    total = sum(weights)
    r = random.uniform(0, total)
    upto = 0
    for i, w in enumerate(weights):
        if upto + w >= r:
            return i + 1
        upto += w
    return len(weights)

def generate_board_from_solution(operation: str, size: int = 5, max_target: int = 99):
    """
    Generate a puzzle board with a guaranteed solution grid and valid targets.
    Ensures that all column and row targets are achievable within limits.
    """
    op = operator.mul if operation == '*' else operator.add
    board = []
    solution_grid = []
    row_solutions = []

    valid_digits = list(range(2, 10)) if operation == '*' else list(range(1, 10))

    for _ in range(size):
        count = weighted_choice([0.1, 0.3, 0.3, 0.2, 0.1])
        solution_indices = random.sample(range(size), count)
        solution_values = [random.choice(valid_digits) for _ in range(count)]
        target = reduce(op, solution_values)

        while target > max_target:
            solution_values = [random.choice(valid_digits) for _ in range(count)]
            target = reduce(op, solution_values)

        row = solution_values + [random.choice(valid_digits) for _ in range(size - count)]
        random.shuffle(row)

        solution_row = [0] * size
        row_solution_vals = []

        for i, val in enumerate(row):
            if len(row_solution_vals) < count and val in solution_values:
                solution_row[i] = 1
                row_solution_vals.append(val)
                solution_values.remove(val)

        board.append(row)
        solution_grid.append(solution_row)
        row_solutions.append(target)

    col_targets = []
    for j in range(size):
        col_values = [board[i][j] for i in range(size) if solution_grid[i][j] == 1]
        target = reduce(op, col_values) if col_values else 0
        if target > max_target:
            return generate_board_from_solution(operation, size, max_target)
        col_targets.append(target)

    return board, row_solutions, col_targets, solution_grid
