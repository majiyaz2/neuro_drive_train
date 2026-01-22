import {z} from 'zod'

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number()
})

export const RadarSchema = z.object({
  length: z.number(),
  positions: PositionSchema,
  hasCollided: z.boolean(),
})

export const LayerSchema = z.object({
    outputs: z.array(z.number()),
    weights: z.array(z.array(z.number())),
    highestCheckpoint: z.number(),
})

export const NetworkInputSchema = z.object({
    dimensions: z.array(z.number()),
    layers: z.array(LayerSchema),
    highestCheckpoint: z.number(),
    smallestEdgeDistance: z.number(),
    hasReachedGoal: z.boolean(),
    inputs: z.array(z.number()),
})

export const RadarListSchema = z.object({
    radars: z.array(RadarSchema)
})

export const PredictInputSChema = z.object({
    radars: RadarListSchema,
    network: NetworkInputSchema,
})

export type Radar = z.infer<typeof RadarSchema>
export type Position = z.infer<typeof PositionSchema>
export type NetworkInput = z.infer<typeof NetworkInputSchema>
export type PredictInput = z.infer<typeof PredictInputSChema>
export type LayerInput = z.infer<typeof LayerSchema>