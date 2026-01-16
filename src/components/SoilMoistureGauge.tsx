'use client';

interface SoilMoistureGaugeProps {
  moisturePercent: number;
  currentPhase: string;
  isLoading?: boolean;
}

export default function SoilMoistureGauge({
  moisturePercent,
  currentPhase,
  isLoading = false,
}: SoilMoistureGaugeProps) {
  const moisture = Math.max(0, Math.min(100, moisturePercent));
  
  const getColor = () => {
    if (moisture >= 60) return { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Good' };
    if (moisture >= 35) return { bar: 'bg-amber-500', text: 'text-amber-600', label: 'Moderate' };
    if (moisture >= 15) return { bar: 'bg-orange-500', text: 'text-orange-600', label: 'Low' };
    return { bar: 'bg-red-500', text: 'text-red-600', label: 'Critical' };
  };

  const color = getColor();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
          <div className="h-6 bg-slate-200 rounded-full mb-2"></div>
          <div className="h-8 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Soil Moisture
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          {currentPhase}
        </span>
      </div>
      
      {/* Simple bar gauge */}
      <div className="h-6 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color.bar}`}
          style={{ width: `${moisture}%` }}
        />
      </div>
      
      {/* Value display */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">
            {Math.round(moisture)}
          </span>
          <span className="text-lg text-slate-400">%</span>
        </div>
        <span className={`text-sm font-semibold ${color.text}`}>
          {color.label}
        </span>
      </div>
    </div>
  );
}
