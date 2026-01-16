/**
 * Irrigation Calculation Utilities
 * 
 * GDD (Growing Degree Days) and crop water requirement calculations
 * for the Arvier multi-crop irrigation system.
 */

import type { CropConfig, PhaseThreshold } from '@/config/crops';
import type { DailyWeatherData } from '@/services/weather';

/** Result of daily irrigation calculation */
export interface DailyCalculation {
  date: string;
  gddDaily: number;
  gddCumulative: number;
  currentPhase: string;
  kc: number;
  et0: number;
  etc: number;
  precipitation: number;
  waterDeficit: number;
}

/** Summary statistics for a simulation */
export interface SimulationSummary {
  totalGdd: number;
  totalEtc: number;
  totalPrecipitation: number;
  totalWaterDeficit: number;
  peakPhaseReached: string;
  daysWithDeficit: number;
}

/**
 * Calculate daily GDD using the averaging method
 * GDD = max(0, (Tmax + Tmin) / 2 - Tbase)
 */
export function calculateDailyGdd(
  tempMax: number,
  tempMin: number,
  baseTemp: number
): number {
  const avgTemp = (tempMax + tempMin) / 2;
  return Math.max(0, avgTemp - baseTemp);
}

/**
 * Determine the current growth phase based on cumulative GDD
 */
export function getCurrentPhase(
  cumulativeGdd: number,
  phaseThresholds: PhaseThreshold[]
): string {
  // Find the highest threshold that has been reached
  let currentPhase = 'Dormant';
  
  for (const threshold of phaseThresholds) {
    if (cumulativeGdd >= threshold.gdd) {
      currentPhase = threshold.name;
    }
  }
  
  return currentPhase;
}

/**
 * Interpolate Kc value based on cumulative GDD and growth phases
 * 
 * FAO-style Kc curve with three stages:
 * - Development (0 → midGdd): kcInitial → kcPeak
 * - Mid-season (midGdd → lateGdd): kcPeak (constant)
 * - Late season (lateGdd → endGdd): kcPeak → kcEnd
 */
export function interpolateKc(
  cumulativeGdd: number,
  cropConfig: CropConfig
): number {
  const { kcInitial, kcPeak, kcEnd, phaseThresholds } = cropConfig;
  
  if (phaseThresholds.length < 2) {
    return kcInitial;
  }
  
  // Use phase thresholds to define Kc curve segments
  // Phase 1 end = development complete, reach kcPeak
  // Phase 2 end = mid-season complete, start decline
  // Phase 3 end = season end, reach kcEnd
  const midGdd = phaseThresholds[0].gdd;      // End of development
  const lateGdd = phaseThresholds[1].gdd;     // End of mid-season
  const endGdd = phaseThresholds[phaseThresholds.length - 1].gdd; // Season end
  
  if (cumulativeGdd <= 0) {
    return kcInitial;
  }
  
  // Development stage: kcInitial → kcPeak
  if (cumulativeGdd < midGdd) {
    const progress = cumulativeGdd / midGdd;
    return kcInitial + progress * (kcPeak - kcInitial);
  }
  
  // Mid-season stage: constant kcPeak
  if (cumulativeGdd < lateGdd) {
    return kcPeak;
  }
  
  // Late season stage: kcPeak → kcEnd
  if (cumulativeGdd < endGdd) {
    const progress = (cumulativeGdd - lateGdd) / (endGdd - lateGdd);
    return kcPeak + progress * (kcEnd - kcPeak);
  }
  
  // Past end of season
  return kcEnd;
}

/**
 * Calculate crop evapotranspiration (ETc)
 * ETc = ET0 × Kc
 */
export function calculateEtc(et0: number, kc: number): number {
  return et0 * kc;
}

/**
 * Run a full year simulation for a specific crop
 */
export function runYearSimulation(
  weatherData: DailyWeatherData[],
  cropConfig: CropConfig
): { daily: DailyCalculation[]; summary: SimulationSummary } {
  const daily: DailyCalculation[] = [];
  let cumulativeGdd = 0;
  let totalEtc = 0;
  let totalPrecipitation = 0;
  let totalWaterDeficit = 0;
  let daysWithDeficit = 0;
  let peakPhaseReached = 'Dormant';

  for (const day of weatherData) {
    // Calculate daily GDD
    const gddDaily = calculateDailyGdd(
      day.tempMax,
      day.tempMin,
      cropConfig.baseTemp
    );
    cumulativeGdd += gddDaily;

    // Determine current growth phase
    const currentPhase = getCurrentPhase(
      cumulativeGdd,
      cropConfig.phaseThresholds
    );
    peakPhaseReached = currentPhase;

    // Calculate Kc for current growth stage
    const kc = interpolateKc(cumulativeGdd, cropConfig);

    // Calculate crop water requirement
    const etc = calculateEtc(day.et0, kc);

    // Calculate water deficit (ETc - precipitation)
    const waterDeficit = Math.max(0, etc - day.precipitation);

    // Accumulate totals
    totalEtc += etc;
    totalPrecipitation += day.precipitation;
    totalWaterDeficit += waterDeficit;
    if (waterDeficit > 0) {
      daysWithDeficit++;
    }

    daily.push({
      date: day.date,
      gddDaily: Math.round(gddDaily * 10) / 10,
      gddCumulative: Math.round(cumulativeGdd * 10) / 10,
      currentPhase,
      kc: Math.round(kc * 100) / 100,
      et0: day.et0,
      etc: Math.round(etc * 10) / 10,
      precipitation: day.precipitation,
      waterDeficit: Math.round(waterDeficit * 10) / 10,
    });
  }

  const summary: SimulationSummary = {
    totalGdd: Math.round(cumulativeGdd),
    totalEtc: Math.round(totalEtc),
    totalPrecipitation: Math.round(totalPrecipitation),
    totalWaterDeficit: Math.round(totalWaterDeficit),
    peakPhaseReached,
    daysWithDeficit,
  };

  return { daily, summary };
}
