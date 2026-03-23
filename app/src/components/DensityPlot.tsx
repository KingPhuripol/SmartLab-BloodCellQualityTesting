import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DensityPlotProps {
  data: number[];
  title?: string;
}

export function DensityPlot({ data, title }: DensityPlotProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Calculate simple histogram to approximate density
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // If all values are the same
    if (range === 0) {
      return [{ val: min, count: data.length }];
    }

    // Use 40 bins
    const numBins = 40;
    const binSize = range / numBins;

    const bins = Array.from({ length: numBins }, (_, i) => ({
      val: min + i * binSize + binSize / 2, // center of bin
      count: 0,
    }));

    for (const v of data) {
      const binIdx = Math.min(Math.floor((v - min) / binSize), numBins - 1);
      if (bins[binIdx]) bins[binIdx].count += 1;
    }

    // Smooth the bins to make it look like a KDE
    const smoothed = bins.map((b, i) => {
      const prev = i > 0 ? bins[i - 1].count : 0;
      const next = i < bins.length - 1 ? bins[i + 1].count : 0;
      return { val: b.val, count: (prev + b.count * 2 + next) / 4 };
    });

    return smoothed;
  }, [data]);

  return (
    <div className="w-full h-64 bg-white p-4 rounded-xl border border-slate-200">
      {title && (
        <h3 className="text-sm font-bold text-slate-700 mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="val"
            tickFormatter={(val) => Number(val).toFixed(2)}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(1), "Density"]}
            labelFormatter={(label: number) =>
              `Value: ${Number(label).toFixed(2)}`
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorCount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
