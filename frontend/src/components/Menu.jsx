import React from 'react';

/**
 * Main Menu Component
 *
 * Displays the main screen of the app with a title and two buttons:
 * - A button to start a predefined puzzle.
 * - A disabled button for future support of manual puzzle input.
 *
 * Props:
 * @param {Function} onStartPredefined - Callback triggered when the "Play Now" button is clicked.
 */
export default function Menu({ onStartPredefined }) {
  return (
    <div className="menu">
      <h1>אפשר חשבון</h1>
      <button onClick={onStartPredefined}>שחק עכשיו</button>
      <button disabled>הזן לוח ידנית (בקרוב!)</button>
    </div>
  );
}
