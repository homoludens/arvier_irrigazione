'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  Bar,
  ReferenceLine,
} from 'recharts';
import type { PhaseThreshold } from '@/config/crops';

interface ChartData {
  date: string;
  gddCumulative?: number;
  gddDaily?: number;
  et0?: number;
  etc?: number;
  precipitation?: number;
  waterDeficit?: number;
  kc?: number;
}

interface ChartProps {
  data: ChartData[];
  height?: number;
}

interface GDDChartProps extends ChartProps {
  phaseThresholds?: PhaseThreshold[];
}

// Format date for display (MM/DD)
const formatDate = (date: string) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// Format month for axis
const formatMonth = (date: string) => {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getMonth()];
};

// Sample data to reduce points for smoother charts
const sampleData = (data: ChartData[], maxPoints: number = 60): ChartData[] => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
};

// Colors for phase markers
const phaseColors = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * GDD Cumulative Chart - Shows growing degree days accumulation with phenophase markers
 */
export function GDDChart({ data, height = 200, phaseThresholds = [] }: GDDChartProps) {
  const chartData = sampleData(data);
  
  // Calculate max GDD for Y-axis domain
  const maxGdd = Math.max(...data.map(d => d.gddCumulative || 0));
  const yMax = Math.max(maxGdd * 1.1, ...phaseThresholds.map(p => p.gdd * 1.1));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Growing Degree Days (GDD)
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 10, fill: '#64748b' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#64748b' }}
            domain={[0, yMax]}
          />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value) => [`${Math.round(Number(value))}°`, 'GDD']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          
          {/* Phase threshold reference lines */}
          {phaseThresholds.map((phase, index) => (
            <ReferenceLine
              key={phase.name}
              y={phase.gdd}
              stroke={phaseColors[index % phaseColors.length]}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `${phase.name} (${phase.gdd})`,
                position: 'right',
                fill: phaseColors[index % phaseColors.length],
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          ))}
          
          <Line
            type="monotone"
            dataKey="gddCumulative"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Cumulative GDD"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Phase legend */}
      {phaseThresholds.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
          {phaseThresholds.map((phase, index) => (
            <div key={phase.name} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: phaseColors[index % phaseColors.length] }}
              />
              <span className="text-slate-600">{phase.name}</span>
              <span className="text-slate-400">({phase.gdd}°)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ET0 and Precipitation Chart - Shows evapotranspiration and rainfall
 */
export function WeatherChart({ data, height = 200 }: ChartProps) {
  const chartData = sampleData(data);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        ET0 & Precipitation
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 10, fill: '#64748b' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} mm`,
              name === 'et0' ? 'ET0' : 'Rain'
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value) => value === 'et0' ? 'ET0' : 'Precipitation'}
          />
          <Bar 
            dataKey="precipitation" 
            fill="#38bdf8" 
            opacity={0.7}
            name="precipitation"
          />
          <Line
            type="monotone"
            dataKey="et0"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            name="et0"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Water Balance Chart - Shows ETc and water deficit
 */
export function WaterBalanceChart({ data, height = 200 }: ChartProps) {
  const chartData = sampleData(data);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Water Balance
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 10, fill: '#64748b' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                etc: 'Crop Water Use',
                waterDeficit: 'Deficit',
              };
              return [`${Number(value).toFixed(1)} mm`, labels[String(name)] || String(name)];
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                etc: 'ETc',
                waterDeficit: 'Deficit',
              };
              return labels[String(value)] || String(value);
            }}
          />
          <Line
            type="monotone"
            dataKey="etc"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="etc"
          />
          <Area
            type="monotone"
            dataKey="waterDeficit"
            fill="#ef4444"
            fillOpacity={0.3}
            stroke="#ef4444"
            strokeWidth={1}
            name="waterDeficit"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Kc Chart - Shows crop coefficient over time
 */
export function KcChart({ data, height = 150 }: ChartProps) {
  const chartData = sampleData(data);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Crop Coefficient (Kc)
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 10, fill: '#64748b' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#64748b' }}
            domain={[0, 1.2]}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value) => [Number(value).toFixed(2), 'Kc']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="stepAfter"
            dataKey="kc"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="Kc"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
