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
- find_common_factors: Find common factors between row and column targets.
- get_smart_non_marked_number: Choose a smart number for a non-marked cell.
- evaluate_board_confusion: Evaluate how confusing a board is based on common factors and potential misleading paths.
- get_ultra_confusing_number: Ultra-confusing number selection for extreme hard mode.
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

def get_confusing_numbers(target, operation, valid_digits):
    """
    Generate numbers that could be confusing for the target in hard mode.
    Focus on medium-sized targets with many factors for maximum confusion.
    """
    confusing = []
    
    if operation == '*':
        # For multiplication, focus on factors and numbers that create similar products
        factors = [n for n in valid_digits if target > 0 and target % n == 0]
        confusing.extend(factors)
        
        # Add numbers that when combined with factors give products close to target
        for factor in factors:
            remaining = target // factor
            if remaining in valid_digits:
                confusing.append(remaining)
            
            # Add numbers that create products within ±30% of target
            for n in valid_digits:
                product = factor * n
                if 0.7 * target <= product <= 1.3 * target and product != target:
                    confusing.append(n)
        
        # Add common factor combinations that could mislead
        common_factors = [2, 3, 4, 6]  # These create many confusing combinations
        for cf in common_factors:
            if cf in valid_digits:
                confusing.append(cf)
                # Add multiples of common factors
                for mult in [2, 3]:
                    val = cf * mult
                    if val in valid_digits:
                        confusing.append(val)
        
        # For targets with many factors, add all small numbers that could be factors
        if len(factors) >= 3:  # Target has many factors
            confusing.extend([n for n in valid_digits if n <= 6])
    
    else:  # addition
        # For addition, avoid too many 1s which make puzzles too easy
        # Focus on numbers that create multiple valid combinations
        
        # Minimize 1s - only add if target is very small
        if target <= 6:
            confusing.append(1)
        
        # Add numbers that can create multiple sum combinations
        # Focus on numbers in the middle range (2-7) for better confusion
        middle_range = [n for n in valid_digits if 2 <= n <= 7]
        
        # For each possible number, check how many ways it can contribute to the target
        contribution_count = {}
        for n in middle_range:
            count = 0
            # Count how many other numbers it can pair with to approach the target
            for other in middle_range:
                if n != other and 2 <= n + other <= target:
                    count += 1
                # Also consider three-number combinations
                for third in middle_range:
                    if n != other and n != third and other != third:
                        if 3 <= n + other + third <= target:
                            count += 1
            contribution_count[n] = count
        
        # Sort by contribution potential (most versatile numbers first)
        versatile_numbers = sorted(contribution_count.keys(), key=lambda x: contribution_count[x], reverse=True)
        
        # Add the most versatile numbers
        confusing.extend(versatile_numbers[:5])  # Take top 5 most versatile
        
        # Add numbers that are close to target/2, target/3, etc. but avoid 1
        fractions = [target // 2, target // 3, target // 4]
        for frac in fractions:
            for offset in [-2, -1, 0, 1, 2]:
                val = frac + offset
                if val in valid_digits and val > 1:  # Exclude 1
                    confusing.append(val)
        
        # Add numbers that can sum to target in multiple ways, but prefer larger numbers
        for n in valid_digits:
            if 2 <= n < target:  # Start from 2, not 1
                complement = target - n
                if complement in valid_digits and complement != n and complement > 1:
                    confusing.append(n)
                    confusing.append(complement)
        
        # For larger targets, add numbers that can create "false paths"
        if target >= 10:
            # Add numbers that are roughly target/3 to target/2 (good for 3-4 number combinations)
            false_path_range = [n for n in valid_digits if target // 4 <= n <= target // 2 and n > 1]
            confusing.extend(false_path_range)
        
        # Ensure we don't have too many 1s by filtering them out if we have enough other options
        ones_count = confusing.count(1)
        if ones_count > 1:  # If we have more than one 1, remove the extras
            while confusing.count(1) > 1:
                confusing.remove(1)
    
    # Remove duplicates and ensure variety
    confusing = list(set(confusing))
    
    # For addition, ensure 1s don't dominate - limit to at most 2 instances in the final selection
    if operation == '+':
        confusing_no_ones = [n for n in confusing if n != 1]
        if 1 in confusing and len(confusing_no_ones) >= 3:
            # Keep at most one 1 if we have good alternatives
            confusing = confusing_no_ones + [1]
    
    # Ensure we have enough confusing numbers
    while len(confusing) < 4 and len(confusing) < len(valid_digits):
        remaining = [n for n in valid_digits if n not in confusing]
        if remaining:
            # For addition, prefer non-1 numbers when expanding
            if operation == '+':
                non_ones = [n for n in remaining if n != 1]
                if non_ones:
                    confusing.append(random.choice(non_ones))
                else:
                    confusing.append(random.choice(remaining))
            else:
                confusing.append(random.choice(remaining))
        else:
            break
    
    return confusing if confusing else valid_digits

def generate_smart_numbers(target, operation, valid_digits, difficulty):
    """
    Generate numbers based on difficulty level and target constraints.
    """
    if difficulty == "easy":
        # Easy mode: avoid numbers larger than target for small targets
        if operation == '+' and target < 9:
            return [n for n in valid_digits if n <= target]
        elif operation == '*' and target < 20:
            return [n for n in valid_digits if n <= 5]
        else:
            return valid_digits
    
    elif difficulty == "medium":
        # Medium mode: some constraint on large numbers
        if operation == '+' and target < 15:
            return [n for n in valid_digits if n <= target + 2]
        elif operation == '*' and target < 50:
            return [n for n in valid_digits if n <= 7]
        else:
            return valid_digits
    
    else:  # hard
        # Hard mode: use confusing numbers
        return get_confusing_numbers(target, operation, valid_digits)

def generate_board_from_solution(operation: str, size: int = 5, max_target: int = 99, difficulty: str = "medium"):
    """
    Generate a puzzle board with a guaranteed solution grid and valid targets.
    Ensures that all column and row targets are achievable within limits.
    
    Args:
        operation: Either '*' or '+'
        size: Size of the board (default 5x5)
        max_target: Maximum target value allowed
        difficulty: One of 'easy', 'medium', 'hard'
    """
    op = operator.mul if operation == '*' else operator.add
    board = []
    solution_grid = []
    row_solutions = []

    # Define valid digits based on operation
    if operation == '*':
        valid_digits = list(range(2, 10))
    else:
        valid_digits = list(range(1, 10))

    # Track if we already have a single-cell row
    has_single_cell_row = False

    for row_idx in range(size):
        # Use same probability weights for all difficulty levels
        # But limit single-cell rows to maximum 1 per board
        if has_single_cell_row:
            # If we already have a single-cell row, exclude it from possibilities
            weights = [0, 0.44, 0.44, 0.06, 0.06]  # Redistribute the 0.1 probability
        else:
            weights = [0.1, 0.4, 0.4, 0.05, 0.05]
        
        count = weighted_choice(weights)
        
        # Track if this is a single-cell row
        if count == 1:
            has_single_cell_row = True
        
        solution_indices = random.sample(range(size), count)
        
        # Generate solution values with difficulty-based constraints
        solution_values = []
        
        if difficulty == "hard":
            # Hard mode: create medium-sized targets with many factors (more confusing)
            if operation == '*':
                # For multiplication in hard mode, aim for numbers with many factors
                # Include both even and odd numbers with good factor potential
                preferred_targets = [12, 15, 18, 20, 21, 24, 28, 30, 35, 36, 42, 45, 48, 60, 63, 72]
                max_attempts = 50
                attempts = 0
                
                while attempts < max_attempts:
                    solution_values = []
                    for _ in range(count):
                        # Prefer numbers that create targets with many factors
                        # Include more variety for odd targets
                        val = random.choices(valid_digits, weights=[1,4,5,6,4,4,3,2])[0]  # Favor 3,4,5,6
                        solution_values.append(val)
                    
                    target = reduce(op, solution_values)
                    # Accept if target is in preferred range or has many factors
                    factors_count = len([n for n in range(2, 10) if target % n == 0])
                    if (target in preferred_targets or 
                        (10 <= target <= 80 and factors_count >= 3)):
                        break
                    attempts += 1
                
                if attempts == max_attempts:
                    # Fallback: try to create a target with at least some factors
                    solution_values = []
                    for _ in range(count):
                        val = random.choice([2, 3, 4, 5, 6, 7])  # Include 5,7 for odd targets
                        solution_values.append(val)
                    target = reduce(op, solution_values)
            else:
                # For addition in hard mode, create medium targets that can be formed in multiple ways
                # Avoid using too many 1s to prevent easy elimination
                preferred_range = range(12, 28)  # Expanded range for more variety
                max_attempts = 50
                attempts = 0
                
                while attempts < max_attempts:
                    solution_values = []
                    ones_used = 0  # Track how many 1s we use
                    max_ones = 1   # Limit 1s to maximum 1 per solution
                    
                    for _ in range(count):
                        # Heavily bias against 1s, prefer 2-7 for better confusion
                        if ones_used >= max_ones:
                            # No more 1s allowed, choose from 2-9
                            val = random.choices([2,3,4,5,6,7,8,9], weights=[6,6,5,5,4,4,2,1])[0]
                        else:
                            # Allow 1s but with low probability
                            val = random.choices(valid_digits, weights=[1,6,6,5,5,4,4,2,1])[0]
                            if val == 1:
                                ones_used += 1
                        solution_values.append(val)
                    
                    target = reduce(op, solution_values)
                    if target in preferred_range:
                        break
                    attempts += 1
                
                if attempts == max_attempts:
                    # Fallback: create solution with minimal 1s
                    solution_values = []
                    solution_values.append(random.choice([2,3,4,5,6]))  # First number is never 1
                    for _ in range(count - 1):
                        val = random.choices([1,2,3,4,5,6,7], weights=[1,4,4,4,3,3,2])[0]
                        solution_values.append(val)
                    target = reduce(op, solution_values)
        else:
            # Easy and medium modes - still limit 1s for better challenge
            ones_used = 0
            max_ones = 2 if difficulty == "easy" else 1  # Easy allows more 1s than medium
            
            for _ in range(count):
                if operation == '+' and ones_used >= max_ones:
                    # No more 1s, choose from 2-9
                    val = random.choice([2,3,4,5,6,7,8,9])
                elif operation == '+':
                    # Allow 1s but with some bias against them
                    val = random.choices(valid_digits, weights=[2,4,4,4,3,3,3,3,2])[0]
                    if val == 1:
                        ones_used += 1
                else:
                    val = random.choice(valid_digits)
                solution_values.append(val)
            target = reduce(op, solution_values)
        
        # Ensure target is within limits
        while target > max_target:
            solution_values = [random.choice(valid_digits) for _ in range(count)]
            target = reduce(op, solution_values)

        # Generate remaining numbers for the row based on difficulty
        remaining_count = size - count
        remaining_values = []
        
        if difficulty == "hard":
            # In hard mode, use smart placement for non-marked numbers
            # We need to know the column targets, but they're not calculated yet
            # So we'll do this in a second pass after all rows are generated
            smart_digits = generate_smart_numbers(target, operation, valid_digits, difficulty)
            for _ in range(remaining_count):
                val = random.choice(smart_digits)
                remaining_values.append(val)
        else:
            smart_digits = generate_smart_numbers(target, operation, valid_digits, difficulty)
            for _ in range(remaining_count):
                val = random.choice(smart_digits)
                remaining_values.append(val)

        # Combine and shuffle
        row = solution_values + remaining_values
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

    # Generate column targets
    col_targets = []
    for j in range(size):
        col_values = [board[i][j] for i in range(size) if solution_grid[i][j] == 1]
        target = reduce(op, col_values) if col_values else 0
        if target > max_target:
            return generate_board_from_solution(operation, size, max_target, difficulty)
        col_targets.append(target)

    # Second pass: In hard mode, replace non-marked numbers with smarter choices
    if difficulty == "hard":
        for row_idx in range(size):
            for col_idx in range(size):
                if solution_grid[row_idx][col_idx] == 0:  # Non-marked cell
                    # Collect existing numbers in this row for variety
                    existing_numbers = [board[row_idx][k] for k in range(size) if k != col_idx]
                    
                    # Use ultra-confusing number selection for maximum challenge
                    smart_number = get_ultra_confusing_number(
                        row_idx, col_idx, 
                        row_solutions[row_idx], col_targets,
                        valid_digits, existing_numbers, board, solution_grid
                    )
                    board[row_idx][col_idx] = smart_number

        # Evaluate confusion level and regenerate if not confusing enough
        confusion_score = evaluate_board_confusion(board, row_solutions, col_targets, solution_grid, valid_digits)
        min_confusion_threshold = 400  # Much higher threshold for ultra-hard mode
        
        if confusion_score < min_confusion_threshold:
            # Try to regenerate a more confusing board (but don't loop infinitely)
            return generate_board_from_solution(operation, size, max_target, difficulty)

    return board, row_solutions, col_targets, solution_grid

def find_common_factors(row_target, col_target, valid_digits):
    """
    Find common factors between row and column targets that are in valid_digits.
    Returns smaller factors first to create maximum confusion.
    """
    if row_target <= 0 or col_target <= 0:
        return []
    
    common_factors = []
    for n in valid_digits:
        if row_target % n == 0 and col_target % n == 0:
            common_factors.append(n)
    
    # Sort by size (smaller factors first for more confusion)
    common_factors.sort()
    return common_factors

def get_smart_non_marked_number(row_idx, col_idx, row_target, col_targets, valid_digits, existing_board_numbers):
    """
    Choose a smart number for a non-marked cell based on row and column targets.
    Prioritizes common factors between row and column targets.
    """
    col_target = col_targets[col_idx]
    
    # Find common factors between row and column targets
    common_factors = find_common_factors(row_target, col_target, valid_digits)
    
    # Score each valid digit based on confusion potential
    confusion_scores = {}
    
    for digit in valid_digits:
        score = 0
        
        # High score for common factors (maximum confusion)
        if digit in common_factors:
            score += 100
        
        # Medium score for factors of either target
        if row_target % digit == 0:
            score += 50
        if col_target % digit == 0:
            score += 50
        
        # Bonus for smaller numbers (they appear as factors more often)
        if digit <= 4:
            score += 20
        
        # Penalty for numbers already used in this row (for variety)
        if digit in existing_board_numbers:
            score -= 30
        
        # Bonus for numbers that are factors of multiple targets
        factor_count = 0
        if row_target % digit == 0:
            factor_count += 1
        if col_target % digit == 0:
            factor_count += 1
        score += factor_count * 25
        
        confusion_scores[digit] = score
    
    # Sort by score (highest first), then by size (smallest first for ties)
    sorted_digits = sorted(confusion_scores.keys(), key=lambda x: (-confusion_scores[x], x))
    
    # Add some randomness - pick from top 3 candidates
    top_candidates = sorted_digits[:3]
    if top_candidates:
        return random.choice(top_candidates)
    else:
        return random.choice(valid_digits)

def evaluate_board_confusion(board, row_targets, col_targets, solution_grid, valid_digits):
    """
    Evaluate how confusing a board is based on common factors and potential misleading paths.
    Returns a confusion score (higher is more confusing).
    """
    confusion_score = 0
    size = len(board)
    
    # Score based on common factors between row and column targets
    for row_idx in range(size):
        for col_idx in range(size):
            if solution_grid[row_idx][col_idx] == 0:  # Non-marked cell
                row_target = row_targets[row_idx]
                col_target = col_targets[col_idx]
                cell_value = board[row_idx][col_idx]
                
                # High score if the cell value is a common factor
                common_factors = find_common_factors(row_target, col_target, valid_digits)
                if cell_value in common_factors:
                    confusion_score += 50
                
                # Medium score if it's a factor of either target
                if row_target % cell_value == 0 or col_target % cell_value == 0:
                    confusion_score += 25
    
    # Bonus for targets with many factors (more potential for confusion)
    for target in row_targets + col_targets:
        if target > 0:
            factors = [n for n in valid_digits if target % n == 0]
            if len(factors) >= 4:
                confusion_score += 30
            elif len(factors) >= 3:
                confusion_score += 15
    
    return confusion_score

def get_ultra_confusing_number(row_idx, col_idx, row_target, col_targets, valid_digits, existing_board_numbers, board, solution_grid):
    """
    Ultra-confusing number selection for extreme hard mode.
    Creates numbers that could plausibly be part of multiple different solutions.
    """
    col_target = col_targets[col_idx]
    
    # Find all factors of both targets
    row_factors = [n for n in valid_digits if row_target % n == 0]
    col_factors = [n for n in valid_digits if col_target % n == 0]
    common_factors = [n for n in row_factors if n in col_factors]
    
    # Look for numbers that create "false paths" - numbers that could be part of
    # alternative solutions but aren't part of the real solution
    confusion_candidates = []
    
    # Add common factors with extremely high priority (maximum confusion)
    for factor in common_factors:
        confusion_candidates.append((factor, 150))
    
    # Add numbers that could create alternative valid combinations
    for digit in valid_digits:
        score = 0
        
        # Check if this number could create a valid row combination
        marked_positions = [i for i in range(len(board[row_idx])) if solution_grid[row_idx][i] == 1 and i != col_idx]
        if marked_positions:
            marked_values = [board[row_idx][i] for i in marked_positions]
            op = operator.mul if row_target > 15 else operator.add
            test_result = reduce(op, marked_values + [digit])
            if test_result == row_target:
                score += 120  # This creates a false valid row - very confusing!
        
        # Check if this number could create a valid column combination
        marked_col_positions = [i for i in range(len(board)) if i != row_idx and solution_grid[i][col_idx] == 1]
        if marked_col_positions:
            marked_col_values = [board[i][col_idx] for i in marked_col_positions]
            op = operator.mul if col_target > 15 else operator.add
            test_result = reduce(op, marked_col_values + [digit])
            if test_result == col_target:
                score += 120  # This creates a false valid column - very confusing!
        
        # Super bonus for being a factor of both targets (creates maximum confusion)
        if digit in row_factors and digit in col_factors:
            score += 100
        # Bonus for being a factor of either target
        elif digit in row_factors:
            score += 60
        elif digit in col_factors:
            score += 60
            
        # Look for numbers that could be part of multiple factor combinations
        # This creates situations where players think they found a pattern but it's wrong
        factor_combo_bonus = 0
        for other_factor in row_factors:
            if other_factor != digit and digit * other_factor <= max(valid_digits) * 2:
                factor_combo_bonus += 20
        for other_factor in col_factors:
            if other_factor != digit and digit * other_factor <= max(valid_digits) * 2:
                factor_combo_bonus += 20
        score += min(factor_combo_bonus, 80)  # Cap the bonus
        
        # Small penalty for already being used (but not too much - we want some repetition for confusion)
        if digit in existing_board_numbers:
            score -= 10
            
        # Bonus for small numbers that are commonly used in calculations
        if digit <= 4:
            score += 30
            
        if score > 0:
            confusion_candidates.append((digit, score))
    
    if confusion_candidates:
        # Sort by score and add some randomness to top candidates
        confusion_candidates.sort(key=lambda x: x[1], reverse=True)
        # Take top 3 candidates and choose randomly among them
        top_candidates = [x[0] for x in confusion_candidates[:3]]
        return random.choice(top_candidates)
    
    # Fallback - prefer common factors or small numbers
    if common_factors:
        return random.choice(common_factors)
    small_factors = [n for n in valid_digits if n <= 4]
    return random.choice(small_factors) if small_factors else random.choice(valid_digits)
