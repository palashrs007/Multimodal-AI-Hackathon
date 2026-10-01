import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-coral-50 text-coral-600 flex items-center justify-center ring-8 ring-coral-50/50">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-stone-900 tracking-tight">404 — Off the Map</h1>
      <p className="text-sm text-stone-500 max-w-sm leading-relaxed">
        The route or trip page you are looking for doesn’t exist or has moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition"
      >
        <Home className="w-4 h-4" />
        <span>Return Home</span>
      </Link>
    </div>
  );
}

export default NotFoundPage;
