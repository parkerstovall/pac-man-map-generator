import type { Position } from './types'

export function getRandomDirection(ignoreDir: Position[]) {
  const directions: Position[] = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
  ]

  const filteredDirections = directions.filter(
    (dir) =>
      !ignoreDir.some((ignored) => ignored.x === dir.x && ignored.y === dir.y),
  )

  if (filteredDirections.length === 0) {
    return null
  }

  return filteredDirections[getRandomInt(0, filteredDirections.length - 1)]
}

export function getRandomInt(min: number, max: number, odd?: boolean): number {
  let result = Math.floor(Math.random() * (max - min + 1)) + min
  if (odd !== undefined) {
    if ((result % 2 === 0) === odd) {
      if (result < max) {
        result += 1
      } else {
        result -= 1
      }
    }
  }

  return result
}
