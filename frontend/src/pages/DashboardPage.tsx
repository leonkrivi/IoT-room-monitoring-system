import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { api } from "@/lib/api";
import { LiveBadge } from "@/components/dashboard/LiveBadge";
import { TopNavBar } from "@/components/dashboard/TopNavBar";
import { StatusCardsRow } from "@/components/dashboard/StatusCardsRow";
import { ConfigTable } from "@/components/dashboard/ConfigTable";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { NoDevicesEmpty } from "@/components/dashboard/NoDevicesEmpty";
import type { IdPair } from "@/types/IdPair";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import { useLiveConfig } from "@/hooks/useLiveConfig";
import type { WsMessage } from "@/hooks/wsSchemas";

function parseDeviceKey(key: string): IdPair | null {
  const [roomId, deviceId] = key.split("::");
  if (!roomId || !deviceId) return null;
  return { roomId, deviceId };
}

function getDeviceFromMessage(message: WsMessage): IdPair | null {
  switch (message.type) {
    case "initial_state": {
      const firstKey = Object.keys(message.data)[0];
      return firstKey ? parseDeviceKey(firstKey) : null;
    }
    case "room_state_update":
    case "connection_update":
    case "sensor_update":
    case "device_config_update":
      return {
        roomId: message.data.roomId,
        deviceId: message.data.deviceId,
      };
    default:
      return null;
  }
}

function getDevicesFromInitialState(message: WsMessage): IdPair[] {
  if (message.type !== "initial_state") return [];
  return Object.keys(message.data)
    .map((key) => parseDeviceKey(key))
    .filter((pair): pair is IdPair => pair !== null);
}

export function DashboardPage() {
  const { logout } = useAuth();
  const { subscribe } = useWebSocket();

  const [loggingOut, setLoggingOut] = useState(false);
  const [devices, setDevices] = useState<IdPair[]>([]);
  const [selected, setSelected] = useState<IdPair | null>(null);
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(false);

  const liveStatus = useLiveStatus(selected);
  const { rows: configRows, requestConfigChange } = useLiveConfig(selected);

  const devicesRef = useRef<IdPair[]>([]);
  const selectedRef = useRef<IdPair | null>(null);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    api.devices.list().then(({ data }) => {
      setDevices((prev) => (data.length > 0 ? data : prev));
      setSelected((prev) => prev ?? (data.length > 0 ? data[0] : prev));
    });
  }, []);

  // only updates state if we don't have any devices yet or if we haven't selected a device yet
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      // GATE
      if (devicesRef.current.length > 0 || selectedRef.current) return;

      if (message.type === "initial_state") {
        const initialDevices = getDevicesFromInitialState(message);
        if (initialDevices.length > 0) {
          setDevices(initialDevices);
          setSelected(initialDevices[0]);
        }
        return;
      }

      const pair = getDeviceFromMessage(message);
      if (!pair) return;

      setDevices([pair]);
      setSelected(pair);
    });

    return unsubscribe;
  }, [subscribe]);

  async function handleRefreshDevices() {
    setRefreshingDevices(true);
    try {
      const { data } = await api.devices.list();
      setDevices(data);
      if (selected === null && data.length > 0) setSelected(data[0]);
    } finally {
      setRefreshingDevices(false);
    }
  }

  function handleSelectionChange(value: IdPair) {
    setLoadingDevice(true);
    setSelected(value);
    setTimeout(() => setLoadingDevice(false), 500);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  async function handleForceSensorStatusCheck() {
    if (!selected) return;
    await api.mqtt.checkSensor(selected.roomId, selected.deviceId);
  }

  async function handleConfigRequest(paramId: string, valueMs: number) {
    if (!selected) return;

    if (paramId === "hb-interval") {
      requestConfigChange(selected.roomId, selected.deviceId, {
        hbIntervalMs: valueMs,
      });
      await api.mqtt.publishConfiguration(selected.roomId, selected.deviceId, {
        hb_rate: valueMs,
      });
      return;
    }

    if (paramId === "sensor-rate") {
      requestConfigChange(selected.roomId, selected.deviceId, {
        sensorRateMs: valueMs,
      });
      await api.mqtt.publishConfiguration(selected.roomId, selected.deviceId, {
        sensor_rate: valueMs,
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        devices={devices}
        selected={selected}
        onSelectionChange={handleSelectionChange}
        onRefreshDevices={() => void handleRefreshDevices()}
        refreshingDevices={refreshingDevices}
        loggingOut={loggingOut}
        onLogout={() => void handleLogout()}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {devices.length === 0 ? (
          <NoDevicesEmpty
            refreshing={refreshingDevices}
            onRefresh={() => void handleRefreshDevices()}
          />
        ) : (
          <>
            {/* Dashboard header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Dashboard Overview
              </h1>
              <LiveBadge />
            </div>

            {/* Row 1 — Status Cards */}
            <StatusCardsRow
              loading={loadingDevice}
              onForceCheck={() => void handleForceSensorStatusCheck()}
              liveStatus={liveStatus}
            />

            {/* Row 2 — Device Configuration */}
            <ConfigTable
              loading={loadingDevice}
              rows={configRows}
              onRequestChange={(id, valueMs) =>
                void handleConfigRequest(id, valueMs)
              }
            />

            {/* Row 3 — Occupancy History Chart */}
            <OccupancyChart
              deviceId={selected?.deviceId ?? ""}
              roomId={selected?.roomId ?? ""}
              deviceLoading={loadingDevice}
            />
          </>
        )}
      </main>
    </div>
  );
}
