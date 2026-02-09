'use client';

import { StepIndicator } from '@/components/wizard/StepIndicator';
import { SetupStep } from '@/components/wizard/SetupStep';
import { RunningStep } from '@/components/wizard/RunningStep';
import { ResultsStep } from '@/components/wizard/ResultsStep';
import { usePipeline } from '@/hooks/usePipeline';

export default function Home() {
  const {
    step,
    projectId,
    agentUpdates,
    connected,
    error,
    results,
    startPipeline,
    cancelPipeline,
    restart,
  } = usePipeline();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEM Manager</h1>
          <p className="text-gray-500 mt-1">
            AI-powered search engine marketing analysis and ad generation
          </p>
        </div>

        <StepIndicator current={step} />

        {step === 'setup' && (
          <SetupStep onStart={startPipeline} error={error} />
        )}

        {step === 'running' && (
          <RunningStep
            agentUpdates={agentUpdates}
            connected={connected}
            onCancel={cancelPipeline}
          />
        )}

        {step === 'results' && results && projectId && (
          <ResultsStep
            results={results}
            projectId={projectId}
            onRestart={restart}
          />
        )}
      </div>
    </main>
  );
}
