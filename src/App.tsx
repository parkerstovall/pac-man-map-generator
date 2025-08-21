import { useEffect, useState } from 'react'
import './App.css'
import { PacManMapGenerator } from './map-generator/generator'
import type { Block } from './map-generator/types'

function App() {
  const [map, setMap] = useState<Block[]>([])
  const [stateRefresh, setStateRefresh] = useState(false)
  const [delay, setDelay] = useState(0)

  useEffect(() => {
    const generator = new PacManMapGenerator()
    const newMap = generator.generateMap()

    if (delay <= 0) {
      setMap(newMap)
      return
    }

    setMap([]) // Clear the map before starting the animation
    let i = 0
    const interval = setInterval(() => {
      if (i >= newMap.length) {
        clearInterval(interval)
        return
      }

      const block = newMap[i]
      setMap((prev) => [...prev, block])
      i++
    }, delay)

    return () => clearInterval(interval)
  }, [delay, stateRefresh])

  return (
    <div className="App">
      <h1>Pac-Man Map</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setStateRefresh(!stateRefresh)}>
          Generate New Map
        </button>
        <input
          type="number"
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          placeholder="Delay (ms)"
        />
      </div>
      <div className="map">
        {map.map((block) => (
          <div
            key={block.id}
            className={`block ${block.type}`}
            style={{
              gridColumn: block.position.x + 1,
              gridRow: block.position.y + 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default App
