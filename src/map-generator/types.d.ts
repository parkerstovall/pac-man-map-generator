export type Block = {
  id: string
  type: 'wall' | 'food' | 'powerPellet' | 'empty'
  position: {
    x: number
    y: number
  }
}
