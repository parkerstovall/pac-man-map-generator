/***
 *  PacManMapGenerator Class
 *  Generates a random Pac-Man map
 *
 *
 * - General rules:
 * - The map is made up of blocks, which can be walls, empty spaces, ghost houses, or teleporters
 * - The map is 28 blocks wide and 31 blocks tall
 * - The map is symmetrical
 *
 * - Generation rules:
 * 1. The outer border, with the exception of any tunnels, is always walls
 * 2. There are at either 1 or 2 tunnels
 * 3. The inner four corners of the map are always paths
 * 4. The center is the ghost house, and the area around it is always paths
 * 5. All walls (excepting the outer border) must be at least 2 blocks thick
 * 6. Walls can be shaped like "L", "T", or "+", and the occasional rectangle
 * 7. There must be a path from any empty space to any other empty space
 * 8. All path squares are connected to at least 2 other path squares (no dead ends)
 * 9. Paths are only 1 block wide
 * 10. All intersections of paths must be at least 2 blocks apart
 * 11. Walls can be shaped like "L", "T", or "+", and the occasional rectangle
 */

//import { generateNextBlock } from './block-generators'
import { halfWidth, height, width } from './constants'
import { MapBuilderManager } from './map-builder-manager'
import { mapGeneratorOptionsSchema, type MapGeneratorOptions } from './options'
import { getRandomInt } from './shared'
import type { Block, BlockMap, MapStats, Position } from './types'

export function generateMap(
  opts: MapGeneratorOptions = {
    map: {
      teleporter: {
        min: 1,
        max: 4,
      },
      pathCount: {
        min: 300,
      },
    },
    mapMaker: {
      manager: {
        min: 6,
        max: 10,
      },
      builder: {
        minDistanceBeforeTurn: 4,
        maxDistanceBeforeTurn: 12,
      },
    },
  },
) {
  mapGeneratorOptionsSchema.parse(opts)
  if (opts.debug) {
    console.clear()
    console.log('Generating map with options:', opts)
  }

  let blocks: BlockMap = []

  while (!validateMap(blocks, opts)) {
    blocks = []

    // At first, everything is a wall
    for (let y = 0; y < height; y++) {
      blocks.push([])
      const row = blocks[y]
      for (let x = 0; x < halfWidth; x++) {
        if (y >= 12 && y <= 16 && x >= 10 && x <= 13) {
          row.push({
            type: 'ghost-house',
            position: { x, y },
          })
        } else if (y >= 11 && y <= 17 && x >= 9 && x <= 14) {
          row.push({
            type: 'empty',
            position: { x, y },
          })
        } else {
          row.push({
            type: 'wall',
            position: { x, y },
          })
        }
      }
    }

    // Create a list of 6 - 10 foremen to manage the builders
    const foremen: MapBuilderManager[] = []
    const numForemen = getRandomInt(
      opts.mapMaker.manager.min,
      opts.mapMaker.manager.max,
    )
    if (opts.debug) {
      console.log(`Creating ${numForemen} foremen...`)
    }

    for (let i = 0; i < numForemen; i++) {
      const position = {
        x: getRandomInt(2, halfWidth - 2, true),
        y: getRandomInt(2, height - 2, true),
      }

      while (blocks[position.y][position.x].type !== 'wall') {
        position.x = getRandomInt(2, halfWidth - 2, true)
        position.y = getRandomInt(2, height - 2, true)
      }

      foremen.push(
        new MapBuilderManager({
          x: position.x,
          y: position.y,
          width: halfWidth,
          height,
          opts,
        }),
      )
    }

    while (foremen.length > 0) {
      foremen.forEach((manager, index) => {
        const newPositions = manager.generatePaths(blocks)
        newPositions.forEach((pos) => {
          blocks[pos.y][pos.x] = {
            type: 'empty',
            position: { x: pos.x, y: pos.y },
          }
        })

        if (manager.jobsDone) {
          foremen.splice(index, 1)
        }
      })
    }

    blocks = cleanUpMap(blocks, opts)

    if (opts.debug) {
      console.log('Final map:')
      console.log(blocks)
    }
  }

  return blocks
}

function cleanUpMap(blocks: BlockMap, opts: MapGeneratorOptions): BlockMap {
  blocks = cleanMiddleAisle(blocks)
  blocks = cleanUpOrphans(blocks)
  blocks = addTeleporters(blocks, opts)

  // There is a VERY rare chance that the remaining unconnected areas are completely isolated from each other
  // In that case, we just re-generate the map
  const connectedBlocks = connectDisconnectedRegions(blocks)
  if (!connectedBlocks) {
    return []
  }

  blocks = connectedBlocks
  return duplicateMapHalf(blocks)
}

// Pac Man maps are symmetrical, so we can duplicate the first half of the map
function duplicateMapHalf(blocks: BlockMap) {
  for (let y = 0; y < height; y++) {
    const row = blocks[y]
    const mirroredRow = []
    for (let x = 0; x < halfWidth; x++) {
      const mirroredBlock = generateBlockMirror(blocks, x, y)
      mirroredRow.push(mirroredBlock)
    }

    mirroredRow.reverse()
    row.push(...mirroredRow)
  }

  return blocks
}

function generateBlockMirror(blocks: BlockMap, x: number, y: number): Block {
  const mirroredX = width - 1 - x
  return {
    type: blocks[y][x].type,
    position: { x: mirroredX, y },
  }
}

function cleanMiddleAisle(blocks: BlockMap): BlockMap {
  const aisleX = 13
  for (let y = 0; y < height; y++) {
    const block = blocks[y][aisleX]
    if (block.type === 'empty') {
      const leftBlock = blocks[y][aisleX - 1]
      if (leftBlock.type === 'empty') {
        continue
      }

      block.type = 'wall'
    }
  }
  return blocks
}

function cleanUpOrphans(blocks: BlockMap): BlockMap {
  let hasOrphans = false
  do {
    hasOrphans = false
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < halfWidth; x++) {
        const block = blocks[y][x]
        if (block.type === 'empty') {
          const neighbors = [
            blocks[y - 1]?.[x],
            blocks[y + 1]?.[x],
            blocks[y][x - 1],
            blocks[y][x + 1],
          ].filter((b) => b?.type === 'empty')

          if (x === halfWidth - 1) {
            if (neighbors.length === 0) {
              block.type = 'wall'
              hasOrphans = true
            }
          } else if (neighbors.length <= 1) {
            block.type = 'wall'
            hasOrphans = true
          }
        }
      }
    }
  } while (hasOrphans)
  return blocks
}

function addTeleporters(blocks: BlockMap, opts: MapGeneratorOptions): BlockMap {
  const count = getRandomInt(opts.map.teleporter.min, opts.map.teleporter.max)
  if (opts.debug) {
    console.log(`Adding ${count} teleporters...`)
  }
  // Add teleporters
  const addedY: number[] = []
  for (let i = 0; i < count; i++) {
    let y = getRandomInt(1, height - 2, true)
    while (addedY.includes(y)) {
      y = getRandomInt(1, height - 2, true)
    }

    blocks[y][0] = {
      type: 'teleporter',
      position: { x: 0, y },
    }
    addedY.push(y)
  }

  return blocks
}

function connectDisconnectedRegions(blocks: BlockMap): BlockMap | null {
  let totalEmptyBlocks = blocks
    .flat()
    .filter((b) => b?.type === 'teleporter' || b?.type === 'empty').length

  let visited = getInitialConnection(blocks)
  let visitedLength = visited.flat().filter((v) => v).length
  while (visitedLength < totalEmptyBlocks) {
    const attemptedConnections: Position[] = []
    let breakLoop = false
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < halfWidth; x++) {
        if (
          (blocks[y][x].type === 'empty' ||
            blocks[y][x].type === 'teleporter') &&
          !visited[y][x]
        ) {
          if (attemptedConnections.some((pos) => pos.x === x && pos.y === y)) {
            continue
          }

          attemptedConnections.push({ x, y })
          const { blocks: newBlocks, foundConnection } = tryConnectToNeighbors(
            blocks,
            x,
            y,
          )

          if (foundConnection) {
            breakLoop = true
            blocks = newBlocks
            break
          }
        }
      }
      if (breakLoop) {
        break
      }
    }

    visited = getInitialConnection(blocks)
    visitedLength = visited.flat().filter((v) => v).length
    totalEmptyBlocks = blocks
      .flat()
      .filter((b) => b?.type === 'teleporter' || b?.type === 'empty').length

    if (totalEmptyBlocks - visitedLength === attemptedConnections.length) {
      return null
    }
  }

  return blocks
}

function getInitialConnection(blocks: BlockMap) {
  const visited: boolean[][] = Array.from({ length: height }, () =>
    Array(halfWidth).fill(false),
  )
  let starting: Position | null = null
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      if (blocks[y][x].type === 'empty') {
        starting = { x, y }
        break
      }
    }
    if (starting) break
  }

  const queue: Position[] = []
  if (starting) {
    queue.push(starting)
    visited[starting.y][starting.x] = true
    blocks[starting.y][starting.x].connected = true
  }

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
    ]

    neighbors.forEach((neighbor) => {
      if (
        blocks[neighbor.y]?.[neighbor.x] &&
        ['empty', 'teleporter'].includes(blocks[neighbor.y][neighbor.x].type) &&
        !visited[neighbor.y][neighbor.x]
      ) {
        visited[neighbor.y][neighbor.x] = true
        blocks[neighbor.y][neighbor.x].connected = true
        queue.push(neighbor)
      }
    })
  }

  return visited
}

function tryConnectToNeighbors(
  blocks: BlockMap,
  blockX: number,
  blockY: number,
) {
  const searchDirectionForEmpty = (dx: number, dy: number) => {
    const positions: Position[] = []
    let x = blockX + dx
    let y = blockY + dy
    while (x > 0 && x < halfWidth && y > 0 && y < height) {
      positions.push({ x, y })
      if (
        ['empty', 'teleporter'].includes(blocks[y][x].type) &&
        blocks[y][x].connected
      ) {
        return positions
      }

      x += dx
      y += dy
    }

    return null
  }

  const directions = [
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 }, // right
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 }, // down
  ]

  for (const { dx, dy } of directions) {
    const positions = searchDirectionForEmpty(dx, dy)
    if (positions) {
      positions.forEach((pos) => {
        blocks[pos.y][pos.x].type = 'empty'
      })

      return { blocks, foundConnection: true }
    }
  }

  return { blocks, foundConnection: false }
}

function validateMap(blocks: BlockMap, opts: MapGeneratorOptions): boolean {
  const stats = getMapStats(blocks)
  if (opts.debug) {
    console.log(`Map Stats:`, stats)
  }

  if (
    opts.map.pathCount?.min &&
    stats.totalPathBlocks < opts.map.pathCount.min
  ) {
    return false
  }

  if (
    opts.map.pathCount?.max &&
    stats.totalPathBlocks > opts.map.pathCount.max
  ) {
    return false
  }

  return true
}

function getMapStats(blocks: BlockMap): MapStats {
  let totalPathBlocks = 0
  let totalWallBlocks = 0
  let totalTeleporterBlocks = 0

  blocks.flat().forEach((block) => {
    if (block.type === 'empty') {
      totalPathBlocks++
    } else if (block.type === 'wall') {
      totalWallBlocks++
    } else if (block.type === 'teleporter') {
      totalTeleporterBlocks++
    }
  })

  return { totalPathBlocks, totalWallBlocks, totalTeleporterBlocks }
}
