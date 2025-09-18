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
  const startTime = performance.now()
  if (opts.debug) {
    console.clear()
    console.log('Generating map with options:', opts)
  }

  let attempts = 0
  let blocks: BlockMap = []
  let bestMapStats: MapStats | null = null

  do {
    attempts++
    const { maxGenerationAttempts, maxTimeAllowedInMilliseconds } =
      opts.generationConstraints || {}
    if (opts.debug && maxGenerationAttempts) {
      console.log(`Generation attempt ${attempts}/${maxGenerationAttempts}`)
    }

    let loopBlocks = buildMapSkeleton(opts)
    loopBlocks = cleanUpMap(loopBlocks, opts)

    // Max attempts is optional, but leaving it
    // undefined means infinite attempts until a valid map is generated
    const timeElapsed = performance.now() - startTime
    const reachedTimeLimit =
      maxTimeAllowedInMilliseconds &&
      timeElapsed >= maxTimeAllowedInMilliseconds

    const reachedAttemptLimit =
      maxGenerationAttempts && attempts >= maxGenerationAttempts
    if (reachedAttemptLimit || reachedTimeLimit) {
      if (opts.debug) {
        console.warn(
          `Failed to generate valid map after ${attempts} attempts and ${timeElapsed} ms, using best attempt`,
        )
      }
      break
    }

    const mapStats = getMapStats(loopBlocks)
    if (mapStats.totalPathBlocks > (bestMapStats?.totalPathBlocks ?? 0)) {
      if (opts.debug) {
        console.log(
          `New best map found with ${mapStats.totalPathBlocks} path blocks`,
        )
      }

      bestMapStats = mapStats
      blocks = loopBlocks
    }
  } while (!validateMap(blocks, opts))

  if (opts.debug) {
    console.log(`Map generated successfully in ${attempts} attempt(s)`)
    console.log('Final map:')
    console.log(blocks)
  }

  const retMap = removeUnneededWalls(blocks)

  if (opts.debug) {
    console.log('Total generation time:', performance.now() - startTime, 'ms')
  }

  return retMap
}

function buildMapSkeleton(opts: MapGeneratorOptions): BlockMap {
  const blocks: BlockMap = []

  const {
    height,
    halfWidth,
    ghostHouseArea,
    ghostHouseOutline,
    pacManStartArea,
    pacManX,
    pacManY,
  } = getStartingAreas(opts)

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
      } else if (
        y >= pacManStartArea.y &&
        y < pacManStartArea.y + pacManStartArea.height &&
        x >= pacManStartArea.x &&
        x < pacManStartArea.x + pacManStartArea.width
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

  if (opts.debug) {
    console.log(`Pac-Man starting position: (${pacManX}, ${pacManY})`)
  }

  for (let i = 0; i < numForemen; i++) {
    let position: { x: number; y: number }

    if (i === 0) {
      // First foreman starts adjacent to Pac-Man's position
      // Find a wall position adjacent to the Pac-Man starting area
      position = { x: pacManX - 2, y: pacManY } // Start one block to the left of Pac-Man
    } else {
      // Other foremen get random positions
      position = {
        x: getRandomInt(2, halfWidth - 2, true),
        y: getRandomInt(2, height - 2, true),
      }

      while (blocks[position.y][position.x].type !== 'wall') {
        position.x = getRandomInt(2, halfWidth - 2, true)
        position.y = getRandomInt(2, height - 2, true)
      }
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
    // Use reverse iteration to safely remove items
    for (let i = foremen.length - 1; i >= 0; i--) {
      const manager = foremen[i]
      const newPositions = manager.generatePaths(blocks)

      newPositions.forEach((pos) => {
        blocks[pos.y][pos.x] = {
          type: 'empty',
          position: { x: pos.x, y: pos.y },
        }
      })

      if (manager.jobsDone) {
        foremen.splice(i, 1)
      }
    }
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

  // Track positions that need to be checked after changes
  let positionsToCheck = new Set<string>()

  // Initial population - check all empty blocks
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      if (blocks[y][x].type === 'empty') {
        positionsToCheck.add(`${x},${y}`)
      }
    }
  }

  while (positionsToCheck.size > 0) {
    const newPositionsToCheck = new Set<string>()

    for (const posStr of positionsToCheck) {
      const [x, y] = posStr.split(',').map(Number)
      const block = blocks[y][x]

      if (block.type === 'empty' || block.type === 'teleporter') {
        const neighbors = [
          blocks[y - 1]?.[x],
          blocks[y + 1]?.[x],
          blocks[y][x - 1],
          blocks[y][x + 1],
        ].filter((b) => b?.type === 'empty' || b?.type === 'teleporter')

        const shouldRemove =
          x === halfWidth - 1 ? neighbors.length === 0 : neighbors.length <= 1

        if (shouldRemove) {
          block.type = 'wall'

          // Add neighboring empty blocks to check next iteration
          const adjacentPositions = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 },
          ]

          for (const pos of adjacentPositions) {
            if (
              pos.x >= 0 &&
              pos.x < halfWidth &&
              pos.y >= 0 &&
              pos.y < height
            ) {
              if (
                blocks[pos.y][pos.x].type === 'empty' ||
                blocks[pos.y][pos.x].type === 'teleporter'
              ) {
                newPositionsToCheck.add(`${pos.x},${pos.y}`)
              }
            }
          }
        }
      }
    }

    positionsToCheck = newPositionsToCheck
  }

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

  const { pacManX, pacManY } = getStartingAreas(opts)

  if (blocks[pacManY]?.[pacManX]?.type !== 'empty') {
    if (opts.debug) {
      console.warn(
        `Pac-Man position is not empty: (${pacManX}, ${pacManY}, ${blocks[pacManY]?.[pacManX]?.type})`,
      )
    }

    return false
  }

  if (blocks.length === 0) {
    if (opts.debug) {
      console.warn(`Map is empty due to failed connection attempts`)
    }

    return false
  }

  if (opts.map.path?.min && stats.totalPathBlocks < opts.map.path.min) {
    if (opts.debug) {
      console.warn(
        `Map is invalid: totalPathBlocks < min (${stats.totalPathBlocks} < ${opts.map.path.min})`,
      )
    }

    return false
  }

  if (opts.map.path?.max && stats.totalPathBlocks > opts.map.path.max) {
    if (opts.debug) {
      console.warn(
        `Map is invalid: totalPathBlocks > max (${stats.totalPathBlocks} > ${opts.map.path.max})`,
      )
    }

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

  // Teleporter blocks are counted twice due to map symmetry (e.g., left/right sides),
  // so we divide by 2 to get the actual number of teleporter pairs.
  return { totalPathBlocks, totalTeleporterBlocks: totalTeleporterBlocks / 2 }
}

function getStartingAreas(opts: MapGeneratorOptions) {
  const { width, height } = opts.map.bounds
  const halfWidth = Math.floor(width / 2)

  const ghostHouseArea = {
    x: width / 2 - 2,
    y: height / 2 - 4,
    width: 2,
    height: 3,
  }

  const ghostHouseOutline = {
    x: ghostHouseArea.x - 1,
    y: ghostHouseArea.y - 1,
    width: ghostHouseArea.width + 2,
    height: ghostHouseArea.height + 2,
  }

  let pacManY = Math.floor(ghostHouseArea.y + ghostHouseArea.height + 2)
  let pacManX = Math.floor(ghostHouseArea.x + ghostHouseArea.width / 2 - 1)
  if (pacManX % 2 === 0) {
    pacManX += 1 // Ensure pacManX is odd
  }

  if (pacManY % 2 === 0) {
    pacManY += 1 // Ensure pacManY is odd
  }

  const pacManStartArea = {
    x: pacManX - 2,
    y: pacManY,
    width: ghostHouseArea.width + 3,
    height: 1,
  }

  return {
    width,
    height,
    halfWidth,
    ghostHouseArea,
    ghostHouseOutline,
    pacManStartArea,
    pacManX,
    pacManY,
  }
}
