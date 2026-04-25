"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

type SentimentPoint = {
  ts: number;
  score: number;
  label: string;
  rationale: string;
  cues: string[];
};

export default function SentimentTimeline({
  data,
}: {
  data: SentimentPoint[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    time: new Date(d.ts * 1000).toLocaleTimeString(),
  }));

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Engagement Timeline
      </h2>
      {chartData.length === 0 ? (
        <p className="text-zinc-500 text-sm italic">
          No sentiment data yet...
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#888" }} />
            <YAxis
              domain={[-5, 5]}
              tick={{ fontSize: 10, fill: "#888" }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, _name, props) => {
                const pt = (props as unknown as { payload: SentimentPoint }).payload;
                return [`${value} — ${pt.rationale}`, "Score"];
              }}
            />
            <ReferenceLine y={0} stroke="#555" />
            <ReferenceLine
              y={-2}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "Disengaged", position: "right", fill: "#ef4444", fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: "#6366f1" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
