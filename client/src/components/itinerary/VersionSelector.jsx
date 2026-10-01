import React from 'react';
import { History } from 'lucide-react';
import { formatCurrency } from '../../lib/format.js';

export function VersionSelector({ versions = [], currentVersion, onSelectVersion }) {
  if (!versions || versions.length <= 1) return null;

  return (
    <div className="flex items-center space-x-2 no-print">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
        <History className="w-3.5 h-3.5" />
        <span>Version:</span>
      </div>
      <select
        value={currentVersion}
        onChange={(e) => onSelectVersion(Number(e.target.value))}
        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-coral-500/50 shadow-sm"
      >
        {versions.map((v) => (
          <option key={v.version} value={v.version}>
            v{v.version} — {formatCurrency(v.total_estimated_cost, v.currency)} ({new Date(v.created_at).toLocaleDateString()})
          </option>
        ))}
      </select>
    </div>
  );
}

export default VersionSelector;
