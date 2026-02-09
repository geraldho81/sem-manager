'use client';

import { useState } from 'react';
import { KeywordCluster } from '@/types';

interface KeywordDashboardProps {
  keywords: Record<string, any>;
  currency: string;
}

type SortKey = 'keyword' | 'search_volume' | 'cpc';

export function KeywordDashboard({ keywords, currency }: KeywordDashboardProps) {
  const clusters: KeywordCluster[] = keywords.clusters || [];
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('search_volume');
  const [sortAsc, setSortAsc] = useState(false);

  const activeCluster = selectedCluster !== null ? clusters[selectedCluster] : null;

  const allKeywords = activeCluster
    ? activeCluster.keywords
    : clusters.flatMap((c) => c.keywords);

  const sorted = [...allKeywords].sort((a, b) => {
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    if (typeof av === 'string') return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Keywords ({keywords.total_keywords || allKeywords.length})
        </h3>
        <span className="text-sm text-gray-500">{clusters.length} clusters | {currency}</span>
      </div>

      {/* Cluster filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCluster(null)}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedCluster === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {clusters.map((c, i) => (
          <button
            key={i}
            onClick={() => setSelectedCluster(i)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCluster === i
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.cluster_name} ({c.keywords.length})
          </button>
        ))}
      </div>

      {/* Keywords table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('keyword')}
              >
                Keyword {sortBy === 'keyword' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('search_volume')}
              >
                Volume {sortBy === 'search_volume' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cpc')}
              >
                CPC ({currency}) {sortBy === 'cpc' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="px-4 py-2 text-center">Match</th>
              <th className="px-4 py-2 text-center">Intent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((kw, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{kw.keyword}</td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {kw.search_volume != null ? kw.search_volume.toLocaleString() : '-'}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {kw.cpc != null ? kw.cpc.toFixed(2) : '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                    {kw.recommended_match_type || '-'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    kw.intent === 'transactional' ? 'bg-green-100 text-green-700' :
                    kw.intent === 'commercial' ? 'bg-blue-100 text-blue-700' :
                    kw.intent === 'informational' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {kw.intent || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-500">No keywords found.</p>
        )}
      </div>

      {/* Negative keywords */}
      {keywords.negative_keywords?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-1">Negative Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {keywords.negative_keywords.map((nk: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {nk}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
