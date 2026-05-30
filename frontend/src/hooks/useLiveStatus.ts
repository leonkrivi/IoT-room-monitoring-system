import { useEffect, useMemo, useState } from "react";
import type { IdPair } from "@/types/IdPair";
import { buildKey } from "@/lib/utils";
import { useWebSocket } from "@/context/WebSocketContext";
import type {
  ConnectionStatus,
  SensorStatus,
  WsMessage,
} from "@/hooks/wsSchemas";
import type {
  IndicatorColor,
  LiveStatusView,
  StatusMap,
} from "@/types/LiveStatus";

export type { IndicatorColor, LiveStatusView };

const ROOM_STATE_MAP: Record<string, { label: string; badgeClass: string }> = {
  UNOCCUPIED: {
    label: "Empty",
    badgeClass: "[background:var(--chart-1)] text-white",
  },
  OCCUPIED_STATIC: {
    label: "Static",
    badgeClass: "[background:var(--chart-2)] text-white",
  },
  OCCUPIED_ACTIVE: {
    label: "Active",
    badgeClass: "[background:var(--chart-5)] text-white",
  },
  UNKNOWN: {
    label: "Unknown",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

const UNKNOWN_LABEL = "Unknown";

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return UNKNOWN_LABEL;
  return new Date(timestamp).toLocaleString();
}

function formatRelative(timestamp?: number, now = Date.now()): string {
  if (!timestamp) return UNKNOWN_LABEL;
  const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSeconds < 5) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function applyMessage(
  current: StatusMap,
  message: WsMessage,
  now: number,
): StatusMap {
  switch (message.type) {
    case "initial_state": {
      const next: StatusMap = {};
      for (const [key, value] of Object.entries(message.data)) {
        next[key] = {
          roomState: value.roomState ?? undefined,
          sensorStatus: value.sensorStatus ?? undefined,
          connectionStatus: value.connection ?? undefined,
          lastRoomStateUpdate: now,
          lastSensorUpdate: now,
          lastConnectionUpdate: now,
        };
      }
      return next;
    }
    case "room_state_update": {
      const key = buildKey(message.data.roomId, message.data.deviceId);
      const existing = current[key] ?? {};
      return {
        ...current,
        [key]: {
          ...existing,
          roomState: message.data.roomState,
          lastRoomStateUpdate: now,
        },
      };
    }
    case "sensor_update": {
      const key = buildKey(message.data.roomId, message.data.deviceId);
      const existing = current[key] ?? {};
      return {
        ...current,
        [key]: {
          ...existing,
          sensorStatus: message.data.status,
          lastSensorUpdate: now,
        },
      };
    }
    case "connection_update": {
      const key = buildKey(message.data.roomId, message.data.deviceId);
      const existing = current[key] ?? {};
      return {
        ...current,
        [key]: {
          ...existing,
          connectionStatus: message.data.status,
          lastConnectionUpdate: now,
        },
      };
    }
    case "device_config_update":
      return current;
    default:
      return current;
  }
}

function mapRoomState(roomState?: string) {
  const key = roomState ?? "UNKNOWN";
  const entry = ROOM_STATE_MAP[key] ?? ROOM_STATE_MAP.UNKNOWN;
  return {
    label: entry.label,
    badgeText: key,
    badgeClass: entry.badgeClass,
  };
}

function mapSensorStatus(status?: SensorStatus) {
  if (!status || status === "unknown") {
    return {
      label: UNKNOWN_LABEL,
      indicatorColor: "gray" as IndicatorColor,
      indicatorLabel: UNKNOWN_LABEL,
    };
  }

  if (status === "alive") {
    return {
      label: "Alive",
      indicatorColor: "green" as IndicatorColor,
      indicatorLabel: "OK",
    };
  }

  return {
    label: "Check sensor",
    indicatorColor: "red" as IndicatorColor,
    indicatorLabel: "Problem",
  };
}

function mapConnectionStatus(status?: ConnectionStatus) {
  if (!status) {
    return { label: UNKNOWN_LABEL, color: "gray" as IndicatorColor };
  }

  if (status === "online") {
    return { label: "Online", color: "green" as IndicatorColor };
  }

  return { label: "Offline", color: "red" as IndicatorColor };
}

export function useLiveStatus(selected: IdPair | null): LiveStatusView {
  const { isConnected: wsConnected, subscribe, lastMessageAt } = useWebSocket();
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsubscribe = subscribe((message, timestamp) => {
      setStatusMap((current) => applyMessage(current, message, timestamp));
    });

    return unsubscribe;
  }, [subscribe]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  return useMemo(() => {
    const statusKey = selected
      ? buildKey(selected.roomId, selected.deviceId)
      : null;
    const status = statusKey ? statusMap[statusKey] : undefined;
    const roomStateView = mapRoomState(status?.roomState);
    const sensorView = mapSensorStatus(status?.sensorStatus);
    const connectionView = mapConnectionStatus(status?.connectionStatus);

    return {
      roomState: {
        label: roomStateView.label,
        badgeText: roomStateView.badgeText,
        badgeClass: roomStateView.badgeClass,
        lastUpdate: formatTimestamp(status?.lastRoomStateUpdate),
      },
      sensor: {
        label: sensorView.label,
        indicatorColor: sensorView.indicatorColor,
        indicatorLabel: sensorView.indicatorLabel,
        lastHeartbeat: formatRelative(status?.lastSensorUpdate, now),
      },
      connection: {
        ws: {
          label: wsConnected ? "Connected" : "Disconnected",
          color: wsConnected ? "green" : "gray",
        },
        device: {
          label: connectionView.label,
          color: connectionView.color,
        },
        lastUpdate: formatTimestamp(lastMessageAt),
      },
    };
  }, [selected, statusMap, wsConnected, lastMessageAt, now]);
}
