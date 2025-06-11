# Puzzle Grid Game

Inspired by a logic puzzle featured on **Haaretz.co.il**, this app brings the addictive number grid challenge to life with a sleek, interactive interface.

## Overview

This app challenges players to solve grid-based puzzles by selecting the correct cells that match row and column targets. Each puzzle has a specific operation (addition or multiplication), and the goal is to reach the target values for all rows and columns.

## Features

- 🎯 **Dynamic Targets**: Each row and column has a target number the player must match.  
- ✨ **Intuitive UI**: Clean, responsive design that works great on both desktop and mobile.  
- 🌙 **Dark/Light Mode**: Easily switch themes, with persistent settings saved across sessions.  
- ❌ **Forbidden Cells**: Mark cells as unusable (e.g., via a small ‘X’) to aid logical deduction.  
- 💡 **Hint System**: Get help identifying one incorrect cell at a time.  
- ✅ **Auto-solve Detection**: Instantly notifies players when the puzzle is correctly completed.  
- 📱 **Touch-Friendly**: Designed with mobile interactions in mind, including large buttons and layout adaptation.  
- 🌐 **Hebrew RTL Support**: Full right-to-left language support for Hebrew users.  

## Tech Stack

- **Frontend**: React (with custom CSS for layout and responsiveness)  
- **Backend**: FastAPI (handling puzzle generation and validation)  
- **State Persistence**: LocalStorage for theme and user preferences  

## Coming Soon

- 📤 Export & share puzzles  
- 🧩 Puzzle editor for custom grids  
