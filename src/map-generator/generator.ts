import type { Block } from './types'

export class PacManMapGenerator {
  private readonly width: number = 28
  private readonly height: number = 31
  private readonly blocks: Block[]

  constructor() {
    this.blocks = []
  }

  generateMap(): Block[] {
    // temporarily generate a simple grid of empty blocks

    // clear previous blocks
    this.blocks.splice(0, this.blocks.length)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const randomType = Math.random()
        let type: 'wall' | 'food' | 'powerPellet' | 'empty' = 'empty'
        if (randomType < 0.1) {
          type = 'wall'
        } else if (randomType < 0.3) {
          type = 'food'
        } else if (randomType < 0.4) {
          type = 'powerPellet'
        }
        const block: Block = {
          id: `${x}-${y}`,
          type,
          position: { x, y },
        }

        this.blocks.push(block)
      }
    }

    return this.blocks
  }
}
