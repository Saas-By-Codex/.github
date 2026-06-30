"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#13874f";
const GRID = "#e2e8f0";

export function BatteryTrendChart({
  data,
}: {
  data: { time: string; level: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="batt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.4} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
        <Tooltip />
        <Area type="monotone" dataKey="level" stroke={BRAND} fill="url(#batt)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CostBarChart({
  data,
}: {
  data: { date: string; cost: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="cost" fill={BRAND} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EnergyLineChart({
  data,
}: {
  data: { date: string; energyKwh: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit=" kWh" />
        <Tooltip />
        <Line type="monotone" dataKey="energyKwh" stroke={BRAND} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScoreBarChart({
  data,
}: {
  data: { name: string; score: number }[];
}) {
  const color = (s: number) => (s >= 85 ? "#13874f" : s >= 70 ? "#d97706" : "#dc2626");
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={color(d.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
