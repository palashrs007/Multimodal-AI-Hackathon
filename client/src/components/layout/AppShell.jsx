import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';

export function AppShell({ children, hideNav = false, hideFooter = false }) {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.mockMode) {
          setIsMockMode(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {isMockMode && (
        <div className="bg-amber-400 text-stone-900 font-extrabold text-xs px-4 py-1.5 text-center tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm border-b border-amber-500">
          <span>⚠️ MOCK DATA MODE</span>
          <span className="font-semibold normal-case text-stone-800 text-[11px]">— Simulated local fixtures are active.</span>
        </div>
      )}
      {!hideNav && <Navbar />}
      <main className="flex-1 flex flex-col w-full">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}

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

export default AppShell;
