import { useEffect, useState, useCallback } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { RoomStateEntry } from "@/types/RoomStateEntry";

// Must match backend ALLOWED_HOURS and ALLOWED_GRANULARITIES in constants.js
// TODO: fetch from backend (e.g. GET /room-state/query-presets) to avoid duplication
const HOURS_OPTIONS = [
  { value: 1, label: "Last 1 hour" },
  { value: 3, label: "Last 3 hours" },
  { value: 6, label: "Last 6 hours" },
  { value: 12, label: "Last 12 hours" },
  { value: 24, label: "Last 24 hours" },
  { value: 48, label: "Last 48 hours" },
  { value: 168, label: "Last 7 days" },
];

const GRANULARITY_OPTIONS = [
  { value: "1m", label: "1 minute" },
  { value: "5m", label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "1d", label: "1 day" },
];

type RoomState = "UNOCCUPIED" | "OCCUPIED_STATIC" | "OCCUPIED_ACTIVE";

const STATE_HEIGHT: Record<RoomState, number> = {
  UNOCCUPIED: 1,
  OCCUPIED_STATIC: 2,
  OCCUPIED_ACTIVE: 3,
};

const STATE_COLOR: Record<RoomState, string> = {
  UNOCCUPIED: "var(--color-chart-1)",
  OCCUPIED_STATIC: "var(--color-chart-2)",
  OCCUPIED_ACTIVE: "var(--color-chart-5)",
};

const STATE_LABEL: Record<RoomState, string> = {
  UNOCCUPIED: "Unoccupied",
  OCCUPIED_STATIC: "Occupied_static",
  OCCUPIED_ACTIVE: "Occupied_active",
};

const Y_TICKS = [1, 2, 3];
const Y_TICK_LABELS: Record<number, string> = {
  1: "Empty",
  2: "Static",
  3: "Active",
};

const chartConfig = {
  state: { label: "Room State" },
} satisfies ChartConfig;

function formatTime(iso: string, hours: number): string {
  const d = new Date(iso);
  if (hours <= 48) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isRoomState(s: string): s is RoomState {
  return (
    s === "UNOCCUPIED" || s === "OCCUPIED_STATIC" || s === "OCCUPIED_ACTIVE"
  );
}

interface ChartPoint {
  time: string;
  rawTime: string;
  height: number;
  state: RoomState;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{STATE_LABEL[d.state]}</p>
      <p className="text-muted-foreground">
        {new Date(d.rawTime).toLocaleString()}
      </p>
    </div>
  );
}

export function OccupancyChart({
  deviceId,
  roomId,
  deviceLoading = false,
}: {
  deviceId: string;
  roomId: string;
  deviceLoading?: boolean;
}) {
  const [hours, setHours] = useState(12);
  const [granularity, setGranularity] = useState("15m");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    if (!roomId || !deviceId) return;
    setLoading(true);
    setError(null);
    api.roomState
      .getRoomStateRecent(roomId, deviceId, hours, granularity)
      .then(({ data }) => {
        const points: ChartPoint[] = (data as RoomStateEntry[])
          .filter((e) => isRoomState(e.roomState))
          .map((e) => ({
            rawTime: e.time,
            time: formatTime(e.time, hours),
            height: STATE_HEIGHT[e.roomState as RoomState],
            state: e.roomState as RoomState,
          }));
        setChartData(points);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roomId, deviceId, hours, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedHoursLabel =
    HOURS_OPTIONS.find((o) => o.value === hours)?.label ?? "";

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Occupancy History
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedHoursLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                onClick={fetchData}
                disabled={loading || deviceLoading}
                title="Refresh chart"
              >
                {loading ? (
                  <Spinner className="size-4" />
                ) : (
                  <RefreshCwIcon className="size-4" />
                )}
              </button>
              <Select
                value={String(hours)}
                onValueChange={(v) => setHours(Number(v))}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRANULARITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 border-l border-border pl-3">
              {(
                [
                  "UNOCCUPIED",
                  "OCCUPIED_STATIC",
                  "OCCUPIED_ACTIVE",
                ] as RoomState[]
              ).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: STATE_COLOR[s] }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {STATE_LABEL[s]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {deviceLoading ? (
          <div className="flex h-64 flex-col gap-3">
            <div className="flex items-end gap-1 h-full px-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${30 + Math.sin(i * 0.8) * 20 + 20}%` }}
                />
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : error ? (
          <Skeleton className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-lg animation-none animate-none">
            <span className="text-sm font-medium text-muted-foreground">
              Chart unavailable
            </span>
            <span className="max-w-xs text-center text-xs text-muted-foreground/70">
              {error}
            </span>
          </Skeleton>
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                domain={[0, 3]}
                ticks={Y_TICKS}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => Y_TICK_LABELS[v] ?? ""}
                width={52}
              />
              <ChartTooltip cursor={false} content={<CustomTooltip />} />
              <Bar dataKey="height" radius={[4, 4, 4, 4]} maxBarSize={40}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={STATE_COLOR[entry.state]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </section>
  );
}
