import { MapBuilderManager } from './map-builder-manager'
import { mapGeneratorOptionsSchema, type MapGeneratorOptions } from './options'
import { getRandomInt } from './shared'
import type { Block, BlockMap, MapStats, PacManMap, Position } from './types'

export function generateMap(
  opts: MapGeneratorOptions = {
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
        min: 6,
        max: 10,
      },
      builder: {
        minDistanceBeforeTurn: 4,
        maxDistanceBeforeTurn: 12,
      },
    },
  },
): PacManMap {
  mapGeneratorOptionsSchema.parse(opts)
  if (opts.debug) {
    console.clear()
    console.log('Generating map with options:', opts)
  }

  let blocks: BlockMap = buildMapSkeleton(opts)
  blocks = cleanUpMap(blocks, opts)

  while (!validateMap(blocks, opts)) {
    blocks = buildMapSkeleton(opts)
    blocks = cleanUpMap(blocks, opts)

    if (opts.debug) {
      console.log('Final map:')
      console.log(blocks)
    }
  }

  return removeUnneededWalls(blocks)
}

function buildMapSkeleton(opts: MapGeneratorOptions): BlockMap {
  const blocks: BlockMap = []

  const { width, height } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)

  const ghostHouseArea = {
    x: width / 2 - 4,
    y: height / 2 - 2,
    width: 8,
    height: 5,
  }

  const ghostHouseOutline = {
    x: ghostHouseArea.x - 1,
    y: ghostHouseArea.y - 1,
    width: ghostHouseArea.width + 2,
    height: ghostHouseArea.height + 2,
  }

  // At first, everything is a wall
  for (let y = 0; y < height; y++) {
    blocks.push([])
    const row = blocks[y]
    for (let x = 0; x < halfWidth; x++) {
      if (
        y >= ghostHouseArea.y &&
        y < ghostHouseArea.y + ghostHouseArea.height &&
        x >= ghostHouseArea.x &&
        x < ghostHouseArea.x + ghostHouseArea.width
      ) {
        row.push({
          type: 'ghost-house',
          position: { x, y },
        })
      } else if (
        y >= ghostHouseOutline.y &&
        y < ghostHouseOutline.y + ghostHouseOutline.height &&
        x >= ghostHouseOutline.x &&
        x < ghostHouseOutline.x + ghostHouseOutline.width
      ) {
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

  return blocks
}

function cleanUpMap(blocks: BlockMap, opts: MapGeneratorOptions): BlockMap {
  blocks = cleanMiddleAisle(blocks, opts)
  blocks = cleanUpOrphans(blocks, opts)
  blocks = addTeleporters(blocks, opts)

  // There is a VERY rare chance that the remaining unconnected areas are completely isolated from each other
  // In that case, we just re-generate the map
  const connectedBlocks = connectDisconnectedRegions(blocks, opts)
  if (!connectedBlocks) {
    return []
  }

  blocks = connectedBlocks
  return duplicateMapHalf(blocks, opts)
}

// Pac Man maps are symmetrical, so we can duplicate the first half of the map
function duplicateMapHalf(
  blocks: BlockMap,
  opts: MapGeneratorOptions,
): BlockMap {
  const { width, height } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)

  for (let y = 0; y < height; y++) {
    const row = blocks[y]
    const mirroredRow = []
    for (let x = 0; x < halfWidth; x++) {
      const mirroredBlock = generateBlockMirror(blocks, x, y, opts)
      mirroredRow.push(mirroredBlock)
    }

    mirroredRow.reverse()
    row.push(...mirroredRow)
  }

  return blocks
}

function generateBlockMirror(
  blocks: BlockMap,
  x: number,
  y: number,
  opts: MapGeneratorOptions,
): Block {
  const { width } = opts.map.bounds
  const mirroredX = width - 1 - x
  return {
    type: blocks[y][x].type,
    position: { x: mirroredX, y },
  }
}

function cleanMiddleAisle(
  blocks: BlockMap,
  opts: MapGeneratorOptions,
): BlockMap {
  const { height, width } = opts.map.bounds
  const aisleX = width / 2 - 1
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

function cleanUpOrphans(blocks: BlockMap, opts: MapGeneratorOptions): BlockMap {
  const { width, height } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)

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
  const { height } = opts.map.bounds

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

// Remove walls that are completely surrounded by other walls
// These walls are unneeded and just take up space
function removeUnneededWalls(blocks: BlockMap): PacManMap {
  return blocks.map((row) =>
    row.map((block) => {
      if (block.type !== 'wall') {
        return block
      }

      const neighbors = [
        blocks[block.position.y - 1]?.[block.position.x],
        blocks[block.position.y + 1]?.[block.position.x],
        blocks[block.position.y]?.[block.position.x - 1],
        blocks[block.position.y]?.[block.position.x + 1],
        blocks[block.position.y - 1]?.[block.position.x - 1],
        blocks[block.position.y - 1]?.[block.position.x + 1],
        blocks[block.position.y + 1]?.[block.position.x - 1],
        blocks[block.position.y + 1]?.[block.position.x + 1],
      ].filter((b) => b && b.type !== 'wall')

      if (neighbors.length === 0) {
        return null
      }

      return block
    }),
  )
}

function connectDisconnectedRegions(
  blocks: BlockMap,
  opts: MapGeneratorOptions,
): BlockMap | null {
  const { width, height } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)
  let totalEmptyBlocks = blocks
    .flat()
    .filter((b) => b?.type === 'teleporter' || b?.type === 'empty').length

  let visited = getInitialConnection(blocks, opts)
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
            opts,
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

    visited = getInitialConnection(blocks, opts)
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

function getInitialConnection(blocks: BlockMap, opts: MapGeneratorOptions) {
  const { height, width } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)

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
  opts: MapGeneratorOptions,
) {
  const { width, height } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)

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

  if (blocks.length === 0) {
    return false
  }

  if (opts.map.path?.min && stats.totalPathBlocks < opts.map.path.min) {
    return false
  }

  if (opts.map.path?.max && stats.totalPathBlocks > opts.map.path.max) {
    return false
  }

  return true
}

function getMapStats(blocks: BlockMap): MapStats {
  let totalPathBlocks = 0
  let totalTeleporterBlocks = 0

  blocks.flat().forEach((block) => {
    if (block.type === 'empty') {
      totalPathBlocks++
    } else if (block.type === 'teleporter') {
      totalTeleporterBlocks++
    }
  })

  return { totalPathBlocks, totalTeleporterBlocks }
}
