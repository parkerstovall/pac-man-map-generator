import { MapBuilder } from './map-builder'
import type { MapGeneratorOptions } from './options'
import { getRandomDirection, getRandomInt } from './shared'
import type { BlockMap, Position } from './types'

export type ManagerArgs = {
  x: number
  y: number
  width: number
  height: number
  opts: MapGeneratorOptions
}

// The manager contains between 2 and 4 builders that each build a path
export class MapBuilderManager {
  public jobsDone: boolean = false
  private builders: MapBuilder[]

  constructor(args: ManagerArgs) {
    const numBuilders = getRandomInt(2, 4) // 2 to 4 builders
    this.builders = []
    const ignoreDir: Position[] = []

    if (args.x <= 2) {
      ignoreDir.push({ x: -1, y: 0 }) // Ignore left
    } else if (args.x >= args.width - 2) {
      ignoreDir.push({ x: 1, y: 0 }) // Ignore right
    }
    if (args.y <= 2) {
      ignoreDir.push({ x: 0, y: -1 }) // Ignore up
    } else if (args.y >= args.height - 2) {
      ignoreDir.push({ x: 0, y: 1 }) // Ignore down
    }

    let startingDirection = getRandomDirection(ignoreDir)
    if (!startingDirection) {
      this.jobsDone = true
      return
    }

    const { x, y } = startingDirection

    for (let i = 0; i < numBuilders; i++) {
      this.builders.push(
        new MapBuilder({
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          directionX: x,
          directionY: y,
          opts: args.opts,
        }),
      )

      ignoreDir.push({ x, y }) // Add the starting direction to ignore for the next builder
      startingDirection = getRandomDirection(ignoreDir)
    }
  }

  public generatePaths(blocks: BlockMap): Position[] {
    const retPositions: Position[] = []
    this.builders.forEach((builder) => {
      if (!builder.jobsDone) {
        const newPos = builder.generatePath(blocks)
        retPositions.push(newPos)
      }
    })

    this.jobsDone = this.builders.every((builder) => builder.jobsDone)

    return retPositions
  }
}
