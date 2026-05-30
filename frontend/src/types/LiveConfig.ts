export type ParamStatus = "applied" | "pending" | "rejected";

export interface ConfigParamView {
  id: string;
  parameter: string;
  value: string;
  requestedValue: string;
  status: ParamStatus;
  lastUpdated: string;
}

export interface DeviceConfigState {
  hbIntervalMs: number | null;
  sensorRateMs: number | null;
  requestedHbIntervalMs: number | null;
  requestedSensorRateMs: number | null;
  requestedHbAt: number | null;
  requestedSensorAt: number | null;
  hbUpdatedAt: number | null;
  sensorUpdatedAt: number | null;
}

export type ConfigMap = Record<string, DeviceConfigState>;
