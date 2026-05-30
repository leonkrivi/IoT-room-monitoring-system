import type { SensorStatus, ConnectionStatus } from "@/hooks/wsSchemas";

export type IndicatorColor = "green" | "yellow" | "red" | "gray";

export type LiveStatusView = {
  roomState: {
    label: string;
    badgeText: string;
    badgeClass: string;
    lastUpdate: string;
  };
  sensor: {
    label: string;
    indicatorColor: IndicatorColor;
    indicatorLabel: string;
    lastHeartbeat: string;
  };
  connection: {
    ws: { label: string; color: IndicatorColor };
    device: { label: string; color: IndicatorColor };
    lastUpdate: string;
  };
};

export type DeviceStatus = {
  roomState?: string;
  sensorStatus?: SensorStatus;
  connectionStatus?: ConnectionStatus;
  lastRoomStateUpdate?: number;
  lastSensorUpdate?: number;
  lastConnectionUpdate?: number;
};

export type StatusMap = Record<string, DeviceStatus>;
