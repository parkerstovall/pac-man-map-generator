import { useState } from 'react'
import './App.css'
import { Map } from './map'
import type { MapGeneratorOptions } from 'pac-man-map-generator'

export function App() {
  const [mapOptions, setMapOptions] = useState<MapGeneratorOptions>({
    map: {
      bounds: {
        width: 28,
        height: 31,
      },
      teleporter: {
        min: 1,
        max: 4,
      },
      path: {
        min: 300,
      },
    },
    mapMaker: {
      manager: {
        min: 20,
        max: 25,
      },
      builder: {
        minDistanceBeforeTurn: 10,
        maxDistanceBeforeTurn: 14,
      },
    },
    debug: true,
    generationConstraints: {
      maxGenerationAttempts: 150,
      maxTimeAllowedInMilliseconds: 1000,
    },
  })

  return (
    <div className="App">
      <h1>Pac-Man Map Generator</h1>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: '5px',
          }}
        >
          <label>Height:</label>
          <input
            type="number"
            defaultValue={mapOptions.map.bounds.height}
            id="height-input"
          />
          <label>Width:</label>
          <input
            type="number"
            defaultValue={mapOptions.map.bounds.width}
            id="width-input"
          />
          <label>Min Paths:</label>
          <input
            type="number"
            defaultValue={mapOptions.map.path?.min ?? ''}
            id="min-paths-input"
          />
          <label>Max Paths:</label>
          <input
            type="number"
            defaultValue={mapOptions.map.path?.max ?? ''}
            id="max-paths-input"
          />
          <label>Max Teleporters:</label>
          <input
            type="number"
            defaultValue={mapOptions.map.teleporter?.max ?? ''}
            id="max-teleporters-input"
          />
          <label>Min Teleporters:</label>
          <input
            type="number"
            defaultValue={mapOptions.map.teleporter?.min ?? ''}
            id="min-teleporters-input"
          />
          <label>Min Managers:</label>
          <input
            type="number"
            defaultValue={mapOptions.mapMaker.manager.min}
            id="min-managers-input"
          />
          <label>Max Managers:</label>
          <input
            type="number"
            defaultValue={mapOptions.mapMaker.manager.max}
            id="max-managers-input"
          />
          <label>Min Distance Before Turn:</label>
          <input
            type="number"
            defaultValue={mapOptions.mapMaker.builder.minDistanceBeforeTurn}
            id="min-distance-input"
          />
          <label>Max Distance Before Turn:</label>
          <input
            type="number"
            defaultValue={mapOptions.mapMaker.builder.maxDistanceBeforeTurn}
            id="max-distance-input"
          />
          <label>Debug:</label>
          <input
            type="checkbox"
            defaultChecked={mapOptions.debug ?? false}
            id="debug-input"
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <button
            onClick={() => {
              const minPaths = parseInt(
                (document.getElementById('min-paths-input') as HTMLInputElement)
                  .value,
              )
              const maxPaths = parseInt(
                (document.getElementById('max-paths-input') as HTMLInputElement)
                  .value,
              )
              const minTeleporters = parseInt(
                (
                  document.getElementById(
                    'min-teleporters-input',
                  ) as HTMLInputElement
                ).value,
              )
              const maxTeleporters = parseInt(
                (
                  document.getElementById(
                    'max-teleporters-input',
                  ) as HTMLInputElement
                ).value,
              )
              const minManagers = parseInt(
                (
                  document.getElementById(
                    'min-managers-input',
                  ) as HTMLInputElement
                ).value,
              )
              const maxManagers = parseInt(
                (
                  document.getElementById(
                    'max-managers-input',
                  ) as HTMLInputElement
                ).value,
              )
              const minDistance = parseInt(
                (
                  document.getElementById(
                    'min-distance-input',
                  ) as HTMLInputElement
                ).value,
              )
              const maxDistance = parseInt(
                (
                  document.getElementById(
                    'max-distance-input',
                  ) as HTMLInputElement
                ).value,
              )
              const height = parseInt(
                (document.getElementById('height-input') as HTMLInputElement)
                  .value,
              )
              const width = parseInt(
                (document.getElementById('width-input') as HTMLInputElement)
                  .value,
              )
              const debug = (
                document.getElementById('debug-input') as HTMLInputElement
              ).checked

              const newMapOptions = {
                ...mapOptions,
                map: {
                  ...mapOptions.map,
                  bounds: {
                    width: isNaN(width) ? mapOptions.map.bounds.width : width,
                    height: isNaN(height)
                      ? mapOptions.map.bounds.height
                      : height,
                  },
                  path: {
                    min: isNaN(minPaths) ? undefined : minPaths,
                    max: isNaN(maxPaths) ? undefined : maxPaths,
                  },
                  teleporter: {
                    min: isNaN(minTeleporters)
                      ? mapOptions.map.teleporter.min
                      : minTeleporters,
                    max: isNaN(maxTeleporters)
                      ? mapOptions.map.teleporter.max
                      : maxTeleporters,
                  },
                },
                mapMaker: {
                  ...mapOptions.mapMaker,
                  manager: {
                    min: isNaN(minManagers)
                      ? mapOptions.mapMaker.manager.min
                      : minManagers,
                    max: isNaN(maxManagers)
                      ? mapOptions.mapMaker.manager.max
                      : maxManagers,
                  },
                  builder: {
                    minDistanceBeforeTurn: isNaN(minDistance)
                      ? mapOptions.mapMaker.builder.minDistanceBeforeTurn
                      : minDistance,
                    maxDistanceBeforeTurn: isNaN(maxDistance)
                      ? mapOptions.mapMaker.builder.maxDistanceBeforeTurn
                      : maxDistance,
                  },
                },
                debug,
              }
              setMapOptions(newMapOptions)
            }}
          >
            Regenerate Map
          </button>
          <Map mapOptions={mapOptions} />
        </div>
      </div>
    </div>
  )
}
