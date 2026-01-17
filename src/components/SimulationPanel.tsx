'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CROP_SETTINGS, type CropType } from '@/config/crops';
import { fetchHistoricalWeather, getAvailableYears } from '@/services/weather';
import { runYearSimulation, type SimulationSummary, type DailyCalculation, type IrrigationEvent } from '@/lib/calculations';
import type { Coordinates } from '@/types/location';
import { GDDChart, WeatherChart, WaterBalanceChart, SoilWaterChart, KcChart } from './Charts';

interface SimulationPanelProps {
  coordinates: Coordinates;
}

type SimulationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SimulationPanel({ coordinates }: SimulationPanelProps) {
  const t = useTranslations('simulation');
  const tCrops = useTranslations('crops');
  const tIrrigation = useTranslations('irrigation');
  const tCommon = useTranslations('common');
  const tTable = useTranslations('table');
  const [selectedYear, setSelectedYear] = useState<number>(getAvailableYears()[0]);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('Apple');
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalculation[] | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [irrigationEvents, setIrrigationEvents] = useState<IrrigationEvent[]>([]);
  const [newIrrigationDate, setNewIrrigationDate] = useState<string>('');
  const [newIrrigationAmount, setNewIrrigationAmount] = useState<string>('');

  const availableYears = getAvailableYears();
  const cropConfig = CROP_SETTINGS[selectedCrop];

  const addIrrigationEvent = () => {
    if (!newIrrigationDate || !newIrrigationAmount) return;
    const amount = parseFloat(newIrrigationAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newEvent: IrrigationEvent = {
      date: newIrrigationDate,
      amount,
    };

    setIrrigationEvents((prev) =>
      [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date))
    );
    setNewIrrigationDate('');
    setNewIrrigationAmount('');
  };

  const removeIrrigationEvent = (index: number) => {
    setIrrigationEvents((prev) => prev.filter((_, i) => i !== index));
  };

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

      const result = runYearSimulation(weatherData, cropConfig, irrigationEvents);

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
        <label className="block text-xs text-slate-500 mb-2">{t('crop')}</label>
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
              {tCrops(crop)}
            </button>
          ))}
        </div>

        {/* Year Selector */}
        <label className="block text-xs text-slate-500 mb-2">{t('year')}</label>
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

        {/* Irrigation Events */}
        <label className="block text-xs text-slate-500 mb-2">{tIrrigation('irrigationEvents')}</label>
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={newIrrigationDate}
              onChange={(e) => setNewIrrigationDate(e.target.value)}
              min={`${selectedYear}-01-01`}
              max={`${selectedYear}-12-31`}
              className="flex-1 p-2 border border-slate-200 rounded-lg bg-white text-sm"
              disabled={status === 'loading'}
            />
            <input
              type="number"
              value={newIrrigationAmount}
              onChange={(e) => setNewIrrigationAmount(e.target.value)}
              placeholder="mm"
              min="1"
              step="1"
              className="w-20 p-2 border border-slate-200 rounded-lg bg-white text-sm text-right"
              disabled={status === 'loading'}
            />
            <button
              onClick={addIrrigationEvent}
              disabled={status === 'loading' || !newIrrigationDate || !newIrrigationAmount}
              className="px-3 py-2 bg-sky-500 text-white rounded-lg font-semibold text-sm hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {tCommon('add')}
            </button>
          </div>

          {irrigationEvents.length > 0 && (
            <div className="space-y-1.5">
              {irrigationEvents.map((event, index) => (
                <div
                  key={`${event.date}-${index}`}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-slate-700">
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sky-600 font-medium">{event.amount} mm</span>
                  <button
                    onClick={() => removeIrrigationEvent(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    disabled={status === 'loading'}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                onClick={() => setIrrigationEvents([])}
                className="w-full mt-2 py-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
                disabled={status === 'loading'}
              >
                {tCommon('clearAll')}
              </button>
            </div>
          )}

          {irrigationEvents.length === 0 && (
            <p className="text-xs text-slate-400 text-center">
              {tIrrigation('noIrrigationEvents')}
            </p>
          )}
        </div>

        <button
          onClick={runSimulation}
          disabled={status === 'loading'}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? t('running') : t('runSimulation')}
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

          {/* Charts */}

          <WaterBalanceChart data={dailyData} />

          <SoilWaterChart data={dailyData} />

          <WeatherChart data={dailyData} />

          <GDDChart data={dailyData} phaseThresholds={cropConfig.phaseThresholds} />

          <KcChart data={dailyData} />

          {/* Summary Stats */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('results', { year: selectedYear })}
              </h3>
              {elevation !== null && (
                <span className="text-xs text-slate-400">{Math.round(elevation)}m</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-900">{summary.totalGdd}°</p>
                <p className="text-xs text-slate-500">{t('totalGdd')}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-900">{summary.peakPhaseReached}</p>
                <p className="text-xs text-slate-500">{t('peakPhase')}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-900">{summary.totalPrecipitation}<span className="text-sm font-normal">mm</span></p>
                <p className="text-xs text-slate-500">{t('precipitation')}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-orange-600">{summary.totalWaterDeficit}<span className="text-sm font-normal">mm</span></p>
                <p className="text-xs text-slate-500">{t('waterDeficit')}</p>
              </div>
              {summary.totalIrrigation > 0 && (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-sky-600">{summary.totalIrrigation}<span className="text-sm font-normal">mm</span></p>
                    <p className="text-xs text-slate-500">{tIrrigation('irrigationApplied')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-emerald-600">{summary.netWaterDeficit}<span className="text-sm font-normal">mm</span></p>
                    <p className="text-xs text-slate-500">{tIrrigation('netDeficit')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table Toggle */}
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full py-3 bg-white rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            {showTable ? t('hideDataTable') : t('showDataTable')}
          </button>



          {/* Daily Data Table */}
          {showTable && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left font-semibold text-slate-600">{tTable('date')}</th>
                      <th className="p-2 text-right font-semibold text-slate-600">{tTable('gdd')}</th>
                      <th className="p-2 text-left font-semibold text-slate-600">{tTable('phase')}</th>
                      <th className="p-2 text-right font-semibold text-slate-600">{tTable('etc')}</th>
                      <th className="p-2 text-right font-semibold text-slate-600">{tTable('rain')}</th>
                      <th className="p-2 text-right font-semibold text-slate-600">{tTable('irrigation')}</th>
                      <th className="p-2 text-right font-semibold text-slate-600">{tTable('soil')}</th>
                      <th className="p-2 text-right font-semibold text-slate-600">{tTable('deficit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData
                      .filter((d) => d.gddDaily > 0 || d.waterDeficit > 0 || d.irrigationApplied > 0)
                      .map((day) => (
                        <tr key={day.date} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2 text-slate-700">{day.date}</td>
                          <td className="p-2 text-right text-slate-900">{day.gddCumulative}</td>
                          <td className="p-2 text-slate-600">{day.currentPhase}</td>
                          <td className="p-2 text-right text-slate-900">{day.etc}</td>
                          <td className="p-2 text-right text-sky-600">{day.precipitation || '-'}</td>
                          <td className="p-2 text-right text-sky-500 font-medium">
                            {day.irrigationApplied > 0 ? day.irrigationApplied : '-'}
                          </td>
                          <td className="p-2 text-right text-emerald-600">{day.soilWater}</td>
                          <td className="p-2 text-right text-orange-600">
                            {day.netWaterDeficit > 0 ? day.netWaterDeficit : '-'}
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
