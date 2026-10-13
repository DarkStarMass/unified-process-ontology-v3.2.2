import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StressRecord } from "@/lib/upo/studies";

const tick = { fill: "var(--color-muted)", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace" };
const grid = "var(--color-border)";

export function ConfidenceChart({
  rows,
  winner,
  before,
  after,
}: {
  rows: { i: number; pre: number; post: number }[];
  winner: number;
  before: string;
  after: string;
}) {
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={1} barCategoryGap="28%">
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="i" tick={tick} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} width={36} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--color-input)" }}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-foreground)",
              fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              fontSize: 12,
            }}
          />
          <Bar dataKey="pre" name={before} fill="var(--color-muted)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="post" name={after} radius={[2, 2, 0, 0]}>
            {rows.map((row) => (
              <Cell key={row.i} fill={row.i === winner ? "var(--color-ok)" : "var(--color-primary)"} />
            ))}
          </Bar>
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StressChart({
  records,
  stability,
  confidence,
  interventions,
}: {
  records: StressRecord[];
  stability: string;
  confidence: string;
  interventions: string;
}) {
  const data = records.map((r) => ({
    it: r.iteration,
    proxy: Number(r.stabilityProxy.toFixed(4)),
    conf: Number(r.systemConfidencePostReferee.toFixed(4)),
    interventions: r.swarmPanicInterventions,
  }));
  return (
    <div className="flex flex-col gap-4">
      <div className="h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="it" tick={tick} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 1]} width={36} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-foreground)",
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="proxy" name={stability} stroke="var(--color-primary)" dot={false} strokeWidth={1.75} />
            <Line type="monotone" dataKey="conf" name={confidence} stroke="var(--color-ok)" dot={false} strokeWidth={1.75} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-40 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="it" tick={tick} axisLine={false} tickLine={false} />
            <YAxis width={28} tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Bar dataKey="interventions" name={interventions} fill="var(--color-muted)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
