import { useState } from 'react'
import './App.css'

const DAILY_GOAL = 8

export default function App() {
  const [count, setCount] = useState(0)
  const [ripples, setRipples] = useState([])

  const fillPercent = Math.min((count / DAILY_GOAL) * 100, 100)
  const isGoalMet = count >= DAILY_GOAL

  function handleClick(e) {
    setCount(c => c + 1)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { id, x, y }])
    setTimeout(() => setRipples(r => r.filter(rip => rip.id !== id)), 700)
  }

  function handleReset() {
    setCount(0)
  }

  const waterColor = isGoalMet ? '#86efac' : '#7dd3fc'
  const waterDark = isGoalMet ? '#4ade80' : '#38bdf8'

  const waterY = 185 - (170 * fillPercent) / 100

  return (
    <div className="app">
      <h1 className="title">Hydration Tracker</h1>
      <p className="subtitle">Click the cup each time you drink a glass</p>

      <div className="cup-wrapper" onClick={handleClick} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleClick(e)}>

        <svg className="cup-svg" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="cup-clip">
              <polygon points="22,12 138,12 118,188 42,188" />
            </clipPath>
            <linearGradient id="water-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={waterDark} />
              <stop offset="100%" stopColor={waterColor} />
            </linearGradient>
          </defs>

          {/* Cup body background */}
          <polygon
            points="22,12 138,12 118,188 42,188"
            fill="#dbeafe"
            stroke="#93c5fd"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Water fill */}
          <g clipPath="url(#cup-clip)">
            <rect
              x="0"
              y={waterY}
              width="160"
              height={200 - waterY}
              fill="url(#water-grad)"
              className="water-fill"
            />
            {/* Wave on top */}
            {fillPercent > 0 && (
              <path
                className="wave"
                d={`M-10,${waterY + 4} q20,-9 40,0 t40,0 t40,0 t40,0 t40,0 v${200 - waterY} h-200 z`}
                fill="url(#water-grad)"
              />
            )}
          </g>

          {/* Shine overlay */}
          <polygon
            points="22,12 138,12 118,188 42,188"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinejoin="round"
            opacity="0.25"
          />
          <line x1="38" y1="30" x2="48" y2="170" stroke="white" strokeWidth="5"
            strokeLinecap="round" opacity="0.2" />

          {/* Cup border */}
          <polygon
            points="22,12 138,12 118,188 42,188"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Ripples */}
          {ripples.map(rip => (
            <circle
              key={rip.id}
              cx={rip.x}
              cy={rip.y}
              r="4"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="ripple"
            />
          ))}
        </svg>

        <div className="cup-hint">tap me</div>
      </div>

      <div className="count-display">
        <span className="count-number" style={{ color: isGoalMet ? '#22c55e' : '#0ea5e9' }}>
          {count}
        </span>
        <span className="count-sep"> / </span>
        <span className="count-goal">{DAILY_GOAL}</span>
        <span className="count-unit"> glasses</span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: isGoalMet ? '#4ade80' : '#38bdf8',
          }}
        />
      </div>

      {isGoalMet && (
        <p className="goal-message">You hit your goal! Great job staying hydrated!</p>
      )}

      <button className="reset-btn" onClick={handleReset}>Reset</button>
    </div>
  )
}
