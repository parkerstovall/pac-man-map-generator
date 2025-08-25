# Pac-Man Map Generator

A lightweight TypeScript utility for generating random Pac-Man maps.

## 📦 Installation

```bash
npm install pac-man-map-generator
```


## 🚀 Usage

A full example can be found in this repo, under the map-generator-example folder, along with a playground for messing with the options.

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