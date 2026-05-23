import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { LiveBadge } from "@/components/dashboard/LiveBadge";
import { TopNavBar } from "@/components/dashboard/TopNavBar";
import { StatusCardsRow } from "@/components/dashboard/StatusCardsRow";
import { ConfigTable } from "@/components/dashboard/ConfigTable";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import type { IdPair } from "@/types/IdPair";

export function DashboardPage() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [devices, setDevices] = useState<IdPair[]>([]);
  const [selected, setSelected] = useState<IdPair | null>(null);

  useEffect(() => {
    api.devices.list().then(({ data }) => {
      setDevices(data);
      if (data.length > 0) setSelected(data[0]);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  function handleForceSensorStatusCheck() {
    // TODO: trigger sensor check via API
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        devices={devices}
        selected={selected}
        onSelectionChange={setSelected}
        loggingOut={loggingOut}
        onLogout={() => void handleLogout()}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Dashboard header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <LiveBadge />
        </div>

        {/* Row 1 — Status Cards */}
        <StatusCardsRow onForceCheck={handleForceSensorStatusCheck} />

        {/* Row 2 — Device Configuration */}
        <ConfigTable />

        {/* Row 3 — Occupancy History Chart */}
        <OccupancyChart
          deviceId={selected?.deviceId ?? ""}
          roomId={selected?.roomId ?? ""}
        />
      </main>
    </div>
  );
}
