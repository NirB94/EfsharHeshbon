# Puzzle Grid Game

Inspired by a logic puzzle featured on **Haaretz.co.il**, this project brings the number-based grid challenge into a modern, interactive web app.  
It was built as a personal project to explore and demonstrate full-stack development skills, with attention to responsive design, clean architecture, and a thoughtful user experience.

## Overview

Players solve grid-based puzzles by selecting the correct cells to match row and column targets. Each puzzle is based on a specific operation (addition or multiplication), and the goal is to reach all target values simultaneously.

This app was designed to work seamlessly across desktop and mobile devices, support both dark and light modes, and provide meaningful feedback to users — all while maintaining a lightweight and responsive UI.

## Key Features

- 🎯 **Target-Based Logic**: Each row and column has a numeric goal based on sum or product.  
- 🌐 **Right-to-Left (RTL) Support**: Full Hebrew support, including mirrored layout and fonts.  
- 📱 **Mobile-First Design**: Optimized layout and touch-friendly UI for mobile users.  
- 🌙 **Dark/Light Mode**: Theme selection is persistent and respects user preference.  
- ❌ **Forbidden Cells**: Mark certain cells as unusable to assist with logical deduction.  
- 💡 **Hint System**: Highlights one incorrect cell to help users correct mistakes without giving away full answers.  
- ✅ **Auto-Solve Detection**: Correct solutions are detected and acknowledged automatically.  
- 🧩 **Responsive UI/UX**: Buttons, spacing, and visual feedback were carefully refined to feel natural across devices.
- 🛠️ **Manual Puzzle Input**: Create your own puzzle by entering a custom board.
- 🤖 **Automatic Solver**: Let the app find and display all possible solutions for your custom board.

## Tech Stack

This project is fully implemented using modern web technologies:

- **Frontend**: React with functional components and hooks  
- **Backend**: FastAPI, providing puzzle generation and solution validation  
- **Styling**: Custom CSS with mobile breakpoints and dark mode support  
- **State & Persistence**: useState/useEffect hooks, with LocalStorage for persistent preferences  

## Why This Project?

This app was developed as a way to:

- Practice building a complete, interactive SPA (Single Page Application)  
- Explore frontend/backed integration using React and FastAPI  
- Design an app that’s both fun to use and thoughtfully engineered  
- Learn how to make better UI decisions for multilingual and mobile-first audiences  

## Coming Soon

- ©️ Further development of this project is paused due to potential copyright considerations.

---

Feel free to explore, clone, or suggest improvements!
