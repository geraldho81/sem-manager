'use client';

import { WizardStep } from '@/types';

const steps: { key: WizardStep; label: string }[] = [
  { key: 'setup', label: 'Setup' },
  { key: 'running', label: 'Running' },
  { key: 'results', label: 'Results' },
];

export function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 ${i < currentIdx
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg'
                : i === currentIdx
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl scale-110'
                  : 'bg-white/50 text-gray-400 backdrop-blur-sm'
              }`}
          >
            {i < currentIdx ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`text-sm font-semibold transition-all duration-300 ${i === currentIdx ? 'text-gray-800 scale-105' : 'text-gray-600'
              }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-16 h-1 rounded-full mx-2 transition-all duration-500 ${i < currentIdx ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-white/30'
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
