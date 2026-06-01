"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

interface ChartDataPoint {
  date: string;
  paddyIn: number;
  riceOut: number;
  yield: number;
}

interface ProductionChartProps {
  data: ChartDataPoint[];
}

// Custom tooltips to present nicely in dark mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 p-4 rounded-xl shadow-xl backdrop-blur-md space-y-2">
        <p className="text-xs font-bold text-slate-200">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-6 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {entry.name.includes("Yield")
                  ? `${entry.value}%`
                  : `${entry.value.toLocaleString("id-ID")} kg`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function ProductionChart({ data }: ProductionChartProps) {

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-200">Tren Aliran Produksi & Yield</h3>
        <p className="text-xs text-slate-500">Perbandingan Padi Masuk vs Beras Keluar dan Rata-rata Yield 7 Hari Terakhir</p>
      </div>

      <div className="h-[300px] w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} dy={8} />
            
            {/* Primary Y-Axis for weights */}
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}t`}
              dx={-8}
            />
            
            {/* Secondary Y-Axis for yield */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              dx={8}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ top: -10, right: 0 }}
            />

            {/* Bars for Paddy In and Rice Out */}
            <Bar
              yAxisId="left"
              name="Padi Masuk"
              dataKey="paddyIn"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              yAxisId="left"
              name="Beras Keluar"
              dataKey="riceOut"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />

            {/* Yield Line Overlay */}
            <Line
              yAxisId="right"
              type="monotone"
              name="Overall Yield"
              dataKey="yield"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
