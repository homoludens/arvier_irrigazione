'use client';

import { useState } from 'react';
import Image from 'next/image';
import LocationPicker from '@/components/LocationPicker';
import CropDashboard from '@/components/CropDashboard';
import SimulationPanel from '@/components/SimulationPanel';
import type { Coordinates } from '@/types/location';

export default function Home() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-emerald-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Image
            src="/arvier_small_logo.png"
            alt="Arvier"
            width={300}
            height={200}
            className="rounded-lg"
          />
          {/*<div>
            <h1 className="text-xl font-bold tracking-tight">Arvier Irrigation</h1>
            <p className="text-emerald-200 text-xs">Aosta Valley, Italy</p>
          </div>*/}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Location Section */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Your Field
          </h2>
          <LocationPicker onLocationSelect={setLocation} />
        </section>

        {/* Dashboard - shows when location is set */}
        {location && (
          <CropDashboard coordinates={location} />
        )}

        {/* Historical Toggle */}
        {location && (
          <section>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <span>Historical Analysis</span>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div className="mt-3">
                <SimulationPanel coordinates={location} />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
