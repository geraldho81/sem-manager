'use client';

import { Persona } from '@/types';

interface PersonaCardsProps {
  personas: Persona[];
}

export function PersonaCards({ personas }: PersonaCardsProps) {
  if (!personas.length) {
    return <p className="text-gray-500">No personas available.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {personas.map((persona, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {persona.name?.[0] || 'P'}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{persona.name}</h4>
              <p className="text-sm text-gray-500">
                {persona.age_range} | {persona.occupation}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700">{persona.description}</p>

          {persona.goals?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Goals</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                {persona.goals.map((g, j) => <li key={j}>{g}</li>)}
              </ul>
            </div>
          )}

          {persona.frustrations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Frustrations</p>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
                {persona.frustrations.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
            </div>
          )}

          {persona.sample_search_queries?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Search Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {persona.sample_search_queries.map((q, j) => (
                  <span key={j} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {persona.preferred_messaging && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Preferred Messaging</p>
              <p className="text-sm text-gray-700">{persona.preferred_messaging}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
