/**
 * Irrigation Calculation Utilities
 * 
 * GDD (Growing Degree Days) and crop water requirement calculations
 * for the Arvier multi-crop irrigation system.
 */

import type { CropConfig, PhaseThreshold } from '@/config/crops';
import type { DailyWeatherData } from '@/services/weather';

/** Irrigation event applied by the user */
export interface IrrigationEvent {
  date: string;   // YYYY-MM-DD format
  amount: number; // mm
}

/** Result of daily irrigation calculation */
export interface DailyCalculation {
  date: string;
  gddDaily: number;
  gddCumulative: number;
  gddCycle: number;         // GDD within current growth cycle (resets for Pasture)
  currentPhase: string;
  kc: number;
  et0: number;
  etc: number;
  precipitation: number;
  waterDeficit: number;
  irrigationApplied: number;
  soilWater: number;        // Available water in soil (mm)
  netWaterDeficit: number;  // Deficit considering soil water balance
}

/** Summary statistics for a simulation */
export interface SimulationSummary {
  totalGdd: number;
  totalEtc: number;
  totalPrecipitation: number;
  totalWaterDeficit: number;
  totalIrrigation: number;
  netWaterDeficit: number;
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
 * 
 * Uses a soil water balance approach:
 * - soilWater tracks available water in the root zone
 * - Water is added by precipitation and irrigation
 * - Water is removed by crop evapotranspiration (ETc)
 * - soilWater is capped at field capacity (soilWaterMax)
 * - When soilWater < ETc demand, a deficit occurs
 * 
 * For Pasture: GDD resets every 800 GDD (harvest cycle), allowing
 * multiple growth cycles per year with Kc resetting to kcInitial.
 */
export function runYearSimulation(
  weatherData: DailyWeatherData[],
  cropConfig: CropConfig,
  irrigationEvents: IrrigationEvent[] = [],
  isPasture: boolean = false
): { daily: DailyCalculation[]; summary: SimulationSummary } {
  const daily: DailyCalculation[] = [];
  let cumulativeGdd = 0;
  let cycleGdd = 0;  // GDD within current growth cycle (for Pasture)
  let totalEtc = 0;
  let totalPrecipitation = 0;
  let totalWaterDeficit = 0;
  let totalIrrigation = 0;
  let totalNetWaterDeficit = 0;
  let daysWithDeficit = 0;
  let peakPhaseReached = 'Dormant';
  
  // Pasture harvest cycle threshold
  const pastureHarvestGdd = 800;

  // Soil water balance parameters (mm)
  const soilWaterMax = 100;  // Field capacity - max water soil can hold
  let soilWater = soilWaterMax * 0.7;  // Start at 70% of field capacity

  // Create a map of irrigation events by date for O(1) lookup
  const irrigationMap = new Map<string, number>();
  for (const event of irrigationEvents) {
    const existing = irrigationMap.get(event.date) || 0;
    irrigationMap.set(event.date, existing + event.amount);
  }

  for (const day of weatherData) {
    // Calculate daily GDD
    const gddDaily = calculateDailyGdd(
      day.tempMax,
      day.tempMin,
      cropConfig.baseTemp
    );
    cumulativeGdd += gddDaily;
    cycleGdd += gddDaily;
    
    // For Pasture: reset cycle GDD when harvest threshold is reached
    if (isPasture && cycleGdd >= pastureHarvestGdd) {
      cycleGdd = cycleGdd - pastureHarvestGdd;  // Carry over excess GDD to next cycle
    }
    
    // Use cycle GDD for Pasture (resets each harvest), cumulative for other crops
    const gddForPhaseAndKc = isPasture ? cycleGdd : cumulativeGdd;

    // Determine current growth phase (use cycle GDD for Pasture)
    const currentPhase = getCurrentPhase(
      gddForPhaseAndKc,
      cropConfig.phaseThresholds
    );
    peakPhaseReached = currentPhase;

    // Calculate Kc for current growth stage (use cycle GDD for Pasture)
    const kc = interpolateKc(gddForPhaseAndKc, cropConfig);

    // Calculate crop water requirement
    const etc = calculateEtc(day.et0, kc);

    // Calculate theoretical water deficit (ETc - precipitation only)
    const waterDeficit = Math.max(0, etc - day.precipitation);

    // Get irrigation applied on this day
    const irrigationApplied = irrigationMap.get(day.date) || 0;

    // Update soil water balance:
    // 1. Add precipitation and irrigation
    soilWater += day.precipitation + irrigationApplied;
    // 2. Cap at field capacity (excess runs off)
    soilWater = Math.min(soilWater, soilWaterMax);
    // 3. Remove ETc (crop water use)
    soilWater -= etc;
    
    // Calculate net water deficit based on soil water balance
    // If soilWater goes negative, that's the deficit
    let netWaterDeficit = 0;
    if (soilWater < 0) {
      netWaterDeficit = -soilWater;
      soilWater = 0;  // Soil can't go below 0
    }

    // Accumulate totals
    totalEtc += etc;
    totalPrecipitation += day.precipitation;
    totalWaterDeficit += waterDeficit;
    totalIrrigation += irrigationApplied;
    totalNetWaterDeficit += netWaterDeficit;
    if (netWaterDeficit > 0) {
      daysWithDeficit++;
    }

    daily.push({
      date: day.date,
      gddDaily: Math.round(gddDaily * 10) / 10,
      gddCumulative: Math.round(cumulativeGdd * 10) / 10,
      gddCycle: Math.round(cycleGdd * 10) / 10,
      currentPhase,
      kc: Math.round(kc * 100) / 100,
      et0: day.et0,
      etc: Math.round(etc * 10) / 10,
      precipitation: day.precipitation,
      waterDeficit: Math.round(waterDeficit * 10) / 10,
      irrigationApplied: Math.round(irrigationApplied * 10) / 10,
      soilWater: Math.round(soilWater * 10) / 10,
      netWaterDeficit: Math.round(netWaterDeficit * 10) / 10,
    });
  }

  const summary: SimulationSummary = {
    totalGdd: Math.round(cumulativeGdd),
    totalEtc: Math.round(totalEtc),
    totalPrecipitation: Math.round(totalPrecipitation),
    totalWaterDeficit: Math.round(totalWaterDeficit),
    totalIrrigation: Math.round(totalIrrigation),
    netWaterDeficit: Math.round(totalNetWaterDeficit),
    peakPhaseReached,
    daysWithDeficit,
  };

  return { daily, summary };
}
