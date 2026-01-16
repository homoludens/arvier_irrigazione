/** Geographic coordinates for a field location */
export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Target elevation in meters (for lapse rate correction) */
  elevation?: number;
}

/** Status of GPS location acquisition */
export type GpsStatus = 'idle' | 'requesting' | 'success' | 'denied' | 'unavailable';

/** Default coordinates for Arvier, Aosta Valley */
export const ARVIER_DEFAULT: Coordinates = {
  latitude: 45.7069,
  longitude: 7.0792,
  elevation: 800, // Arvier valley floor ~800m
};
