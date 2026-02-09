'use client';

interface ResearchSummaryProps {
  synthesis: Record<string, any>;
}

export function ResearchSummary({ synthesis }: ResearchSummaryProps) {
  const messaging = synthesis.messaging_framework || {};

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
        <p className="text-gray-700 whitespace-pre-line">
          {synthesis.executive_summary || 'No summary available.'}
        </p>
      </section>

      {/* Key Insights */}
      {synthesis.key_insights?.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
          <ul className="space-y-2">
            {synthesis.key_insights.map((insight: string, i: number) => (
              <li key={i} className="flex gap-2 text-gray-700">
                <span className="text-blue-500 font-bold mt-0.5">{i + 1}.</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Competitive Positioning */}
      {synthesis.competitive_positioning && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Competitive Positioning</h3>
          <p className="text-gray-700">{synthesis.competitive_positioning}</p>
        </section>
      )}

      {/* Messaging Framework */}
      {messaging.primary_message && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Messaging Framework</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
            <p className="font-medium text-blue-800">Primary Message</p>
            <p className="text-blue-700">{messaging.primary_message}</p>
          </div>

          {messaging.supporting_messages?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-600 mb-1">Supporting Messages</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {messaging.supporting_messages.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {messaging.proof_points?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-600 mb-1">Proof Points</p>
              <div className="flex flex-wrap gap-2">
                {messaging.proof_points.map((p: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {messaging.tone_guidelines && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tone Guidelines</p>
              <p className="text-gray-700">{messaging.tone_guidelines}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
