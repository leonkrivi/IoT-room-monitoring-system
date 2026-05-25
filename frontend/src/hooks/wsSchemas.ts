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

const wsMessageSchema = z.discriminatedUnion("type", [
  initialStateSchema,
  roomStateUpdateSchema,
  connectionUpdateSchema,
  sensorUpdateSchema,
]);

export type SensorStatus = z.infer<typeof sensorStatusSchema>;
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;
export type WsMessage = z.infer<typeof wsMessageSchema>;

export function safeParseWsMessage(input: unknown): WsMessage | null {
  const parsed = wsMessageSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
