# Pac-Man Map Generator

A lightweight TypeScript utility for generating random Pac-Man maps.

## 📦 Installation

```bash
npm install pac-man-map-generator
```


## 🚀 Developemnt

A full example can be found in this repo, under the example folder, along with a playground for messing with the options.

Note: This repo uses NPM Monorepos. For shorthand, installation and viewing can be done from the root by running:

```bash
npm i -D
npm run dev
```

## ⚙️ API

### `generateMap(options: MapGeneratorOptions): BlockMap`

Generates a Pac-Man style map.

#### `MapGeneratorOptions`

The map generator takes in an optional configuration object. If it is omitted, some default settings will be applied to make a map very similar to a standard pacman map.

```ts
{
  map: { 
    bounds: {
      width: number,
      height: number,
    }
    path?: {
      min?: number;
      max?: number;
    },
    teleporter: {
      min: number;
      max: number;
    },
  },
  mapMaker: {
    manager: {
      min: number;
      max: number;
    },
    builder: {
      minDistanceBeforeTurn: number;
      maxDistanceBeforeTurn: number;
    },
  },
  debug?: boolean
}
```