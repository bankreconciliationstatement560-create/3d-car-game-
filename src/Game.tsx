import { useEffect, useState } from 'react'

const LANES = [-1, 0, 1]
const LANE_WIDTH = 80
const GAME_HEIGHT = 500

interface Obstacle {
  id: number
  lane: number
  y: number
}

export default function Game() {
  const [lane, setLane] = useState(0)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [score, setScore] = useState(0)

  // controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setLane(l => Math.max(-1, l - 1))
      if (e.key === 'ArrowRight') setLane(l => Math.min(1, l + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // game loop
  useEffect(() => {
    const loop = setInterval(() => {
      setScore(s => s + 1)

      setObstacles(prev =>
        prev
          .map(o => ({ ...o, y: o.y + 10 }))
          .filter(o => o.y < GAME_HEIGHT)
      )

      if (Math.random() > 0.95) {
        setObstacles(prev => [
          ...prev,
          {
            id: Date.now(),
            lane: LANES[Math.floor(Math.random() * 3)],
            y: -50,
          },
        ])
      }
    }, 100)

    return () => clearInterval(loop)
  }, [])

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>🚗 3D Car Game</h1>
      <h2>Score: {score}</h2>

      <div
        style={{
          position: 'relative',
          width: 300,
          height: GAME_HEIGHT,
          margin: '20px auto',
          background: '#111',
          overflow: 'hidden',
          borderRadius: 12,
        }}
      >
        {/* player */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 150 + lane * LANE_WIDTH - 20,
            width: 40,
            height: 60,
            background: 'cyan',
            borderRadius: 8,
          }}
        />

        {/* obstacles */}
        {obstacles.map(o => (
          <div
            key={o.id}
            style={{
              position: 'absolute',
              top: o.y,
              left: 150 + o.lane * LANE_WIDTH - 20,
              width: 40,
              height: 40,
              background: 'red',
              borderRadius: 6,
            }}
          />
        ))}
      </div>

      <p>⬅️ ➡️ Arrow keys use karo</p>
    </div>
  )
}
