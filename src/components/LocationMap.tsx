'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Coordinates } from '@/types/location';

// Fix Leaflet default marker icon issue in Next.js
import 'leaflet/dist/leaflet.css';

export type MapLayerType = 'satellite' | 'streets';

interface LocationMapProps {
  coordinates: Coordinates;
  onLocationSelect: (coords: Coordinates) => void;
  layerType?: MapLayerType;
}

export default function LocationMap({
  coordinates,
  onLocationSelect,
  layerType = 'satellite',
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix default icon paths for Leaflet in bundled environments
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Initialize map centered on coordinates
    const map = L.map(mapRef.current).setView(
      [coordinates.latitude, coordinates.longitude],
      15
    );

    // Add initial tile layer based on layerType
    const tileLayer = layerType === 'satellite'
      ? L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19,
          }
        )
      : L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }
        );
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Add labels overlay for satellite view
    if (layerType === 'satellite') {
      const labelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      );
      labelsLayer.addTo(map);
      labelsLayerRef.current = labelsLayer;
    }

    // Create draggable marker
    const marker = L.marker([coordinates.latitude, coordinates.longitude], {
      draggable: true,
    }).addTo(map);

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationSelect({
        latitude: pos.lat,
        longitude: pos.lng,
      });
    });

    // Handle map click to move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationSelect({
        latitude: lat,
        longitude: lng,
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        currentPos.lat !== coordinates.latitude ||
        currentPos.lng !== coordinates.longitude
      ) {
        markerRef.current.setLatLng([coordinates.latitude, coordinates.longitude]);
        mapInstanceRef.current.panTo([coordinates.latitude, coordinates.longitude]);
      }
    }
  }, [coordinates]);

  // Update tile layer when layerType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing layers
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    // Add new tile layer
    const newTileLayer = layerType === 'satellite'
      ? L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19,
          }
        )
      : L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }
        );
    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;

    // Add labels for satellite view
    if (layerType === 'satellite') {
      const labelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      );
      labelsLayer.addTo(map);
      labelsLayerRef.current = labelsLayer;
    }

    // Ensure marker stays on top
    if (markerRef.current) {
      markerRef.current.setZIndexOffset(1000);
    }
  }, [layerType]);

  return (
    <div
      ref={mapRef}
      className="h-64 w-full rounded-lg border border-gray-300 z-0"
      style={{ minHeight: '256px' }}
    />
  );
}
