/** Geographic coordinates for a field location */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Status of GPS location acquisition */
export type GpsStatus = 'idle' | 'requesting' | 'success' | 'denied' | 'unavailable';

/** Default coordinates for Arvier, Aosta Valley */
export const ARVIER_DEFAULT: Coordinates = {
  latitude: 45.704411,
  longitude: 7.177059,
};
