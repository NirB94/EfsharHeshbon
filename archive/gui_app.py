import tkinter as tk
from tkinter import messagebox
from functools import partial
from core_logic import find_matching_subsets, solve_minimal
import operator

class PuzzleApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Puzzle Solver GUI")
        self.main_menu()

    def main_menu(self):
        self.clear_root()
        frame = tk.Frame(self.root)
        frame.pack(pady=40)

        tk.Label(frame, text="Welcome to Puzzle Solver", font=("Arial", 16)).pack(pady=10)

        tk.Button(frame, text="Start with predefined puzzle", width=30, command=self.load_predefined).pack(pady=5)
        tk.Button(frame, text="Enter puzzle manually", width=30, command=self.load_manual_input).pack(pady=5)
        tk.Button(frame, text="Exit", width=30, command=self.root.quit).pack(pady=5)

    def load_predefined(self):
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
        self.start_game(board, target_rows, target_cols, op)

    def load_manual_input(self):
        self.clear_root()
        self.manual_frame = tk.Frame(self.root)
        self.manual_frame.pack(pady=20)

        self.manual_board = []
        self.board_entries = []

        tk.Label(self.manual_frame, text="Enter rows one by one (comma-separated numbers):").pack()
        self.row_entry = tk.Entry(self.manual_frame, width=30)
        self.row_entry.pack()
        tk.Button(self.manual_frame, text="Add row", command=self.add_row).pack(pady=5)

        self.rows_display = tk.Label(self.manual_frame, text="", font=("Courier", 10))
        self.rows_display.pack()

        tk.Label(self.manual_frame, text="Target rows (comma-separated):").pack(pady=5)
        self.target_rows_entry = tk.Entry(self.manual_frame, width=40)
        self.target_rows_entry.pack()

        tk.Label(self.manual_frame, text="Target columns (comma-separated):").pack(pady=5)
        self.target_cols_entry = tk.Entry(self.manual_frame, width=40)
        self.target_cols_entry.pack()

        tk.Label(self.manual_frame, text="Operation (* or +):").pack(pady=5)
        self.op_var = tk.StringVar(value="*")
        tk.Entry(self.manual_frame, textvariable=self.op_var, width=5).pack()

        tk.Button(self.manual_frame, text="Solve", command=self.solve_manual_input).pack(pady=10)
        tk.Button(self.manual_frame, text="Back to Menu", command=self.main_menu).pack()

    def add_row(self):
        row_text = self.row_entry.get().strip()
        try:
            row = [int(x.strip()) for x in row_text.split(',')]
            if self.manual_board and len(row) != len(self.manual_board[0]):
                messagebox.showerror("Error", "All rows must have the same length.")
                return
            self.manual_board.append(row)
            self.board_entries.append(row_text)
            self.rows_display.config(text="\n".join(self.board_entries))
            self.row_entry.delete(0, tk.END)
        except ValueError:
            messagebox.showerror("Error", "Invalid row format. Use comma-separated integers.")

    def solve_manual_input(self):
        try:
            target_rows = [int(x.strip()) for x in self.target_rows_entry.get().split(',')]
            target_cols = [int(x.strip()) for x in self.target_cols_entry.get().split(',')]
            op_str = self.op_var.get().strip()
            op = operator.mul if op_str == "*" else operator.add

            if len(target_rows) != len(self.manual_board):
                raise ValueError("Number of row targets must match number of rows")
            if len(target_cols) != len(self.manual_board[0]):
                raise ValueError("Number of column targets must match number of columns")

            self.start_game(self.manual_board, target_rows, target_cols, op)

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def start_game(self, board, target_rows, target_cols, op):
        self.board = board
        self.target_rows = target_rows
        self.target_cols = target_cols
        self.op = op
        self.ROWS = len(board)
        self.COLS = len(board[0])
        self.user_grid = [[0] * self.COLS for _ in range(self.ROWS)]
        self.revealed_hints = set()

        row_possibilities = [
            find_matching_subsets(row, target, op)
            for row, target in zip(board, target_rows)
        ]

        empty_grid = [[0] * self.COLS for _ in range(self.ROWS)]
        best_solution = [float("inf"), None]
        solve_minimal(empty_grid, 0, board, target_rows, target_cols, op, row_possibilities, best_solution)

        if best_solution[1] is None:
            messagebox.showerror("Error", "No valid solution found.")
            self.main_menu()
            return

        self.solution_grid = best_solution[1]
        self.build_game_ui()

    def build_game_ui(self):
        self.clear_root()
        self.button_grid = []

        for i in range(self.ROWS):
            row_buttons = []
            for j in range(self.COLS):
                btn = tk.Button(self.root, text=str(self.board[i][j]), width=5, height=2,
                                command=partial(self.toggle_cell, i, j))
                btn.grid(row=i, column=j, padx=2, pady=2)
                row_buttons.append(btn)
            self.button_grid.append(row_buttons)

        controls = tk.Frame(self.root)
        controls.grid(row=self.ROWS, column=0, columnspan=self.COLS, pady=10)

        tk.Button(controls, text="Hint", command=self.show_hint).pack(side=tk.LEFT, padx=5)
        tk.Button(controls, text="Show Solution", command=self.show_solution).pack(side=tk.LEFT, padx=5)
        tk.Button(controls, text="Check My Solution", command=self.check_solution).pack(side=tk.LEFT, padx=5)
        tk.Button(controls, text="Back to Menu", command=self.main_menu).pack(side=tk.LEFT, padx=5)

    def toggle_cell(self, i, j):
        if (i, j) in self.revealed_hints:
            return
        self.user_grid[i][j] ^= 1
        self.update_button_colors()

    def show_hint(self):
        for i in range(self.ROWS):
            for j in range(self.COLS):
                if self.solution_grid[i][j] == 1 and (i, j) not in self.revealed_hints:
                    self.revealed_hints.add((i, j))
                    self.update_button_colors()
                    return
        messagebox.showinfo("Hint", "All hints revealed!")

    def show_solution(self):
        for i in range(self.ROWS):
            for j in range(self.COLS):
                self.user_grid[i][j] = self.solution_grid[i][j]
        self.update_button_colors()

    def check_solution(self):
        if self.user_grid == self.solution_grid:
            messagebox.showinfo("Result", "Correct! Well done.")
        else:
            messagebox.showwarning("Result", "Incorrect. Try again.")

    def update_button_colors(self):
        for i in range(self.ROWS):
            for j in range(self.COLS):
                btn = self.button_grid[i][j]
                if (i, j) in self.revealed_hints:
                    btn.config(bg="lightgreen")
                elif self.user_grid[i][j] == 1:
                    btn.config(bg="lightblue")
                else:
                    btn.config(bg="SystemButtonFace")

    def clear_root(self):
        for widget in self.root.winfo_children():
            widget.destroy()


if __name__ == "__main__":
    root = tk.Tk()
    app = PuzzleApp(root)
    root.mainloop()
