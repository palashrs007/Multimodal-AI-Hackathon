import React from 'react';

export function PageHeader({ title, subtitle, actions = null, breadcrumbs = null }) {
  return (
    <div className="mb-8 border-b border-stone-200/70 pb-5">
      {breadcrumbs && <div className="mb-2 text-xs font-semibold text-stone-400">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-stone-500 mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
