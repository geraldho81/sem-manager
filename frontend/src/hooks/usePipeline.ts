'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PipelineStatus, ProjectConfig, WizardStep } from '@/types';

export function usePipeline() {
  const [step, setStep] = useState<WizardStep>('setup');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any> | null>(null);

  const { agentUpdates, connected, reset: resetWs } = useWebSocket(
    step === 'running' ? projectId : null
  );

  // Poll pipeline status while running
  useEffect(() => {
    if (step !== 'running' || !projectId) return;

    const interval = setInterval(async () => {
      try {
        const status = await api.getPipelineStatus(projectId);
        setPipelineStatus(status);

        if (status.status === 'completed') {
          setResults(status.outputs);
          setStep('results');
          clearInterval(interval);
        } else if (status.status === 'failed') {
          setError('Pipeline failed. Check agent details for errors.');
          clearInterval(interval);
        }
      } catch {
        // Will retry on next interval
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, projectId]);

  const startPipeline = useCallback(async (name: string, config: ProjectConfig) => {
    setError(null);
    resetWs();

    try {
      const project = await api.createProject(name);
      setProjectId(project.id);

      await api.configureProject(project.id, config);
      await api.startPipeline(project.id);

      setStep('running');
    } catch (err: any) {
      setError(err.message || 'Failed to start pipeline');
    }
  }, [resetWs]);

  const cancelPipeline = useCallback(async () => {
    if (!projectId) return;
    try {
      await api.cancelPipeline(projectId);
    } catch {
      // Best effort
    }
  }, [projectId]);

  const restart = useCallback(() => {
    setStep('setup');
    setProjectId(null);
    setPipelineStatus(null);
    setResults(null);
    setError(null);
    resetWs();
  }, [resetWs]);

  return {
    step,
    projectId,
    pipelineStatus,
    agentUpdates,
    connected,
    error,
    results,
    startPipeline,
    cancelPipeline,
    restart,
  };
}
