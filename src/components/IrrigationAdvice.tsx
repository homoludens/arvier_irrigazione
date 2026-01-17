'use client';

import { useTranslations } from 'next-intl';

interface IrrigationAdviceProps {
  waterDeficit: number;
  kc: number;
  currentPhase: string;
  daysWithDeficit: number;
  isLoading?: boolean;
}

type Urgency = 'ok' | 'watch' | 'soon' | 'now';

interface Advice {
  urgency: Urgency;
  title: string;
  subtitle: string;
  bg: string;
  accent: string;
  icon: string;
}

export default function IrrigationAdvice({
  waterDeficit,
  kc,
  currentPhase,
  daysWithDeficit,
  isLoading = false,
}: IrrigationAdviceProps) {
  const t = useTranslations('irrigation');
  
  const getAdvice = (): Advice => {
    // Critical: High deficit during peak growth
    if (waterDeficit > 30 && kc >= 0.7) {
      return {
        urgency: 'now',
        title: t('irrigateNow'),
        subtitle: t('irrigateNowSubtitle', { deficit: Math.round(waterDeficit), phase: currentPhase }),
        bg: 'bg-red-500',
        accent: 'bg-red-600',
        icon: '!',
      };
    }
    
    // High priority
    if (waterDeficit > 20 || (waterDeficit > 10 && kc >= 0.6)) {
      return {
        urgency: 'soon',
        title: t('irrigateSoon'),
        subtitle: t('irrigateSoonSubtitle', { deficit: Math.round(waterDeficit) }),
        bg: 'bg-amber-500',
        accent: 'bg-amber-600',
        icon: '!',
      };
    }
    
    // Monitor
    if (waterDeficit > 10 || daysWithDeficit > 5) {
      return {
        urgency: 'watch',
        title: t('monitor'),
        subtitle: t('monitorSubtitle', { deficit: Math.round(waterDeficit), days: daysWithDeficit }),
        bg: 'bg-sky-500',
        accent: 'bg-sky-600',
        icon: '?',
      };
    }
    
    // All good
    return {
      urgency: 'ok',
      title: t('noActionNeeded'),
      subtitle: t('moistureAdequate'),
      bg: 'bg-emerald-500',
      accent: 'bg-emerald-600',
      icon: '✓',
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const advice = getAdvice();

  return (
    <div className={`${advice.bg} rounded-2xl p-4 shadow-sm text-white`}>
      <div className="flex items-center gap-3">
        {/* Icon circle */}
        <div className={`w-12 h-12 ${advice.accent} rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0`}>
          {advice.icon}
        </div>
        
        {/* Text */}
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">
            {advice.title}
          </h3>
          <p className="text-sm opacity-90 leading-snug">
            {advice.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
