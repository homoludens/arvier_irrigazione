'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CROP_SETTINGS, type CropType } from '@/config/crops';
import { runYearSimulation, type DailyCalculation } from '@/lib/calculations';
import { fetchSeasonWeather } from '@/services/weather';
import type { Coordinates } from '@/types/location';
import SoilMoistureGauge from './SoilMoistureGauge';
import IrrigationAdvice from './IrrigationAdvice';
import { GDDChart, WeatherChart, WaterBalanceChart } from './Charts';

interface CropDashboardProps {
  coordinates: Coordinates;
}

interface WaterBalanceData {
  moisturePercent: number;
  waterDeficit: number;
  kc: number;
  currentPhase: string;
  daysWithDeficit: number;
  totalPrecipitation: number;
  totalEtc: number;
  cumulativeGdd: number;
}

// Get default season start (January 1st of current year)
const getDefaultSeasonStart = () => {
  const year = new Date().getFullYear();
  return `${year}-01-01`;
};

export default function CropDashboard({ coordinates }: CropDashboardProps) {
  const t = useTranslations('dashboard');
  const tCrops = useTranslations('crops');
  const tCommon = useTranslations('common');
  const [selectedCrop, setSelectedCrop] = useState<CropType>('Apple');
  const [seasonStart, setSeasonStart] = useState<string>(getDefaultSeasonStart());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [waterBalance, setWaterBalance] = useState<WaterBalanceData | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalculation[] | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [weatherCache, setWeatherCache] = useState<Awaited<ReturnType<typeof fetchSeasonWeather>> | null>(null);

  const cropNames = Object.keys(CROP_SETTINGS) as CropType[];

  const fetchWeatherData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const result = await fetchSeasonWeather(coordinates, seasonStart);
      setWeatherCache(result);
      setElevation(result.elevation);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setStatus('error');
    }
  }, [coordinates, seasonStart]);

  const calculateWaterBalance = useCallback((cropType: CropType) => {
    if (!weatherCache) return;

    const cropConfig = CROP_SETTINGS[cropType];
    const { daily, summary } = runYearSimulation(weatherCache.data, cropConfig);

    const recentDays = daily.slice(-14);
    const latestDay = daily[daily.length - 1];

    if (!latestDay) return;

    const soilCapacity = 100;
    const recentDeficit = recentDays.reduce((sum, d) => sum + d.waterDeficit, 0);
    const recentPrecipitation = recentDays.reduce((sum, d) => sum + d.precipitation, 0);
    const netChange = recentPrecipitation - recentDeficit;
    const moisturePercent = Math.max(0, Math.min(100, 70 + (netChange / soilCapacity) * 100));

    setWaterBalance({
      moisturePercent,
      waterDeficit: summary.totalWaterDeficit,
      kc: latestDay.kc,
      currentPhase: latestDay.currentPhase,
      daysWithDeficit: summary.daysWithDeficit,
      totalPrecipitation: summary.totalPrecipitation,
      totalEtc: summary.totalEtc,
      cumulativeGdd: latestDay.gddCumulative,
    });

    setDailyData(daily);
  }, [weatherCache]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    if (weatherCache) {
      calculateWaterBalance(selectedCrop);
    }
  }, [selectedCrop, weatherCache, calculateWaterBalance]);

  const isLoading = status === 'loading';
  const cropConfig = CROP_SETTINGS[selectedCrop];

  return (
    <div className="space-y-4">
      {/* Crop Selector & Season Start */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {t('selectCrop')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {cropNames.map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all ${
                selectedCrop === crop
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              {tCrops(crop)}
            </button>
          ))}
        </div>



        {elevation !== null && (
          <p className="text-center text-xs text-slate-400 mt-3">
            {Math.round(elevation)}m elevation
          </p>
        )}
      </div>

      {/* Error state */}
      {status === 'error' && (
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-red-700 text-sm mb-2">{error}</p>
          <button
            onClick={fetchWeatherData}
            className="text-sm text-red-600 font-medium underline"
          >
            {tCommon('tryAgain')}
          </button>
        </div>
      )}


      {/* Charts Toggle */}
      {status === 'success' && dailyData && (
        <>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <span>{t('thisSeason')}</span>


            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showCharts ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCharts && (
            <div className="space-y-4">


              {/* Season Start Date */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t('seasonStart')}
                </label>
                <input
                  type="date"
                  value={seasonStart}
                  onChange={(e) => setSeasonStart(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm"
                />
              </div>

              {/* Moisture + Advice */}
              <SoilMoistureGauge
                moisturePercent={waterBalance?.moisturePercent ?? 50}
                currentPhase={waterBalance?.currentPhase ?? '—'}
                isLoading={isLoading}
              />

              <IrrigationAdvice
                waterDeficit={waterBalance?.waterDeficit ?? 0}
                kc={waterBalance?.kc ?? 0.5}
                currentPhase={waterBalance?.currentPhase ?? '—'}
                daysWithDeficit={waterBalance?.daysWithDeficit ?? 0}
                isLoading={isLoading}
              />

              {/* Quick Stats */}
              {waterBalance && status === 'success' && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {t('thisSeason')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {Math.round(waterBalance.cumulativeGdd)}
                      </p>
                      <p className="text-xs text-slate-500">{t('growingDegreeDays')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {waterBalance.totalPrecipitation}<span className="text-base font-normal text-slate-400">mm</span>
                      </p>
                      <p className="text-xs text-slate-500">{t('rainfall')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {waterBalance.totalEtc}<span className="text-base font-normal text-slate-400">mm</span>
                      </p>
                      <p className="text-xs text-slate-500">{t('waterUsed')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {waterBalance.daysWithDeficit}
                      </p>
                      <p className="text-xs text-slate-500">{t('daysInDeficit')}</p>
                    </div>
                  </div>
                </div>
              )}


              <GDDChart data={dailyData} height={180} phaseThresholds={cropConfig.phaseThresholds} />
              <WeatherChart data={dailyData} height={180} />
              <WaterBalanceChart data={dailyData} height={180} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
