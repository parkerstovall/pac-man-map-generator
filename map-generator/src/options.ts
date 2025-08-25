import z from 'zod'

export const mapGeneratorOptionsSchema = z
  .object({
    map: z.object({
      bounds: z.object({
        width: z.number().min(12),
        height: z.number().min(12),
      }),
      path: z
        .object({
          min: z.number().min(0).optional(),
          max: z.number().min(1).optional(),
        })
        .optional(),
      teleporter: z.object({
        min: z.number().min(0),
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
    (obj) => obj.map.bounds.width % 2 === 0,
    'Width must be an even number',
  )
  .refine(
    (obj) => obj.map.bounds.height % 2 === 1,
    'Height must be an odd number',
  )
  .refine(
    (obj) =>
      !(obj.map.path?.min && obj.map.path?.max) ||
      obj.map.path.min < obj.map.path.max,
    'Min path count must be less than or equal to max path count',
  )
  .refine(
    (obj) => obj.map.teleporter.max < obj.map.bounds.height / 2,
    'Max teleporter count must be less than half the height',
  )
  .refine(
    (obj) =>
      !obj.map.path?.max ||
      obj.map.path.max < (obj.map.bounds.width * obj.map.bounds.height) / 2,
    {
      message: 'Max total path blocks must be less than half the total blocks',
    },
  )
  .refine(
    (obj) =>
      !obj.map.path?.min ||
      obj.map.path.min < (obj.map.bounds.width * obj.map.bounds.height) / 2,
    {
      message: 'Min total path blocks must be less than half the total blocks',
    },
  )
  .strict()

export type MapGeneratorOptions = z.infer<typeof mapGeneratorOptionsSchema>
