'use client';

interface StrategyViewProps {
  strategy: Record<string, any>;
  currency: string;
}

export function StrategyView({ strategy, currency }: StrategyViewProps) {
  const adGroups = strategy.ad_groups || [];

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="text-lg font-semibold">{strategy.campaign_name || 'Campaign Strategy'}</h3>
        {strategy.objective && (
          <p className="text-sm text-gray-600"><strong>Objective:</strong> {strategy.objective}</p>
        )}
        {strategy.budget_recommendation && (
          <p className="text-sm text-gray-600"><strong>Budget:</strong> {strategy.budget_recommendation}</p>
        )}
        {strategy.bidding_strategy && (
          <p className="text-sm text-gray-600"><strong>Bidding:</strong> {strategy.bidding_strategy}</p>
        )}
      </div>

      {/* Ad Groups */}
      <div className="space-y-4">
        <h4 className="font-semibold">Ad Groups ({adGroups.length})</h4>
        {adGroups.map((ag: any, i: number) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-800">{ag.name}</h5>
                <p className="text-sm text-gray-500">{ag.theme}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  ag.priority === 'high' ? 'bg-red-100 text-red-700' :
                  ag.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {ag.priority}
                </span>
                {ag.suggested_bid && (
                  <span className="text-sm text-gray-600">
                    Bid: {ag.suggested_bid} {currency}
                  </span>
                )}
              </div>
            </div>

            {ag.target_persona && (
              <p className="text-sm text-gray-600">
                <strong>Target:</strong> {ag.target_persona}
              </p>
            )}

            {ag.messaging_angle && (
              <p className="text-sm text-gray-600">
                <strong>Angle:</strong> {ag.messaging_angle}
              </p>
            )}

            {ag.keywords?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {ag.keywords.map((kw: string, j: number) => {
                    const matchType = ag.match_types?.[kw];
                    return (
                      <span key={j} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        {matchType === 'exact' ? `[${kw}]` : matchType === 'phrase' ? `"${kw}"` : kw}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Negative Keywords */}
      {strategy.negative_keywords?.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Negative Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {strategy.negative_keywords.map((nk: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {nk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      {strategy.optimization_tips?.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Optimization Tips</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {strategy.optimization_tips.map((tip: string, i: number) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
