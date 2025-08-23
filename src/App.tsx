import { useState } from 'react'
import './App.css'
import { generateMap } from './map-generator/generator'
import type { BlockMap } from './map-generator/types'

function App() {
  const [map, setMap] = useState<BlockMap>(generateMap())

  return (
    <div className="App">
      <h1>Pac-Man Map</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => {
            console.clear()
            setMap(generateMap())
          }}
        >
          Generate New Map
        </button>
      </div>
      <div className="map">
        {map.map((row) =>
          row.map((block) => {
            const style: React.CSSProperties = {
              gridColumn: block.position.x + 1,
              gridRow: block.position.y + 1,
            }

            if (block.type === 'wall') {
              if (
                map[block.position.y][block.position.x + 1]?.type !== 'wall'
              ) {
                if (
                  block.position.y > 0 &&
                  map[block.position.y - 1][block.position.x]?.type !== 'wall'
                ) {
                  style.borderTopRightRadius = '10px'
                }
                if (
                  block.position.y < map.length - 1 &&
                  map[block.position.y + 1][block.position.x]?.type !== 'wall'
                ) {
                  style.borderBottomRightRadius = '10px'
                }
              } else {
                style.borderRight = 'none'
              }

              if (
                map[block.position.y][block.position.x - 1]?.type !== 'wall'
              ) {
                if (
                  block.position.y > 0 &&
                  map[block.position.y - 1][block.position.x]?.type !== 'wall'
                ) {
                  style.borderTopLeftRadius = '10px'
                }
                if (
                  block.position.y < map.length - 1 &&
                  map[block.position.y + 1][block.position.x]?.type !== 'wall'
                ) {
                  style.borderBottomLeftRadius = '10px'
                }
              } else {
                style.borderLeft = 'none'
              }

              if (
                map[block.position.y - 1]?.[block.position.x]?.type === 'wall'
              ) {
                style.borderTop = 'none'
              }

              if (
                map[block.position.y + 1]?.[block.position.x]?.type === 'wall'
              ) {
                style.borderBottom = 'none'
              }

              if (
                block.position.x === 0 &&
                map[block.position.y + 1]?.[block.position.x]?.type ===
                  'teleporter'
              ) {
                style.borderBottomLeftRadius = 'none'
              }

              if (
                block.position.x === map[0].length - 1 &&
                map[block.position.y + 1]?.[block.position.x]?.type ===
                  'teleporter'
              ) {
                style.borderBottomRightRadius = 'none'
              }

              if (
                block.position.x === 0 &&
                map[block.position.y - 1]?.[block.position.x]?.type ===
                  'teleporter'
              ) {
                style.borderTopLeftRadius = 'none'
              }

              if (
                block.position.x === map[0].length - 1 &&
                map[block.position.y - 1]?.[block.position.x]?.type ===
                  'teleporter'
              ) {
                style.borderTopRightRadius = 'none'
              }
            }

            if (block.type === 'ghost-house') {
              style.borderRadius = '0'
              if (block.position.y === 12) {
                style.borderTop = '1px solid white'
              }
              if (block.position.y === 16) {
                style.borderBottom = '1px solid white'
              }
              if (block.position.x === 10) {
                style.borderLeft = '1px solid white'
              }
              if (block.position.x === 17) {
                style.borderRight = '1px solid white'
              }
              if (
                (block.position.x === 13 || block.position.x === 14) &&
                block.position.y === 12
              ) {
                style.borderTop = 'none'
              }
            }

            return (
              <div
                onClick={() => {
                  console.log(block)
                }}
                key={`${block.position.x}-${block.position.y}`}
                className={`block ${block.type}`}
                style={style}
                title={`(${block.position.x}, ${block.position.y})`}
              ></div>
            )
          }),
        )}
      </div>
    </div>
  )
}

export default App
