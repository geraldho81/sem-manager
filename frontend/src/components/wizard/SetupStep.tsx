'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Markets, ProjectConfig } from '@/types';

// Default markets in case API fails
const DEFAULT_MARKETS: Markets = {
  us: { name: 'United States', location_code: 2840, currency: 'USD', currency_symbol: '$', language: 'en', flag: '🇺🇸' },
  uk: { name: 'United Kingdom', location_code: 2826, currency: 'GBP', currency_symbol: '£', language: 'en', flag: '🇬🇧' },
  sg: { name: 'Singapore', location_code: 2702, currency: 'SGD', currency_symbol: 'S$', language: 'en', flag: '🇸🇬' },
  my: { name: 'Malaysia', location_code: 2458, currency: 'MYR', currency_symbol: 'RM', language: 'ms', flag: '🇲🇾' },
  au: { name: 'Australia', location_code: 2036, currency: 'AUD', currency_symbol: 'A$', language: 'en', flag: '🇦🇺' },
  in: { name: 'India', location_code: 2356, currency: 'INR', currency_symbol: '₹', language: 'en', flag: '🇮🇳' },
  id: { name: 'Indonesia', location_code: 2360, currency: 'IDR', currency_symbol: 'Rp', language: 'id', flag: '🇮🇩' },
  ph: { name: 'Philippines', location_code: 2608, currency: 'PHP', currency_symbol: '₱', language: 'en', flag: '🇵🇭' },
  th: { name: 'Thailand', location_code: 2764, currency: 'THB', currency_symbol: '฿', language: 'th', flag: '🇹🇭' },
  hk: { name: 'Hong Kong', location_code: 2344, currency: 'HKD', currency_symbol: 'HK$', language: 'zh', flag: '🇭🇰' },
};

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
  const [markets, setMarkets] = useState<Markets>(DEFAULT_MARKETS);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const isCloud = !!process.env.NEXT_PUBLIC_BACKEND_URL;

  const loadMarkets = async () => {
    setMarketsLoading(true);
    setMarketsError(null);
    try {
      const data = await api.getMarkets();
      if (data.markets && Object.keys(data.markets).length > 0) {
        setMarkets(data.markets);
      } else {
        console.warn('API returned empty markets, using defaults');
      }
    } catch (err) {
      console.error('Failed to load markets:', err);
      setMarketsError('Failed to load markets. Using default options.');
      // Keep default markets
    } finally {
      setMarketsLoading(false);
    }
  };

  useEffect(() => {
    loadMarkets();
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
    if (!projectName.trim() || validUrls.length === 0) return;
    if (!isCloud && !projectFolder.trim()) return;

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

      {!isCloud && (
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
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Market</label>
        <div className="relative">
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            disabled={marketsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.entries(markets).map(([key, m]) => (
              <option key={key} value={key}>
                {m.flag} {m.name} ({m.currency})
              </option>
            ))}
          </select>
          {marketsLoading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        {marketsError && (
          <div className="mt-1 flex items-center gap-2 text-xs text-amber-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{marketsError}</span>
            <button
              type="button"
              onClick={loadMarkets}
              className="text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        {selectedMarket && !marketsError && (
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
        disabled={loading || !projectName.trim() || !urls[0]?.trim() || (!isCloud && !projectFolder.trim())}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Starting...' : 'Start Analysis'}
      </button>
    </form>
  );
}
