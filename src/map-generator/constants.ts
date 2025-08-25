export const directions = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  UP_LEFT: { x: -1, y: -1 },
  UP_RIGHT: { x: 1, y: -1 },
  DOWN_LEFT: { x: -1, y: 1 },
  DOWN_RIGHT: { x: 1, y: 1 },
}

export const topLeftSide = [directions.UP_LEFT, directions.UP, directions.LEFT]

export const topRightSide = [
  directions.UP_RIGHT,
  directions.UP,
  directions.RIGHT,
]

export const bottomLeftSide = [
  directions.DOWN_LEFT,
  directions.DOWN,
  directions.LEFT,
]

export const bottomRightSide = [
  directions.DOWN_RIGHT,
  directions.DOWN,
  directions.RIGHT,
]

export const leftSide = [
  directions.UP_LEFT,
  directions.DOWN_LEFT,
  directions.LEFT,
]

export const rightSide = [
  directions.UP_RIGHT,
  directions.DOWN_RIGHT,
  directions.RIGHT,
]

export const topSide = [directions.UP_LEFT, directions.UP_RIGHT, directions.UP]

export const bottomSide = [
  directions.DOWN_LEFT,
  directions.DOWN_RIGHT,
  directions.DOWN,
]

export const width = 28
export const height = 31
export const halfWidth = Math.floor(width / 2)
