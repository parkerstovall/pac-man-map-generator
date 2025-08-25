import z from 'zod'
import { height, width } from './constants'

export const mapGeneratorOptionsSchema = z
  .object({
    map: z.object({
      pathCount: z
        .object({
          min: z.number().min(1).optional(),
          max: z.number().min(1).optional(),
        })
        .optional(),
      teleporter: z.object({
        min: z.number().min(1),
        max: z.number().min(1),
      }),
    }),
    mapMaker: z.object({
      manager: z.object({
        min: z.number().min(1),
        max: z.number().min(1),
      }),
      builder: z.object({
        minDistanceBeforeTurn: z.number().min(1),
        maxDistanceBeforeTurn: z.number().min(1),
      }),
    }),
    debug: z.boolean().optional(),
  })
  .refine(
    (obj) =>
      !(obj.map.pathCount?.min && obj.map.pathCount?.max) ||
      obj.map.pathCount.min < obj.map.pathCount.max,
    'Min path count must be less than or equal to max path count',
  )
  .refine(
    (obj) => obj.map.teleporter.max < height / 2,
    'Max teleporter count must be less than half the height',
  )
  .refine(
    (obj) =>
      obj.map.teleporter.min >= 1 &&
      obj.map.teleporter.min <= obj.map.teleporter.max,
    'Min teleporter count must be at least 1 and less than or equal to max teleporter count',
  )
  .refine(
    (obj) =>
      !obj.map.pathCount?.max || obj.map.pathCount.max < (width * height) / 2,
    {
      message: 'Max total path blocks must be less than half the total blocks',
    },
  )
  .refine(
    (obj) =>
      !obj.map.pathCount?.min || obj.map.pathCount.min < (width * height) / 2,
    {
      message: 'Min total path blocks must be less than half the total blocks',
    },
  )
  .strict()

export type MapGeneratorOptions = z.infer<typeof mapGeneratorOptionsSchema>
