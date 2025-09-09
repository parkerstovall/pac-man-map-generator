export type BlockType = 'wall' | 'empty' | 'ghost-house' | 'teleporter'

export type Position = {
  x: number
  y: number
}

export type Block = {
  type: BlockType
  position: Position
  connected?: boolean
}

export type BlockMap = Block[][]

export type PacManMap = (Block | null)[][]

export type MapStats = {
  totalPathBlocks: number
  totalTeleporterBlocks: number
}
