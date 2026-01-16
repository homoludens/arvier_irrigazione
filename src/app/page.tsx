'use client';

import { useState } from 'react';
import LocationPicker from '@/components/LocationPicker';
import CropDashboard from '@/components/CropDashboard';
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

      {/* Crop Dashboard - shows when location is set */}
      {location && (
        <section className="border-t pt-4">
          <CropDashboard coordinates={location} />
        </section>
      )}

      {/* Historical Simulation Panel - collapsible */}
      {location && (
        <section className="border-t pt-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
              <svg 
                className="w-4 h-4 transition-transform group-open:rotate-90" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Historical Simulation
            </summary>
            <div className="mt-4">
              <SimulationPanel coordinates={location} />
            </div>
          </details>
        </section>
      )}
    </main>
  );
}
