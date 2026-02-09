'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Markets, ProjectConfig } from '@/types';

interface SetupStepProps {
  onStart: (name: string, config: ProjectConfig) => void;
  error: string | null;
}

export function SetupStep({ onStart, error }: SetupStepProps) {
  const [projectName, setProjectName] = useState('');
  const [market, setMarket] = useState('us');
  const [urls, setUrls] = useState(['']);
  const [competitorUrls, setCompetitorUrls] = useState(['']);
  const [projectFolder, setProjectFolder] = useState('');
  const [markets, setMarkets] = useState<Markets>({});
  const [loading, setLoading] = useState(false);
  const [browsing, setBrowsing] = useState(false);

  useEffect(() => {
    api.getMarkets().then((data) => setMarkets(data.markets)).catch(() => {});
  }, []);

  const addUrl = () => setUrls([...urls, '']);
  const removeUrl = (i: number) => setUrls(urls.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, val: string) => {
    const copy = [...urls];
    copy[i] = val;
    setUrls(copy);
  };

  const addCompetitor = () => setCompetitorUrls([...competitorUrls, '']);
  const removeCompetitor = (i: number) => setCompetitorUrls(competitorUrls.filter((_, idx) => idx !== i));
  const updateCompetitor = (i: number, val: string) => {
    const copy = [...competitorUrls];
    copy[i] = val;
    setCompetitorUrls(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validUrls = urls.filter((u) => u.trim());
    if (!projectName.trim() || validUrls.length === 0 || !projectFolder.trim()) return;

    setLoading(true);
    await onStart(projectName.trim(), {
      landing_page_urls: validUrls,
      market,
      competitor_urls: competitorUrls.filter((u) => u.trim()),
      project_folder: projectFolder.trim(),
    });
    setLoading(false);
  };

  const selectedMarket = markets[market];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="My SEM Campaign"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Output Folder
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={projectFolder}
            onChange={(e) => setProjectFolder(e.target.value)}
            placeholder="/Users/you/Desktop/sem-output"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="button"
            disabled={browsing}
            onClick={async () => {
              setBrowsing(true);
              try {
                const { folder } = await api.browseFolder();
                setProjectFolder(folder);
              } catch {
                // User cancelled or timed out
              } finally {
                setBrowsing(false);
              }
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 whitespace-nowrap disabled:opacity-50"
          >
            {browsing ? 'Selecting...' : 'Browse...'}
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Where to save all agent outputs (research, ads, Excel)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Market</label>
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(markets).map(([key, m]) => (
            <option key={key} value={key}>
              {m.flag} {m.name} ({m.currency})
            </option>
          ))}
        </select>
        {selectedMarket && (
          <p className="mt-1 text-sm text-gray-500">
            CPC data in {selectedMarket.currency} ({selectedMarket.currency_symbol})
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page URLs</label>
        <div className="space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={i === 0}
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add another URL
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Competitor URLs <span className="text-gray-400">(optional)</span>
        </label>
        <div className="space-y-2">
          {competitorUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateCompetitor(i, e.target.value)}
                placeholder="https://competitor.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {competitorUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompetitor(i)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCompetitor}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add competitor
        </button>
        <p className="mt-1 text-sm text-gray-500">
          Leave empty to auto-discover competitors
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !projectName.trim() || !urls[0]?.trim() || !projectFolder.trim()}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Starting...' : 'Start Analysis'}
      </button>
    </form>
  );
}
