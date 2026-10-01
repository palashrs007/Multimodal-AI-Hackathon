import React from 'react';
import { formatCurrency } from '../../lib/format.js';
import { Calendar } from 'lucide-react';

export function DayTabs({ days = [], activeDayNumber = 1, onSelectDay, currency = 'INR' }) {
  if (!days || days.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none no-print">
      {days.map((day) => {
        const isActive = day.day_number === activeDayNumber;
        const count = day.activities?.length || 0;

        return (
          <button
            key={day.day_number}
            onClick={() => onSelectDay(day.day_number)}
            className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-left transition-all ${
              isActive
                ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-coral-400' : 'text-stone-400'}`}>
                Day {day.day_number}
              </span>
              <span className="text-[11px] font-semibold opacity-75">
                {formatCurrency(day.daily_estimated_cost, currency)}
              </span>
            </div>
            <div className={`text-sm font-bold truncate max-w-[160px] mt-0.5 ${isActive ? 'text-white' : 'text-stone-800'}`}>
              {day.title || `Day ${day.day_number}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default DayTabs;
