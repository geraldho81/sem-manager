'use client';

import { AdGroupRSA } from '@/types';

interface RSAPreviewProps {
  adGroups: AdGroupRSA[];
}

function CharCount({ text, limit }: { text: string; limit: number }) {
  const len = text.length;
  const isOver = len > limit;

  return (
    <span className={`text-xs ${isOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
      {len}/{limit}
    </span>
  );
}

export function RSAPreview({ adGroups }: RSAPreviewProps) {
  if (!adGroups.length) {
    return <p className="text-gray-500">No RSAs generated.</p>;
  }

  return (
    <div className="space-y-8">
      {adGroups.map((ag, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800">{ag.ad_group_name}</h4>
            <p className="text-sm text-gray-500">
              {ag.headlines.length} headlines | {ag.descriptions.length} descriptions |{' '}
              {ag.keywords.length} keywords
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Ad Preview */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-lg">
              <p className="text-xs text-gray-400 mb-1">Ad Preview</p>
              <p className="text-blue-700 text-lg font-medium leading-tight">
                {ag.headlines[0]?.text} | {ag.headlines[1]?.text}
              </p>
              <p className="text-green-700 text-sm mt-0.5">example.com</p>
              <p className="text-gray-600 text-sm mt-1">
                {ag.descriptions[0]?.text}
              </p>
            </div>

            {/* Headlines */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Headlines ({ag.headlines.length}/15)
              </p>
              <div className="space-y-1">
                {ag.headlines.map((h, j) => (
                  <div key={j} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded">
                    <span className="text-sm">{h.text}</span>
                    <CharCount text={h.text} limit={30} />
                  </div>
                ))}
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Descriptions ({ag.descriptions.length}/4)
              </p>
              <div className="space-y-1">
                {ag.descriptions.map((d, j) => (
                  <div key={j} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded">
                    <span className="text-sm">{d.text}</span>
                    <CharCount text={d.text} limit={90} />
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Keywords ({ag.keywords.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ag.keywords.map((kw, j) => (
                  <span key={j} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    {kw.match_type === 'exact' ? `[${kw.text}]` :
                     kw.match_type === 'phrase' ? `"${kw.text}"` : kw.text}
                    {kw.cpc ? ` (${kw.currency} ${kw.cpc.toFixed(2)})` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
