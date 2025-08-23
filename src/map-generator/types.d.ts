export type BlockType = 'wall' | 'empty' | 'ghost-house' | 'teleporter'

export type Position = {
  x: number
  y: number
}

export type WallShape = 'L' | 'T' | '+' | 'rectangle' | 'border'

export type Block = {
  type: BlockType
  position: Position
  connected?: boolean
}

export type BlockMap = Block[][]
