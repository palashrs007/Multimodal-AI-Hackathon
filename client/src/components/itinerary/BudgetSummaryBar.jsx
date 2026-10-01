import React from 'react';
import { formatCurrency } from '../../lib/format.js';
import { Wallet, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export function BudgetSummaryBar({ itinerary, targetBudget }) {
  if (!itinerary) return null;

  const totalCost = Number(itinerary.total_estimated_cost) || 0;
  const budget = Number(targetBudget) || totalCost;
  const currency = itinerary.currency || 'INR';

  const percentage = budget > 0 ? Math.min(100, Math.round((totalCost / budget) * 100)) : 100;
  const status = itinerary.budget_status || 'within_budget';

  const statusConfig = {
    within_budget: {
      label: 'Within Budget',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: CheckCircle,
    },
    near_limit: {
      label: 'Near Budget Limit',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-100 border-amber-300 text-amber-800',
      barColor: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      icon: TrendingUp,
    },
    over_budget: {
      label: 'Over Budget',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-100 border-rose-300 text-rose-800',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-600',
      icon: AlertTriangle,
    },
  };

  const current = statusConfig[status] || statusConfig.within_budget;
  const Icon = current.icon;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-coral-500" />
          <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
            Budget Tracking
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${current.badgeBg}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{current.label}</span>
          </span>
        </div>
      </div>

      {/* Figures */}
      <div className="flex items-baseline justify-between text-sm pt-1">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-stone-400 block">Total Estimated Cost</span>
          <span className="text-2xl font-black text-stone-900">
            {formatCurrency(totalCost, currency)}
          </span>
        </div>

        <div className="text-right space-y-0.5">
          <span className="text-xs font-semibold text-stone-400 block">Target Budget</span>
          <span className="text-lg font-bold text-stone-600">
            {formatCurrency(budget, currency)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${current.barColor}`}
            style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-stone-400 px-0.5">
          <span>0%</span>
          <span>{percentage}% allocated</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

export default BudgetSummaryBar;
