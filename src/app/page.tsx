'use client';

import { useState } from 'react';
import LocationPicker from '@/components/LocationPicker';
import SimulationPanel from '@/components/SimulationPanel';
import type { Coordinates } from '@/types/location';

export default function Home() {
  const [location, setLocation] = useState<Coordinates | null>(null);

  return (
    <main className="max-w-md mx-auto p-4 space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Arvier Irrigation</h1>
        <p className="text-sm text-gray-600">Aosta Valley, Italy</p>
      </header>

      {/* Location Picker */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Field Location
        </label>
        <LocationPicker onLocationSelect={setLocation} />
      </section>

      {/* Simulation Panel - shows when location is set */}
      {location && (
        <section className="border-t pt-4">
          <SimulationPanel coordinates={location} />
        </section>
      )}
    </main>
  );
}
