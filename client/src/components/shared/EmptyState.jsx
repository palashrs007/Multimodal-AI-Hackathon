import React from 'react';
import { Compass } from 'lucide-react';

export function EmptyState({
  icon: Icon = Compass,
  title = 'No items found',
  description = 'Get started by creating your first entry.',
  action = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-stone-200/80 shadow-sm ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 ring-8 ring-brand-50/50">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-xl font-bold text-stone-900 tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
