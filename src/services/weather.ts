/**
 * Open-Meteo Weather API Service
 * 
 * Fetches historical weather data for irrigation calculations.
 * API docs: https://open-meteo.com/en/docs/historical-weather-api
 */

import type { Coordinates } from '@/types/location';

/**
 * Fetches the grid elevation for given coordinates from Open-Meteo
 * This is the elevation of the weather data grid point, not the actual terrain
 */
export async function fetchGridElevation(
  latitude: number,
  longitude: number
): Promise<number> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    daily: 'temperature_2m_max',
    start_date: '2024-01-01',
    end_date: '2024-01-01',
    timezone: 'Europe/Rome',
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const json = await response.json();
  return json.elevation;
}

/** Daily weather data from Open-Meteo */
export interface DailyWeatherData {
  date: string;
  tempMax: number;
  tempMin: number;
  tempMean: number;
  precipitation: number;
  et0: number; // Reference evapotranspiration
}

/** Response structure from Open-Meteo historical API */
interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    et0_fao_evapotranspiration: number[];
  };
  elevation: number;
}

/**
 * Fetches historical weather data for a full year from Open-Meteo
 */
export async function fetchHistoricalWeather(
  coords: Coordinates,
  year: number
): Promise<{ data: DailyWeatherData[]; elevation: number }> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'et0_fao_evapotranspiration',
    ].join(','),
    timezone: 'Europe/Rome',
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const json: OpenMeteoResponse = await response.json();

  const data: DailyWeatherData[] = json.daily.time.map((date, i) => ({
    date,
    tempMax: json.daily.temperature_2m_max[i],
    tempMin: json.daily.temperature_2m_min[i],
    tempMean: json.daily.temperature_2m_mean[i],
    precipitation: json.daily.precipitation_sum[i] ?? 0,
    et0: json.daily.et0_fao_evapotranspiration[i] ?? 0,
  }));

  return { data, elevation: json.elevation };
}

/**
 * Get available years for historical simulation
 * Open-Meteo historical data is available from 1940 to ~2 days ago
 */
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  // Last 10 years for practical use
  for (let year = currentYear - 1; year >= currentYear - 10; year--) {
    years.push(year);
  }
  return years;
}

/**
 * Fetches recent weather data (last N days) for real-time calculations
 * Uses a combination of historical archive and forecast API for most recent data
 */
export async function fetchRecentWeather(
  coords: Coordinates,
  days: number = 30
): Promise<{ data: DailyWeatherData[]; elevation: number }> {
  const endDate = new Date();
  // Go back 2 days to ensure archive data is available
  endDate.setDate(endDate.getDate() - 2);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'et0_fao_evapotranspiration',
    ].join(','),
    timezone: 'Europe/Rome',
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const json: OpenMeteoResponse = await response.json();

  const data: DailyWeatherData[] = json.daily.time.map((date, i) => ({
    date,
    tempMax: json.daily.temperature_2m_max[i],
    tempMin: json.daily.temperature_2m_min[i],
    tempMean: json.daily.temperature_2m_mean[i],
    precipitation: json.daily.precipitation_sum[i] ?? 0,
    et0: json.daily.et0_fao_evapotranspiration[i] ?? 0,
  }));

  return { data, elevation: json.elevation };
}

/**
 * Fetches current year weather data from season start to recent
 * Used for calculating cumulative GDD and current water balance
 * @param coords - Location coordinates
 * @param seasonStartDate - Optional season start date string (YYYY-MM-DD), defaults to Jan 1 of current year
 */
export async function fetchSeasonWeather(
  coords: Coordinates,
  seasonStartDate?: string
): Promise<{ data: DailyWeatherData[]; elevation: number }> {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Season start: use provided date or default to January 1st of current year
  let seasonStart: Date;
  if (seasonStartDate) {
    seasonStart = new Date(seasonStartDate + 'T00:00:00');
  } else {
    seasonStart = new Date(currentYear, 0, 1); // January 1
  }
  
  // End date is 2 days ago (archive data availability)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2);
  
  // If season start is in the future, use previous year
  if (seasonStart > now) {
    seasonStart.setFullYear(seasonStart.getFullYear() - 1);
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    start_date: formatDate(seasonStart),
    end_date: formatDate(endDate),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'et0_fao_evapotranspiration',
    ].join(','),
    timezone: 'Europe/Rome',
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const json: OpenMeteoResponse = await response.json();

  const data: DailyWeatherData[] = json.daily.time.map((date, i) => ({
    date,
    tempMax: json.daily.temperature_2m_max[i],
    tempMin: json.daily.temperature_2m_min[i],
    tempMean: json.daily.temperature_2m_mean[i],
    precipitation: json.daily.precipitation_sum[i] ?? 0,
    et0: json.daily.et0_fao_evapotranspiration[i] ?? 0,
  }));

  return { data, elevation: json.elevation };
}
