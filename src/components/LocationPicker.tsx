'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Coordinates, GpsStatus } from '@/types/location';
import { ARVIER_DEFAULT } from '@/types/location';

// Dynamically import the map to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

interface LocationPickerProps {
  onLocationSelect: (coords: Coordinates) => void;
  initialCoords?: Coordinates;
}

export default function LocationPicker({
  onLocationSelect,
  initialCoords,
}: LocationPickerProps) {
  const [coordinates, setCoordinates] = useState<Coordinates>(
    initialCoords ?? ARVIER_DEFAULT
  );
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [showMap, setShowMap] = useState(false);

  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setShowMap(true);
      return;
    }

    setGpsStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(newCoords);
        setGpsStatus('success');
        onLocationSelect(newCoords);
      },
      (error) => {
        console.warn('GPS error:', error.message);
        setGpsStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setShowMap(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [onLocationSelect]);

  // Request GPS on mount
  useEffect(() => {
    if (!initialCoords) {
      requestGpsLocation();
    }
  }, [initialCoords, requestGpsLocation]);

  const handleMapSelect = useCallback(
    (coords: Coordinates) => {
      setCoordinates(coords);
      onLocationSelect(coords);
    },
    [onLocationSelect]
  );

  const getStatusMessage = (): string => {
    switch (gpsStatus) {
      case 'requesting':
        return 'Requesting GPS location...';
      case 'success':
        return 'GPS location acquired';
      case 'denied':
        return 'GPS permission denied. Please select your field on the map.';
      case 'unavailable':
        return 'GPS unavailable. Please select your field on the map.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* GPS Status */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{getStatusMessage()}</div>
        {gpsStatus !== 'requesting' && (
          <button
            onClick={requestGpsLocation}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Retry GPS
          </button>
        )}
      </div>

      {/* Current Coordinates Display */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Selected Location
        </div>
        <div className="font-mono text-sm">
          {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
        </div>
      </div>

      {/* Map Toggle */}
      {!showMap && gpsStatus === 'success' && (
        <button
          onClick={() => setShowMap(true)}
          className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Fine-tune location on map
        </button>
      )}

      {/* Leaflet Map */}
      {showMap && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Click or drag the marker to select your field location
          </div>
          <LocationMap
            coordinates={coordinates}
            onLocationSelect={handleMapSelect}
          />
        </div>
      )}
    </div>
  );
}
