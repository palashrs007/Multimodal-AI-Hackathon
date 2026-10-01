import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Spinner } from '../shared/Spinner.jsx';

export function GenerateItineraryButton({ onClick, loading = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-coral-500 via-brand-600 to-amber-500 hover:from-coral-600 hover:to-amber-600 shadow-xl shadow-coral-500/25 hover:shadow-2xl transition-all duration-300 active:scale-[0.99] disabled:opacity-50 text-base"
    >
      {loading ? (
        <>
          <Spinner size="sm" className="text-white" />
          <span>Synthesizing Day-by-Day Itinerary...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 text-amber-200" />
          <span>Generate Full Itinerary</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </>
      )}
    </button>
  );
}

export default GenerateItineraryButton;
