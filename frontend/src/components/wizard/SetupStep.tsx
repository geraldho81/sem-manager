'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { ProjectConfig } from '@/types';

// Hardcoded markets - verified against DataForSEO API documentation
// location_code values are official DataForSEO country codes
const MARKETS = {
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
} as const;

type MarketKey = keyof typeof MARKETS;

interface SetupStepProps {
  onStart: (name: string, config: ProjectConfig) => void;
  error: string | null;
}

export function SetupStep({ onStart, error }: SetupStepProps) {
  const [projectName, setProjectName] = useState('');
  const [market, setMarket] = useState<MarketKey>('us');
  const [urls, setUrls] = useState(['']);
  const [competitorUrls, setCompetitorUrls] = useState(['']);
  const [projectFolder, setProjectFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const isCloud = !!process.env.NEXT_PUBLIC_BACKEND_URL;

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

  const selectedMarket = MARKETS[market];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="My SEM Campaign"
          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
          required
        />
      </div>

      {!isCloud && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Output Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={projectFolder}
              onChange={(e) => setProjectFolder(e.target.value)}
              placeholder="/Users/you/Desktop/sem-output"
              className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
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
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 font-medium whitespace-nowrap disabled:opacity-50 transition-all duration-200"
            >
              {browsing ? 'Selecting...' : 'Browse...'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Where to save all agent outputs (research, ads, Excel)
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Target Market</label>
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value as MarketKey)}
          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
        >
          {(Object.entries(MARKETS) as [MarketKey, typeof MARKETS[MarketKey]][]).map(([key, m]) => (
            <option key={key} value={key}>
              {m.flag} {m.name} ({m.currency})
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-600">
          CPC data in {selectedMarket.currency} ({selectedMarket.currency_symbol})
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Landing Page URLs</label>
        <div className="space-y-3">
          {urls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                required={i === 0}
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-200"
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
          className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          + Add another URL
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Competitor URLs <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="space-y-3">
          {competitorUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateCompetitor(i, e.target.value)}
                placeholder="https://competitor.com"
                className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
              />
              {competitorUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompetitor(i)}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-200"
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
          className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          + Add competitor
        </button>
        <p className="mt-2 text-sm text-gray-600">
          Leave empty to auto-discover competitors
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !projectName.trim() || !urls[0]?.trim() || (!isCloud && !projectFolder.trim())}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
      >
        {loading ? 'Starting...' : 'Start Analysis'}
      </button>
    </form>
  );
}
