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
    <main className="min-h-screen animated-gradient-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Premium Header with Logo */}
        <div className="text-center mb-12 fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/Logo.webp" 
              alt="MediaPlus Digital" 
              className="h-16 md:h-20 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            SEM Manager
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-light">
            AI-powered search engine marketing analysis and ad generation
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="glass-card rounded-2xl p-8 fade-in" style={{ animationDelay: '0.1s' }}>
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
      </div>
    </main>
  );
}
