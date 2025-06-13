/**
 * main.jsx
 *
 * Entry point for the React application.
 * - Renders the <App /> component inside the DOM element with ID 'root'.
 * - Wraps the app in <React.StrictMode> for highlighting potential issues.
 * - Loads base styles from index.css.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
