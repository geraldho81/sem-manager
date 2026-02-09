import { Project, ProjectConfig, PipelineStatus, Markets } from '@/types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Markets
  getMarkets: () => request<{ markets: Markets }>('/projects/markets/list'),

  // Folder picker
  browseFolder: () => request<{ folder: string }>('/projects/browse-folder'),

  // Projects
  createProject: (name: string) =>
    request<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  configureProject: (projectId: string, config: ProjectConfig) =>
    request<{ message: string; project_id: string }>(`/projects/${projectId}/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  getProject: (projectId: string) =>
    request<Project>(`/projects/${projectId}`),

  // Pipeline
  startPipeline: (projectId: string) =>
    request<{ message: string; project_id: string }>(`/pipeline/${projectId}/start`, {
      method: 'POST',
    }),

  getPipelineStatus: (projectId: string) =>
    request<PipelineStatus>(`/pipeline/${projectId}/status`),

  cancelPipeline: (projectId: string) =>
    request<{ message: string }>(`/pipeline/${projectId}/cancel`, {
      method: 'POST',
    }),

  // Exports
  getExportExcelUrl: (projectId: string) => `${BASE}/exports/${projectId}/excel`,
  getResearch: (projectId: string) => request<Record<string, any>>(`/exports/${projectId}/research`),
  getStrategy: (projectId: string) => request<Record<string, any>>(`/exports/${projectId}/strategy`),
};
