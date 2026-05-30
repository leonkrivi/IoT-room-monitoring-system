import { useEffect, useRef, useState } from "react";
import type { IdPair } from "@/types/IdPair";
import type {
  ConfigMap,
  ConfigParamView,
  DeviceConfigState,
  ParamStatus,
} from "@/types/LiveConfig";
import { buildKey } from "@/lib/utils";
import { useWebSocket } from "@/context/WebSocketContext";

const REJECTION_TIMEOUT_MS = 30_000; // fallback when current interval is unknown
const REJECTION_OFFSET_MS = 2_000;

function rejectionTimeout(currentMs: number | null): number {
  if (currentMs === null) return REJECTION_TIMEOUT_MS;
  return 3 * currentMs + REJECTION_OFFSET_MS;
}

function emptyState(): DeviceConfigState {
  return {
    hbIntervalMs: null,
    sensorRateMs: null,
    requestedHbIntervalMs: null,
    requestedSensorRateMs: null,
    requestedHbAt: null,
    requestedSensorAt: null,
    hbUpdatedAt: null,
    sensorUpdatedAt: null,
  };
}

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  return `${ms}ms`;
}

function deriveStatus(
  current: number | null,
  requested: number | null,
  requestedAt: number | null,
  now: number,
  timeoutMs: number,
): ParamStatus {
  if (requested === null) return "applied";
  if (current === requested) return "applied";
  if (requestedAt !== null && now - requestedAt > timeoutMs) return "rejected";
  return "pending";
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    timeZoneName: "short",
  });
}

export interface UseLiveConfigResult {
  rows: ConfigParamView[];
  requestConfigChange: (
    roomId: string,
    deviceId: string,
    params: { hbIntervalMs?: number; sensorRateMs?: number },
  ) => void;
}

export function useLiveConfig(selected: IdPair | null): UseLiveConfigResult {
  const { subscribe } = useWebSocket();
  const [configMap, setConfigMap] = useState<ConfigMap>({});
  const [now, setNow] = useState(() => Date.now());
  const rejectionTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const unsubscribe = subscribe((message, timestamp) => {
      if (message.type === "initial_state") {
        setConfigMap((prev) => {
          const next: ConfigMap = { ...prev };
          for (const [key, value] of Object.entries(message.data)) {
            const existing = next[key] ?? emptyState();
            const nextHb = value.config?.hbIntervalMs ?? existing.hbIntervalMs;
            const nextSensor =
              value.config?.sensorRateMs ?? existing.sensorRateMs;

            next[key] = {
              ...existing,
              hbIntervalMs: nextHb,
              sensorRateMs: nextSensor,
              requestedHbIntervalMs:
                value.config?.hbIntervalMs !== undefined
                  ? nextHb
                  : existing.requestedHbIntervalMs,
              requestedSensorRateMs:
                value.config?.sensorRateMs !== undefined
                  ? nextSensor
                  : existing.requestedSensorRateMs,
              requestedHbAt:
                value.config?.hbIntervalMs !== undefined
                  ? null
                  : existing.requestedHbAt,
              requestedSensorAt:
                value.config?.sensorRateMs !== undefined
                  ? null
                  : existing.requestedSensorAt,
              hbUpdatedAt:
                value.config?.hbIntervalMs !== undefined
                  ? timestamp
                  : existing.hbUpdatedAt,
              sensorUpdatedAt:
                value.config?.sensorRateMs !== undefined
                  ? timestamp
                  : existing.sensorUpdatedAt,
            };
          }
          return next;
        });
        return;
      }

      if (message.type === "device_config_update") {
        const { roomId, deviceId, hbIntervalMs, sensorRateMs } = message.data;
        const key = buildKey(roomId, deviceId);

        setConfigMap((prev) => {
          const existing = prev[key] ?? emptyState();
          return {
            ...prev,
            [key]: {
              ...existing,
              hbIntervalMs: hbIntervalMs ?? existing.hbIntervalMs,
              sensorRateMs: sensorRateMs ?? existing.sensorRateMs,
              requestedHbIntervalMs:
                hbIntervalMs !== undefined
                  ? hbIntervalMs
                  : existing.requestedHbIntervalMs,
              requestedSensorRateMs:
                sensorRateMs !== undefined
                  ? sensorRateMs
                  : existing.requestedSensorRateMs,
              requestedHbAt:
                hbIntervalMs !== undefined ? null : existing.requestedHbAt,
              requestedSensorAt:
                sensorRateMs !== undefined ? null : existing.requestedSensorAt,
              hbUpdatedAt:
                hbIntervalMs !== undefined ? timestamp : existing.hbUpdatedAt,
              sensorUpdatedAt:
                sensorRateMs !== undefined
                  ? timestamp
                  : existing.sensorUpdatedAt,
            },
          };
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Update "now" every 5 seconds to trigger status recalculations and potential rejection state updates
  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Clear any pending rejection timers when the component unmounts
  useEffect(() => {
    return () => {
      rejectionTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function requestConfigChange(
    roomId: string,
    deviceId: string,
    params: { hbIntervalMs?: number; sensorRateMs?: number },
  ) {
    const key = buildKey(roomId, deviceId);
    const now = Date.now();

    setConfigMap((prev) => {
      const existing = prev[key] ?? emptyState();
      return {
        ...prev,
        [key]: {
          ...existing,
          requestedHbIntervalMs:
            params.hbIntervalMs !== undefined
              ? params.hbIntervalMs
              : existing.requestedHbIntervalMs,
          requestedSensorRateMs:
            params.sensorRateMs !== undefined
              ? params.sensorRateMs
              : existing.requestedSensorRateMs,
          requestedHbAt:
            params.hbIntervalMs !== undefined ? now : existing.requestedHbAt,
          requestedSensorAt:
            params.sensorRateMs !== undefined
              ? now
              : existing.requestedSensorAt,
        },
      };
    });

    if (params.hbIntervalMs !== undefined) {
      const hbTimeout = rejectionTimeout(params.hbIntervalMs);
      const hbTimerId = setTimeout(() => setNow(Date.now()), hbTimeout + 100);
      const prevHb = rejectionTimers.current.get(`${key}:hb`);
      if (prevHb) clearTimeout(prevHb);
      rejectionTimers.current.set(`${key}:hb`, hbTimerId);
    }
    if (params.sensorRateMs !== undefined) {
      const sensorTimeout = rejectionTimeout(params.sensorRateMs);
      const sensorTimerId = setTimeout(
        () => setNow(Date.now()),
        sensorTimeout + 100,
      );
      const prevSensor = rejectionTimers.current.get(`${key}:sensor`);
      if (prevSensor) clearTimeout(prevSensor);
      rejectionTimers.current.set(`${key}:sensor`, sensorTimerId);
    }
  }

  // If no device is selected, return default rows with "—" values and "applied" status
  if (!selected) {
    return {
      rows: [
        {
          id: "hb-interval",
          parameter: "Sensor heartbeat interval",
          value: "—",
          requestedValue: "—",
          status: "applied" as ParamStatus,
          lastUpdated: "—",
        },
        {
          id: "sensor-rate",
          parameter: "Sensor rate",
          value: "—",
          requestedValue: "—",
          status: "applied" as ParamStatus,
          lastUpdated: "—",
        },
      ],
      requestConfigChange,
    };
  }

  const key = buildKey(selected.roomId, selected.deviceId);
  const state = configMap[key] ?? emptyState();

  const hbStatus = deriveStatus(
    state.hbIntervalMs,
    state.requestedHbIntervalMs,
    state.requestedHbAt,
    now,
    rejectionTimeout(state.requestedHbIntervalMs ?? state.hbIntervalMs),
  );
  const sensorStatus = deriveStatus(
    state.sensorRateMs,
    state.requestedSensorRateMs,
    state.requestedSensorAt,
    now,
    rejectionTimeout(state.requestedSensorRateMs ?? state.sensorRateMs),
  );

  return {
    rows: [
      {
        id: "hb-interval",
        parameter: "Sensor heartbeat interval",
        value: formatMs(state.hbIntervalMs),
        requestedValue: formatMs(
          state.requestedHbIntervalMs ?? state.hbIntervalMs,
        ),
        status: hbStatus,
        lastUpdated: formatTimestamp(state.hbUpdatedAt),
      },
      {
        id: "sensor-rate",
        parameter: "Sensor rate",
        value: formatMs(state.sensorRateMs),
        requestedValue: formatMs(
          state.requestedSensorRateMs ?? state.sensorRateMs,
        ),
        status: sensorStatus,
        lastUpdated: formatTimestamp(state.sensorUpdatedAt),
      },
    ],
    requestConfigChange,
  };
}
