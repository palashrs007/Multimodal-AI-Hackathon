import React from 'react';
import { Compass, Lightbulb } from 'lucide-react';

export function GeneralTipsPanel({ tips = [] }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-3">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-stone-500">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span>Destination Tips & Cultural Etiquette</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="flex items-start space-x-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-xs sm:text-sm text-stone-700 leading-relaxed font-medium"
          >
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GeneralTipsPanel;
