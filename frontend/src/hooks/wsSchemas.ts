import { z } from "zod";

const sensorStatusSchema = z.enum(["alive", "dead", "unknown"]);
const connectionStatusSchema = z.enum(["online", "offline"]);
const roomStateSchema = z.string().min(1);

const initialStateSchema = z.object({
  type: z.literal("initial_state"),
  data: z.record(
    z.object({
      roomState: roomStateSchema.nullable(),
      sensorStatus: sensorStatusSchema.nullable(),
      connection: connectionStatusSchema.nullable(),
      config: z
        .object({
          hbIntervalMs: z.number().nullable(),
          sensorRateMs: z.number().nullable(),
        })
        .nullable()
        .optional(),
    }),
  ),
});

const roomStateUpdateSchema = z.object({
  type: z.literal("room_state_update"),
  data: z.object({
    roomId: z.string(),
    deviceId: z.string(),
    roomState: roomStateSchema,
  }),
});

const connectionUpdateSchema = z.object({
  type: z.literal("connection_update"),
  data: z.object({
    roomId: z.string(),
    deviceId: z.string(),
    status: connectionStatusSchema,
  }),
});

const sensorUpdateSchema = z.object({
  type: z.literal("sensor_update"),
  data: z.object({
    roomId: z.string(),
    deviceId: z.string(),
    status: sensorStatusSchema,
  }),
});

const deviceConfigUpdateSchema = z.object({
  type: z.literal("device_config_update"),
  data: z.object({
    roomId: z.string(),
    deviceId: z.string(),
    hbIntervalMs: z.number().nullable().optional(),
    sensorRateMs: z.number().nullable().optional(),
  }),
});

const wsMessageSchema = z.discriminatedUnion("type", [
  initialStateSchema,
  roomStateUpdateSchema,
  connectionUpdateSchema,
  sensorUpdateSchema,
  deviceConfigUpdateSchema,
]);

export type SensorStatus = z.infer<typeof sensorStatusSchema>;
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;
export type WsMessage = z.infer<typeof wsMessageSchema>;
export type DeviceConfigUpdate = z.infer<
  typeof deviceConfigUpdateSchema
>["data"];

export function safeParseWsMessage(input: unknown): WsMessage | null {
  const parsed = wsMessageSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
