import z from 'zod'

export const mapGeneratorOptionsSchema = z
  .object({
    width: z.number().min(6),
    height: z.number().min(5),
    maxTeleporterCount: z.number().min(1),
    minAveragePathPerRow: z.number().min(1).optional(),
    maxAveragePathPerRow: z.number().min(1).optional(),
    minTotalPathBlocks: z.number().min(1).optional(),
    maxTotalPathBlocks: z.number().min(1).optional(),
  })
  .refine((obj) => {
    if (obj.width && obj.width % 2 !== 0) {
      return false
    }
    return true
  }, 'Width must be an even number')
  .refine((obj) => {
    if (obj.height % 2 === 0) {
      return false
    }
    return true
  }, 'Height must be an odd number')
  .refine((obj) => {
    if (
      obj.minAveragePathPerRow !== undefined &&
      obj.maxAveragePathPerRow !== undefined
    ) {
      return obj.minAveragePathPerRow <= obj.maxAveragePathPerRow
    }
    return true
  }, 'minAveragePathPerRow must be less than or equal to maxAveragePathPerRow')
  .refine((obj) => {
    if (
      obj.minTotalPathBlocks !== undefined &&
      obj.maxTotalPathBlocks !== undefined
    ) {
      return obj.minTotalPathBlocks <= obj.maxTotalPathBlocks
    }
    return true
  }, 'minTotalPathBlocks must be less than or equal to maxTotalPathBlocks')
  .refine((obj) => {
    if (
      obj.minAveragePathPerRow !== undefined &&
      obj.maxAveragePathPerRow !== undefined &&
      obj.minTotalPathBlocks !== undefined &&
      obj.maxTotalPathBlocks !== undefined
    ) {
      const minPossibleTotal = obj.minAveragePathPerRow * obj.height - 2
      const maxPossibleTotal = obj.maxAveragePathPerRow * obj.height - 2
      return (
        obj.minTotalPathBlocks >= minPossibleTotal &&
        obj.maxTotalPathBlocks <= maxPossibleTotal
      )
    }
    return true
  }, 'Total path blocks constraints are not compatible with average path per row constraints')
  .refine((obj) => {
    if (
      obj.minAveragePathPerRow !== undefined &&
      obj.maxAveragePathPerRow !== undefined
    ) {
      const minPossible = obj.minAveragePathPerRow * obj.height - 2
      const maxPossible = obj.maxAveragePathPerRow * obj.height - 2
      if (
        (obj.minTotalPathBlocks !== undefined &&
          obj.minTotalPathBlocks < minPossible) ||
        (obj.maxTotalPathBlocks !== undefined &&
          obj.maxTotalPathBlocks > maxPossible)
      ) {
        return false
      }
    }
    return true
  }, 'Average path per row constraints are not compatible with total path blocks constraints')
  .refine(
    (obj) => obj.maxTeleporterCount < obj.height / 2,
    'Max teleporter count must be less than half the height',
  )
  .refine(
    (obj) =>
      !obj.maxAveragePathPerRow || obj.maxAveragePathPerRow < obj.width / 2,
    {
      message: 'Max average path per row must be less than half the width',
    },
  )
  .refine(
    (obj) =>
      !obj.minAveragePathPerRow || obj.minAveragePathPerRow < obj.width / 2,
    {
      message: 'Min average path per row must be less than half the width',
    },
  )
  .refine(
    (obj) =>
      !obj.maxTotalPathBlocks ||
      obj.maxTotalPathBlocks < (obj.width * obj.height) / 2,
    {
      message: 'Max total path blocks must be less than half the total blocks',
    },
  )
  .refine(
    (obj) =>
      !obj.minTotalPathBlocks ||
      obj.minTotalPathBlocks < (obj.width * obj.height) / 2,
    {
      message: 'Min total path blocks must be less than half the total blocks',
    },
  )
  .strict()

export type MapGeneratorOptions = z.infer<typeof mapGeneratorOptionsSchema>
