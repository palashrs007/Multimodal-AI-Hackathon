import React from 'react';
import { formatCurrency } from '../../lib/format.js';
import { Home, Utensils, Compass, Bus, MoreHorizontal } from 'lucide-react';

export function BudgetBreakdownChart({ breakdown = {}, currency = 'INR', totalCost = 1 }) {
  const items = [
    { key: 'accommodation', label: 'Stays & Hotels', icon: Home, color: 'bg-indigo-500', barColor: 'bg-indigo-500' },
    { key: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-amber-500', barColor: 'bg-amber-500' },
    { key: 'activities', label: 'Activities & Sightseeing', icon: Compass, color: 'bg-coral-500', barColor: 'bg-coral-500' },
    { key: 'local_transport', label: 'Local Transit', icon: Bus, color: 'bg-emerald-500', barColor: 'bg-emerald-500' },
    { key: 'other', label: 'Misc & Souvenirs', icon: MoreHorizontal, color: 'bg-stone-400', barColor: 'bg-stone-400' },
  ];

  const total = Number(totalCost) || 1;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
        Estimated Spending Breakdown
      </h3>

      {/* Stacked visual bar */}
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-stone-100 shadow-inner">
        {items.map((item) => {
          const val = Number(breakdown[item.key]) || 0;
          const pct = Math.max(0, Math.round((val / total) * 100));
          if (pct === 0) return null;
          return (
            <div
              key={item.key}
              style={{ width: `${pct}%` }}
              className={`h-full ${item.barColor} transition-all duration-300 hover:opacity-90`}
              title={`${item.label}: ${formatCurrency(val, currency)} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* Itemized list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {items.map((item) => {
          const val = Number(breakdown[item.key]) || 0;
          const pct = Math.max(0, Math.round((val / total) * 100));
          const Icon = item.icon;

          return (
            <div key={item.key} className="flex items-center space-x-3 p-3 rounded-2xl bg-stone-50 border border-stone-100">
              <div className={`w-8 h-8 rounded-xl ${item.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-stone-500 truncate">{item.label}</div>
                <div className="text-sm font-black text-stone-900 flex items-center justify-between">
                  <span>{formatCurrency(val, currency)}</span>
                  <span className="text-[11px] font-semibold text-stone-400">{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BudgetBreakdownChart;
