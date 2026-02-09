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
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              i < currentIdx
                ? 'bg-green-500 text-white'
                : i === currentIdx
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i < currentIdx ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`text-sm font-medium ${
              i === currentIdx ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 ${
                i < currentIdx ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
