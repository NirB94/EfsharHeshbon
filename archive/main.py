import operator
import sys
from core_logic import (
    find_matching_subsets,
    solve_minimal
)

revealed_hints = set()

def show_hint(solution_grid):
    for i in range(len(solution_grid)):
        for j in range(len(solution_grid[0])):
            if solution_grid[i][j] == 1 and (i, j) not in revealed_hints:
                revealed_hints.add((i, j))
                return i, j
    return None

def print_board_with_hints(board, revealed_hints):
    print("\nCurrent Board with Hints:")
    for i in range(len(board)):
        row_display = ""
        for j in range(len(board[0])):
            if (i, j) in revealed_hints:
                row_display += "✔ "
            else:
                row_display += "? "
        print(row_display)

def print_full_solution(solution_grid):
    print("\nFull Solution:")
    for row in solution_grid:
        print(" ".join("✔" if cell else "✖" for cell in row))

def get_user_input():
    print("בחר פעולה: + או *")
    user_op = input(">> ").strip()
    op = operator.add if user_op == "+" else operator.mul

    print("הכנס מטריצת מספרים, שורה בכל פעם (הפרד בפסיקים). סיים ב-enter ריק:")
    board = []
    while True:
        line = input()
        if not line:
            break
        board.append([int(x.strip()) for x in line.split(',')])

    rows = len(board)
    cols = len(board[0])

    print(f"הכנס {rows} ערכי יעד לשורות (מופרדים בפסיקים):")
    target_rows = [int(x.strip()) for x in input(">> ").split(',')]

    print(f"הכנס {cols} ערכי יעד לעמודות (מופרדים בפסיקים):")
    target_cols = [int(x.strip()) for x in input(">> ").split(',')]

    return board, target_rows, target_cols, op

def run_game(board, target_rows, target_cols, op):
    global revealed_hints
    revealed_hints = set()

    row_possibilities = [
        find_matching_subsets(row, target, op)
        for row, target in zip(board, target_rows)
    ]

    if any(len(p) == 0 for p in row_possibilities):
        print("אין פתרון: לפחות שורה אחת לא יכולה להגיע ליעד שלה.")
        return

    empty_grid = [[0] * len(board[0]) for _ in range(len(board))]
    best_solution = [sys.maxsize, None]

    solve_minimal(empty_grid, 0, board, target_rows, target_cols, op, row_possibilities, best_solution)

    if best_solution[1] is None:
        print("לא נמצא פתרון.")
        return

    print(f"\nנמצא פתרון עם {best_solution[0]} תאים מסומנים.")

    while True:
        print("\nאפשרויות:")
        print("1 - הצג לוח עם רמזים שנחשפו")
        print("2 - גלה רמז נוסף")
        print("3 - הצג את הפתרון המלא")
        print("4 - יציאה")
        choice = input("בחר אפשרות: ").strip()

        if choice == "1":
            print_board_with_hints(best_solution[1], revealed_hints)
        elif choice == "2":
            hint = show_hint(best_solution[1])
            if hint:
                i, j = hint
                print(f"רמז: תא בשורה {i + 1}, עמודה {j + 1} הוא חלק מהפתרון ✔")
            else:
                print("אין עוד רמזים לחשוף.")
        elif choice == "3":
            print_full_solution(best_solution[1])
        elif choice == "4":
            print("להתראות!")
            break
        else:
            print("בחירה לא חוקית. נסה שוב.")

def main():
    while True:
        print("\nברוך הבא! בחר פעולה:")
        print("1 - לטעון לוח מוכן מראש")
        print("2 - להזין לוח ידנית")
        print("3 - יציאה")
        choice = input(">> ").strip()

        if choice == "1":
            board = [
                [9, 3, 3, 9, 2],
                [3, 3, 8, 4, 3],
                [3, 9, 8, 3, 3],
                [5, 3, 2, 4, 2],
                [3, 8, 4, 4, 6]
            ]
            target_rows = [18, 72, 27, 24, 96]
            target_cols = [81, 72, 32, 12, 36]
            op = operator.mul
            run_game(board, target_rows, target_cols, op)
        elif choice == "2":
            board, target_rows, target_cols, op = get_user_input()
            run_game(board, target_rows, target_cols, op)
        elif choice == "3":
            print("להתראות!")
            break
        else:
            print("בחירה לא חוקית. נסה שוב.")

if __name__ == "__main__":
    main()
