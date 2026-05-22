import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LiveBadge } from "@/components/dashboard/LiveBadge";
import { TopNavBar } from "@/components/dashboard/TopNavBar";
import { StatusCardsRow } from "@/components/dashboard/StatusCardsRow";
import { ConfigTable } from "@/components/dashboard/ConfigTable";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";

export function DashboardPage() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [device, setDevice] = useState("lr-01");

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  function handleForceCheck() {
    // TODO: trigger sensor check via API
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        device={device}
        onDeviceChange={setDevice}
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
        <StatusCardsRow onForceCheck={handleForceCheck} />

        {/* Row 2 — Device Configuration */}
        <ConfigTable />

        {/* Row 3 — Occupancy History Chart */}
        <OccupancyChart />
      </main>
    </div>
  );
}
