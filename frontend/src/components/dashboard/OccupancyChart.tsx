import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_DATA = [
  { time: "00:00", occupancy: 0 },
  { time: "00:45", occupancy: 0 },
  { time: "01:30", occupancy: 60 },
  { time: "02:15", occupancy: 85 },
  { time: "03:00", occupancy: 90 },
  { time: "03:45", occupancy: 40 },
  { time: "04:30", occupancy: 0 },
  { time: "05:15", occupancy: 0 },
  { time: "06:00", occupancy: 70 },
  { time: "06:45", occupancy: 80 },
  { time: "07:30", occupancy: 100 },
  { time: "08:15", occupancy: 65 },
  { time: "09:00", occupancy: 40 },
  { time: "09:45", occupancy: 0 },
  { time: "10:30", occupancy: 0 },
  { time: "11:15", occupancy: 50 },
];

const chartConfig = {
  occupancy: {
    label: "Occupancy %",
    color: "var(--color-foreground)",
  },
} satisfies ChartConfig;

const TIME_RANGE_OPTIONS = [
  { value: "12h", label: "Last 12 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const GRANULARITY_OPTIONS = [
  { value: "1m", label: "1 minute" },
  { value: "5m", label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "1h", label: "1 hour" },
];

export function OccupancyChart({
  device,
  room,
}: {
  device: string;
  room: string;
}) {
  const [timeRange, setTimeRange] = useState("12h");
  const [granularity, setGranularity] = useState("5m");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [timeRange, granularity]);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Occupancy History
            </h2>
            <p className="text-xs text-muted-foreground">
              Activity trends for the last 12 hours
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger size="sm" className="w-28">
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
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-muted-foreground/30" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Empty
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={MOCK_DATA} barGap={2}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="occupancy"
              fill="var(--color-occupancy)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  );
}
