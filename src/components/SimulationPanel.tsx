'use client';

import { useState } from 'react';
import { CROP_SETTINGS, type CropType } from '@/config/crops';
import { fetchHistoricalWeather, getAvailableYears } from '@/services/weather';
import { runYearSimulation, type SimulationSummary, type DailyCalculation } from '@/lib/calculations';
import type { Coordinates } from '@/types/location';

interface SimulationPanelProps {
  coordinates: Coordinates;
}

type SimulationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SimulationPanel({ coordinates }: SimulationPanelProps) {
  const [selectedYear, setSelectedYear] = useState<number>(getAvailableYears()[0]);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('Vineyard');
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalculation[] | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const availableYears = getAvailableYears();
  const cropConfig = CROP_SETTINGS[selectedCrop];

  const runSimulation = async () => {
    setStatus('loading');
    setError(null);
    setSummary(null);
    setDailyData(null);

    try {
      // Fetch historical weather data
      const { data: weatherData, elevation: elev } = await fetchHistoricalWeather(
        coordinates,
        selectedYear
      );
      setElevation(elev);

      // Run simulation with crop-specific parameters
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
      <h2 className="text-lg font-semibold text-gray-900">Historical Simulation</h2>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
            disabled={status === 'loading'}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Crop</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value as CropType)}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
            disabled={status === 'loading'}
          >
            {Object.keys(CROP_SETTINGS).map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Crop Parameters Display */}
      <div className="bg-gray-50 p-3 rounded-lg text-xs">
        <div className="font-medium text-gray-700 mb-1">
          {selectedCrop} Parameters
        </div>
        <div className="grid grid-cols-3 gap-2 text-gray-600">
          <div>Base: {cropConfig.baseTemp}°C</div>
          <div>Kc: {cropConfig.kcInitial}-{cropConfig.kcPeak}</div>
          <div>Phases: {cropConfig.phaseThresholds.length}</div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={runSimulation}
        disabled={status === 'loading'}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Running Simulation...' : 'Run Simulation'}
      </button>

      {/* Error Display */}
      {status === 'error' && error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results Summary */}
      {status === 'success' && summary && (
        <div className="space-y-3">
          {elevation !== null && (
            <div className="text-xs text-gray-500 text-center">
              Elevation: {Math.round(elevation)}m
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 mb-3">
              {selectedYear} {selectedCrop} Simulation Results
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Total GDD</div>
                <div className="font-semibold">{summary.totalGdd}°</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Peak Phase</div>
                <div className="font-semibold">{summary.peakPhaseReached}</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Total ETc</div>
                <div className="font-semibold">{summary.totalEtc} mm</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Precipitation</div>
                <div className="font-semibold">{summary.totalPrecipitation} mm</div>
              </div>
              <div className="bg-white p-2 rounded col-span-2">
                <div className="text-xs text-gray-500">Water Deficit (Irrigation Need)</div>
                <div className="font-semibold text-orange-600">
                  {summary.totalWaterDeficit} mm over {summary.daysWithDeficit} days
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Daily Details' : 'Show Daily Details'}
          </button>

          {/* Daily Data Table */}
          {showDetails && dailyData && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-right">GDD</th>
                    <th className="p-2 text-left">Phase</th>
                    <th className="p-2 text-right">Kc</th>
                    <th className="p-2 text-right">ETc</th>
                    <th className="p-2 text-right">Rain</th>
                    <th className="p-2 text-right">Deficit</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData
                    .filter((d) => d.gddDaily > 0 || d.waterDeficit > 0)
                    .slice(0, 100)
                    .map((day) => (
                      <tr key={day.date} className="border-b border-gray-100">
                        <td className="p-2">{day.date}</td>
                        <td className="p-2 text-right">{day.gddCumulative}</td>
                        <td className="p-2">{day.currentPhase}</td>
                        <td className="p-2 text-right">{day.kc}</td>
                        <td className="p-2 text-right">{day.etc}</td>
                        <td className="p-2 text-right">{day.precipitation}</td>
                        <td className="p-2 text-right text-orange-600">
                          {day.waterDeficit > 0 ? day.waterDeficit : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {dailyData.filter((d) => d.gddDaily > 0 || d.waterDeficit > 0).length > 100 && (
                <div className="text-center text-xs text-gray-500 py-2">
                  Showing first 100 active days...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
