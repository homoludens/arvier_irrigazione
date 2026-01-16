'use client';

import { useState } from 'react';
import { CROP_SETTINGS, type CropType } from '@/config/crops';
import { fetchHistoricalWeather, getAvailableYears } from '@/services/weather';
import { runYearSimulation, type SimulationSummary, type DailyCalculation } from '@/lib/calculations';
import type { Coordinates } from '@/types/location';
import { GDDChart, WeatherChart, WaterBalanceChart, KcChart } from './Charts';

interface SimulationPanelProps {
  coordinates: Coordinates;
}

type SimulationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SimulationPanel({ coordinates }: SimulationPanelProps) {
  const [selectedYear, setSelectedYear] = useState<number>(getAvailableYears()[0]);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('Apple');
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalculation[] | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const availableYears = getAvailableYears();
  const cropConfig = CROP_SETTINGS[selectedCrop];

  const runSimulation = async () => {
    setStatus('loading');
    setError(null);
    setSummary(null);
    setDailyData(null);

    try {
      const { data: weatherData, elevation: elev } = await fetchHistoricalWeather(
        coordinates,
        selectedYear
      );
      setElevation(elev);

      const result = runYearSimulation(weatherData, cropConfig);
      
      setSummary(result.summary);
      setDailyData(result.daily);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Crop Selector */}
        <label className="block text-xs text-slate-500 mb-2">Crop</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.keys(CROP_SETTINGS) as CropType[]).map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              disabled={status === 'loading'}
              className={`py-2.5 px-2 rounded-lg font-semibold text-sm transition-all ${
                selectedCrop === crop
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
              } disabled:opacity-50`}
            >
              {crop}
            </button>
          ))}
        </div>

        {/* Year Selector */}
        <label className="block text-xs text-slate-500 mb-2">Year</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium mb-4"
          disabled={status === 'loading'}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <button
          onClick={runSimulation}
          disabled={status === 'loading'}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Running...' : 'Run Simulation'}
        </button>
      </div>

      {/* Error */}
      {status === 'error' && error && (
        <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {status === 'success' && summary && dailyData && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {selectedYear} Results
              </h3>
              {elevation !== null && (
                <span className="text-xs text-slate-400">{Math.round(elevation)}m</span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-900">{summary.totalGdd}°</p>
                <p className="text-xs text-slate-500">Total GDD</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-900">{summary.peakPhaseReached}</p>
                <p className="text-xs text-slate-500">Peak Phase</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-900">{summary.totalPrecipitation}<span className="text-sm font-normal">mm</span></p>
                <p className="text-xs text-slate-500">Precipitation</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-orange-600">{summary.totalWaterDeficit}<span className="text-sm font-normal">mm</span></p>
                <p className="text-xs text-slate-500">Water Deficit</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <GDDChart data={dailyData} phaseThresholds={cropConfig.phaseThresholds} />
          <WeatherChart data={dailyData} />
          <WaterBalanceChart data={dailyData} />
          <KcChart data={dailyData} />

          {/* Table Toggle */}
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full py-3 bg-white rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            {showTable ? 'Hide Data Table' : 'Show Data Table'}
          </button>

          {/* Daily Data Table */}
          {showTable && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left font-semibold text-slate-600">Date</th>
                      <th className="p-2 text-right font-semibold text-slate-600">GDD</th>
                      <th className="p-2 text-left font-semibold text-slate-600">Phase</th>
                      <th className="p-2 text-right font-semibold text-slate-600">Kc</th>
                      <th className="p-2 text-right font-semibold text-slate-600">ET0</th>
                      <th className="p-2 text-right font-semibold text-slate-600">ETc</th>
                      <th className="p-2 text-right font-semibold text-slate-600">Rain</th>
                      <th className="p-2 text-right font-semibold text-slate-600">Deficit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData
                      .filter((d) => d.gddDaily > 0 || d.waterDeficit > 0)
                      .map((day) => (
                        <tr key={day.date} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2 text-slate-700">{day.date}</td>
                          <td className="p-2 text-right text-slate-900">{day.gddCumulative}</td>
                          <td className="p-2 text-slate-600">{day.currentPhase}</td>
                          <td className="p-2 text-right text-slate-600">{day.kc}</td>
                          <td className="p-2 text-right text-slate-600">{day.et0}</td>
                          <td className="p-2 text-right text-slate-900">{day.etc}</td>
                          <td className="p-2 text-right text-sky-600">{day.precipitation || '-'}</td>
                          <td className="p-2 text-right text-orange-600">
                            {day.waterDeficit > 0 ? day.waterDeficit : '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
