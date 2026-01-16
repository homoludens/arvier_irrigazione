/**
 * Crop Configuration for Arvier Multi-Crop Irrigation System
 *
 * This module defines crop-specific parameters for GDD (Growing Degree Days)
 * calculations and crop coefficient (Kc) values used in evapotranspiration modeling.
 */

/** Growth phase threshold based on accumulated GDD */
export interface PhaseThreshold {
  /** Name of the growth phase */
  name: string;
  /** GDD value at which this phase begins */
  gdd: number;
}

/** Configuration for a single crop type */
export interface CropConfig {
  /** Base temperature (°C) below which no GDD accumulates */
  baseTemp: number;
  /** Crop coefficient at season start (initial/dormant phase) */
  kcInitial: number;
  /** Crop coefficient at peak growth/water demand */
  kcPeak: number;
   /** Crop coefficient at end season */
  kcEnd: number;
  /** Growth phase thresholds ordered by GDD */
  phaseThresholds: PhaseThreshold[];
}

/** Union type of all supported crop names */
export type CropType = keyof typeof CROP_SETTINGS;

/**
 * CROP_SETTINGS
 *
 * Central configuration for all supported crops in the Arvier irrigation system.
 * Values are calibrated for alpine conditions in Aosta Valley.
 *
 * To add a new crop (e.g., 'Potatoes'):
 * ```ts
 * Potatoes: {
 *   baseTemp: 7.0,
 *   kcInitial: 0.50,
 *   kcPeak: 1.15,
 *   phaseThresholds: [
 *     { name: 'Emergence', gdd: 150 },
 *     { name: 'Tuber Initiation', gdd: 450 },
 *     { name: 'Maturity', gdd: 1200 },
 *   ],
 * },
 * ```
 */
export const CROP_SETTINGS = {
  Apple: {
    baseTemp: 4.5,
    kcInitial: 0.40,
    kcPeak: 1.00,
    kcEnd: 0.70,
    phaseThresholds: [
      { name: 'Bloom', gdd: 350 },
      { name: 'Expansion', gdd: 800 },
      { name: 'Maturiry', gdd: 2500 },
    ],
  },

  Vineyard: {
    baseTemp: 10.0,
    kcInitial: 0.30,
    kcPeak: 0.70,
    kcEnd: 0.45,
    phaseThresholds: [
      { name: 'Budburst', gdd: 200 },
      { name: 'Flowering', gdd: 500 },
      { name: 'Harvest', gdd: 1300 },
    ],
  },

  Pasture: {
    baseTemp: 0.0,
    kcInitial: 0.50,
    kcPeak: 1.05,
    kcEnd: 0.8,
    phaseThresholds: [
      { name: 'Initial', gdd: 200 },
      { name: 'Growth', gdd: 500 },
      { name: 'Harverst', gdd: 800 },
    ],
  },
} as const satisfies Record<string, CropConfig>;
