'use client';

import { useState } from 'react';
import Image from 'next/image';
import LocationPicker from '@/components/LocationPicker';
import CropDashboard from '@/components/CropDashboard';
import SimulationPanel from '@/components/SimulationPanel';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Coordinates } from '@/types/location';
import type { MapLayerType } from '@/components/LocationMap';
import { useTranslations } from 'next-intl';

export default function Home() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mapLayerType, setMapLayerType] = useState<MapLayerType>('satellite');
  const t = useTranslations();
  const tSettings = useTranslations('settings');

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-emerald-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Image
            src="/arvier_small_logo.png"
            alt="Arvier"
            width={300}
            height={200}
            className="rounded-lg"
          />
          {/* Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-emerald-600 transition-colors"
              aria-label={tSettings('settings')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                {/* Map Layer Toggle */}
                <div className="px-4 py-2">
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                    {tSettings('mapLayer')}
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200">
                    <button
                      onClick={() => setMapLayerType('satellite')}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        mapLayerType === 'satellite'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tSettings('satellite')}
                    </button>
                    <button
                      onClick={() => setMapLayerType('streets')}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        mapLayerType === 'streets'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tSettings('streets')}
                    </button>
                  </div>
                </div>
                {/* Language Switcher */}
                <div className="px-4 py-2 border-t border-slate-100">
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                    {t('common.language')}
                  </label>
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Location Section */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {t('location.yourField')}
          </h2>
          <LocationPicker onLocationSelect={setLocation} mapLayerType={mapLayerType} />
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
              <span>{t('dashboard.historicalAnalysis')}</span>
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
