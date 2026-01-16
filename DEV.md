# Arvier Irrigation - Development Guide

## Project Overview

A mobile-first web app for farmers in Arvier, Aosta Valley. It manages irrigation for diverse alpine crops (Apples, Vineyards, and Grass/Pasture) using GPS-based weather data from Open-Meteo.

See `Arvier_MultiCrop_Irrigation.md` for full project blueprint.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Maps:** Leaflet.js
- **Deployment:** Vercel (free tier compatible)

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind v4 import
│   ├── layout.tsx           # Root layout with metadata/viewport
│   └── page.tsx             # Home page with location picker & simulation
├── components/
│   ├── LocationPicker.tsx   # GPS + map fallback component
│   ├── LocationMap.tsx      # Leaflet map (dynamically imported, no SSR)
│   └── SimulationPanel.tsx  # Historical simulation UI with crop/year selection
├── config/
│   └── crops.ts             # CROP_SETTINGS constant with crop parameters
├── lib/
│   └── calculations.ts      # GDD, Kc interpolation, ETc calculations
├── services/
│   └── weather.ts           # Open-Meteo historical weather API client
└── types/
    └── location.ts          # Coordinates interface and GPS types
```

## What Has Been Implemented

### Phase 1: Multi-Crop Configuration
- `src/config/crops.ts` - `CROP_SETTINGS` constant with:
  - Apple (baseTemp: 4.5°C, Kc: 0.40-1.00, phases: Bloom@350 GDD, Expansion@800 GDD)
  - Vineyard (baseTemp: 10.0°C, Kc: 0.30-0.70, phases: Budburst@200 GDD, Harvest@1200 GDD)
  - Pasture (baseTemp: 5.0°C, Kc: 0.70-1.05, phases: Growth@0 GDD)
- TypeScript interfaces: `CropConfig`, `PhaseThreshold`, `CropType`
- Extensible design with documentation for adding new crops

### Phase 2: Location & GPS Services
- `src/components/LocationPicker.tsx` - Main location component:
  - Auto-requests GPS on mount via `navigator.geolocation`
  - Handles all states: idle, requesting, success, denied, unavailable
  - Falls back to map automatically on GPS failure
  - "Fine-tune location on map" option after GPS success
- `src/components/LocationMap.tsx` - Leaflet map:
  - Dynamically imported (SSR disabled) to avoid window errors
  - Esri satellite imagery layer (good for identifying fields)
  - Draggable marker + click-to-place functionality
  - Default centered on Arvier (45.7069, 7.0792)
- `src/types/location.ts` - Types and defaults:
  - `Coordinates` interface (latitude, longitude)
  - `GpsStatus` type
  - `ARVIER_DEFAULT` coordinates

### Phase 3: Historical Simulation Engine
- `src/services/weather.ts` - Open-Meteo API client:
  - `fetchHistoricalWeather(coords, year)` - Fetches full year of daily weather data
  - Returns: tempMax, tempMin, tempMean, precipitation, ET0 (reference evapotranspiration)
  - `getAvailableYears()` - Returns last 10 years for simulation
  - Uses Open-Meteo Historical Weather API (free, no auth required)

- `src/lib/calculations.ts` - Irrigation calculation engine:
  - `calculateDailyGdd(tempMax, tempMin, baseTemp)` - GDD using averaging method
  - `getCurrentPhase(cumulativeGdd, phaseThresholds)` - Determines growth phase
  - `interpolateKc(cumulativeGdd, cropConfig)` - Linear Kc interpolation between initial and peak
  - `calculateEtc(et0, kc)` - Crop evapotranspiration (ETc = ET0 × Kc)
  - `runYearSimulation(weatherData, cropConfig)` - Full 365-day simulation
  - Returns daily calculations + summary (totalGdd, totalEtc, waterDeficit, etc.)

- `src/components/SimulationPanel.tsx` - Simulation UI:
  - Year selector (last 10 years)
  - Crop selector (automatically uses crop-specific baseTemp and Kc values)
  - Displays crop parameters before running
  - Shows simulation results: Total GDD, peak phase, ETc, precipitation, water deficit
  - Expandable daily data table with phase transitions

**Key Logic:** When user selects a crop (e.g., Vineyard), the simulation automatically uses:
- Vineyard's `baseTemp` (10°C) for GDD calculation
- Vineyard's `kcInitial` (0.30) and `kcPeak` (0.70) for ETc calculation
- Vineyard's `phaseThresholds` for growth phase determination

## Running Locally

### Prerequisites
- Node.js 18+ 
- npm

### Development Server

```bash
# Install dependencies
npm install

# Start dev server (hot reload enabled)
npm run dev
```

App runs at `http://localhost:3000`

### Production Build (Local Test)

```bash
# Build for production
npm run build

# Run production server
npm run start
```

### Linting

```bash
npm run lint
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration (Recommended)

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Import Project" → Select your GitHub repo
4. Vercel auto-detects Next.js settings
5. Click "Deploy"

Every push to `main` branch will auto-deploy.

### Environment Variables

None required yet. Future phases may need:
- Open-Meteo API doesn't require keys (free, no auth)

## Next Steps (Not Yet Implemented)

Refer to `Arvier_MultiCrop_Irrigation.md` for full requirements:

- [ ] Pre-Rain Recharge logic (protect valley soil before rainfall events)
- [ ] 10-year comparison view (compare same crop across multiple years)
- [ ] Real-time/forecast mode (current season irrigation recommendations)
- [ ] Irrigation recommendations UI with scheduling
- [ ] Data export functionality

## Notes for Future Development

- Leaflet CSS is loaded from CDN via the component (see `LocationMap.tsx`)
- Leaflet marker icons use unpkg CDN to avoid bundling issues
- All components use `'use client'` directive for client-side interactivity
- Tailwind v4 uses `@import "tailwindcss"` syntax (not `@tailwind` directives)
