'use client';

interface Competitor {
  url?: string;
  brand_name: string;
  positioning?: string;
  key_messages?: string[];
  strengths?: string[];
  weaknesses?: string[];
  pricing_approach?: string;
  unique_features?: string[];
  cta_approach?: string;
  ad_copy_angles?: string[];
}

interface CompetitorViewProps {
  competitorResearch: {
    competitors?: Competitor[];
    competitive_advantages?: string[];
    gaps_opportunities?: string[];
    total_analyzed?: number;
  };
}

export function CompetitorView({ competitorResearch }: CompetitorViewProps) {
  const competitors = competitorResearch?.competitors || [];
  const advantages = competitorResearch?.competitive_advantages || [];

  if (competitors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <p className="text-lg font-medium">No competitor analysis available</p>
        <p className="text-sm mt-1">Competitor research was not performed for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Competitive Advantages Summary */}
      {advantages.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Your Competitive Advantages</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="space-y-2">
              {advantages.map((advantage, i) => (
                <li key={i} className="flex gap-2 text-green-800">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Competitor Cards */}
      <section>
        <h3 className="text-lg font-semibold mb-3">
          Competitor Analysis
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({competitors.length} analyzed)
          </span>
        </h3>
        
        <div className="space-y-6">
          {competitors.map((competitor, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {competitor.brand_name || 'Unknown Competitor'}
                  </h4>
                  {competitor.url && (
                    <a 
                      href={competitor.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {competitor.url}
                    </a>
                  )}
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  #{index + 1}
                </span>
              </div>

              {/* Positioning */}
              {competitor.positioning && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Market Positioning</p>
                  <p className="text-gray-700">{competitor.positioning}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                {competitor.strengths && competitor.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Their Strengths</p>
                    <ul className="space-y-1">
                      {competitor.strengths.map((strength, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-red-500">▲</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Their Weaknesses / Gaps</p>
                    <ul className="space-y-1">
                      {competitor.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-green-500">▼</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Key Messages */}
              {competitor.key_messages && competitor.key_messages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-2">Their Key Messages</p>
                  <div className="flex flex-wrap gap-2">
                    {competitor.key_messages.map((msg, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {msg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ad Copy Angles */}
              {competitor.ad_copy_angles && competitor.ad_copy_angles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-600 mb-2">Likely Ad Angles</p>
                  <div className="flex flex-wrap gap-2">
                    {competitor.ad_copy_angles.map((angle, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                        {angle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unique Features */}
              {competitor.unique_features && competitor.unique_features.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-600 mb-2">Features They Emphasize</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {competitor.unique_features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Approach */}
              {competitor.cta_approach && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-1">Call-to-Action Strategy</p>
                  <p className="text-sm text-gray-700">{competitor.cta_approach}</p>
                </div>
              )}

              {/* Pricing */}
              {competitor.pricing_approach && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pricing Approach</p>
                  <p className="text-sm text-gray-700">{competitor.pricing_approach}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
