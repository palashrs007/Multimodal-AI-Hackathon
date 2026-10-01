import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function WarningsPanel({ warnings = [] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200/80 text-rose-900 space-y-2 shadow-sm">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-800">
        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        <span>Budget & Advisory Alerts</span>
      </div>
      <ul className="list-disc list-inside text-xs sm:text-sm space-y-1.5 text-rose-900/90 leading-relaxed font-medium">
        {warnings.map((w, idx) => (
          <li key={idx}>{w}</li>
        ))}
      </ul>
    </div>
  );
}

export default WarningsPanel;
