import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';

export function ItineraryHeader({ itinerary, actions = null }) {
  if (!itinerary) return null;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-coral-50 text-coral-700 text-xs font-bold border border-coral-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multimodal Itinerary</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {itinerary.title}
          </h1>

          <div className="flex items-center space-x-2 text-sm font-semibold text-stone-600">
            <MapPin className="w-4 h-4 text-coral-500 flex-shrink-0" />
            <span>{itinerary.destination}</span>
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 no-print">{actions}</div>}
      </div>

      {itinerary.summary && (
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-4xl border-t border-stone-100 pt-4">
          {itinerary.summary}
        </p>
      )}
    </div>
  );
}

export default ItineraryHeader;
