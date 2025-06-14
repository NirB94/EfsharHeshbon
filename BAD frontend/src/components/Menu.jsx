import React from 'react';

export default function Menu({ onStartPredefined }) {
  return (
    <div className="menu">
      <h1>Welcome to Puzzle Solver</h1>
      <button onClick={onStartPredefined}>Start with predefined puzzle</button>
      <button disabled>Enter puzzle manually (coming soon)</button>
    </div>
  );
}
