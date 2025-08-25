import type { MapGeneratorOptions } from './options'
import { getRandomDirection, getRandomInt } from './shared'
import type { BlockMap, Position } from './types'

export type BuilderArgs = {
  x: number
  y: number
  width: number
  height: number
  directionX: number
  directionY: number
  opts: MapGeneratorOptions
}

export class MapBuilder {
  jobsDone: boolean = false
  private distanceBeforeTurn: number
  private position: Position

  private direction: Position
  private stepsTaken: number = 0
  private readonly MAX_WIDTH: number
  private readonly MAX_HEIGHT: number
  private readonly MIN_WIDTH: number = 1
  private readonly MIN_HEIGHT: number = 1
  private readonly debug: boolean = false
  private readonly debug_id: string = Math.random().toString(36).substring(2, 7)

  constructor(args: BuilderArgs) {
    this.MAX_WIDTH = args.width - 1
    this.MAX_HEIGHT = args.height - 2
    this.position = { x: args.x, y: args.y }
    this.direction = { x: args.directionX, y: args.directionY }
    this.debug = args.opts.debug ?? false
    this.distanceBeforeTurn = getRandomInt(
      args.opts.mapMaker.builder.minDistanceBeforeTurn,
      args.opts.mapMaker.builder.maxDistanceBeforeTurn,
      false,
    )

    this.log(`Created:
        Direction: (${this.direction.x}, ${this.direction.y})
        Distance Before Turn: ${this.distanceBeforeTurn}`)
  }

  public generatePath(blocks: BlockMap): Position {
    this.position.x += this.direction.x
    this.position.y += this.direction.y
    this.stepsTaken++

    this.log(`moved, steps taken: ${this.stepsTaken}`)

    if (blocks[this.position.y]?.[this.position.x]?.type === 'empty') {
      this.log('found empty space')
      this.jobsDone = true
      return this.position
    }

    // Handle wall collision and turning
    if (
      !this.checkAndHandleCollision() &&
      this.stepsTaken >= this.distanceBeforeTurn
    ) {
      this.log(`reached distance before turn: ${this.distanceBeforeTurn}`)
      const reversedDir = { x: -this.direction.x, y: -this.direction.y }
      const ignoredDirs = [
        this.direction,
        reversedDir,
        ...this.getBlockedDirections(),
      ]

      const randDir = getRandomDirection(ignoredDirs)
      if (!randDir) {
        this.jobsDone = true
        return this.position
      }

      this.turn(randDir)
    }

    return { x: this.position.x, y: this.position.y }
  }

  private turn(newDirection: Position) {
    this.log(`turning to (${newDirection.x}, ${newDirection.y})`)
    this.direction = newDirection
    this.stepsTaken = 0
    this.distanceBeforeTurn = getRandomInt(4, 12, false)
  }

  private getBlockedDirections(): Position[] {
    const reversedDir = { x: -this.direction.x, y: -this.direction.y }
    const blocked: Position[] = [reversedDir]

    // Horizontal edges
    if (this.position.x <= this.MIN_WIDTH) {
      blocked.push({ x: -1, y: 0 })
    } // left
    if (this.position.x >= this.MAX_WIDTH) {
      blocked.push({ x: 1, y: 0 })
    } // right

    // Vertical edges
    if (this.position.y <= this.MIN_HEIGHT) {
      blocked.push({ x: 0, y: -1 })
    } // top
    if (this.position.y >= this.MAX_HEIGHT) {
      blocked.push({ x: 0, y: 1 })
    } // bottom

    return blocked
  }

  private checkAndHandleCollision(): boolean {
    if (
      (this.position.x <= this.MIN_WIDTH && this.direction.x < 0) ||
      (this.position.x >= this.MAX_WIDTH && this.direction.x > 0) ||
      (this.position.y <= this.MIN_HEIGHT && this.direction.y < 0) ||
      (this.position.y >= this.MAX_HEIGHT && this.direction.y > 0)
    ) {
      const blockedDirs = this.getBlockedDirections()
      this.log(`blocked: ${JSON.stringify(blockedDirs)}`)
      const randDir = getRandomDirection(blockedDirs) // or pick a safe perpendicular direction
      if (!randDir) {
        this.jobsDone = true
      } else {
        this.turn(randDir)
      }
      return true
    }

    return false
  }

  private log(message: string) {
    if (this.debug) {
      console.log(
        `Builder '${this.debug_id}', pos: (${this.position.x}, ${this.position.y}): ${message}`,
      )
    }
  }
}
