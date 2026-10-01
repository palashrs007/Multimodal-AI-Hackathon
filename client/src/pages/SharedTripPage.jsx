import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient.js';
import { ItineraryHeader } from '../components/itinerary/ItineraryHeader.jsx';
import { BudgetSummaryBar } from '../components/itinerary/BudgetSummaryBar.jsx';
import { BudgetBreakdownChart } from '../components/itinerary/BudgetBreakdownChart.jsx';
import { DayTabs } from '../components/itinerary/DayTabs.jsx';
import { DayTimeline } from '../components/itinerary/DayTimeline.jsx';
import { GeneralTipsPanel } from '../components/itinerary/GeneralTipsPanel.jsx';
import { AIDisclaimerBanner } from '../components/shared/AIDisclaimerBanner.jsx';
import { ItinerarySkeleton } from '../components/shared/Skeleton.jsx';
import { Compass, Sparkles, Printer, Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';

export function SharedTripPage() {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function loadShared() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/share/${shareToken}`);
        setData(res);
      } catch (err) {
        setError(err.message || 'Shared itinerary not found or has been revoked.');
      } finally {
        setLoading(false);
      }
    }
    if (shareToken) loadShared();
  }, [shareToken]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ItinerarySkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Shared Trip Not Found</h2>
        <p className="text-sm text-stone-500 leading-relaxed">
          {error || 'This link may have been revoked by the owner or expired.'}
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl"
        >
          Explore WanderShot
        </Link>
      </div>
    );
  }

  const { trip, itinerary, images } = data;
  const days = itinerary?.days || [];
  const activeDay = days.find((d) => d.day_number === activeDayNumber) || days[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-brand-50 border border-brand-200/80 text-brand-950 no-print">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-coral-500 text-white flex items-center justify-center flex-shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Read-Only Shared Itinerary</div>
            <div className="text-[11px] text-brand-700">Planned with WanderShot Multimodal AI</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Itinerary Header */}
      <ItineraryHeader itinerary={itinerary} />

      {/* Honest AI Disclaimer */}
      <AIDisclaimerBanner />

      {/* Budget Summary & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetSummaryBar itinerary={itinerary} targetBudget={trip?.budget_amount} />
        <BudgetBreakdownChart
          breakdown={itinerary.budget_breakdown}
          currency={itinerary.currency}
          totalCost={itinerary.total_estimated_cost}
        />
      </div>

      {/* Day Tabs & Timeline (Read-Only) */}
      <div className="space-y-4 pt-2">
        <DayTabs
          days={days}
          activeDayNumber={activeDayNumber}
          onSelectDay={(num) => setActiveDayNumber(num)}
          currency={itinerary.currency}
        />

        <DayTimeline
          day={activeDay}
          currency={itinerary.currency}
          tripImages={images}
          readOnly={true}
        />
      </div>

      {/* General Tips */}
      <GeneralTipsPanel tips={itinerary.general_tips} />

      {/* CTA to create their own */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-stone-900 to-brand-950 text-white text-center space-y-4 shadow-xl no-print">
        <h3 className="text-2xl font-black tracking-tight">Have photos of places you want to visit?</h3>
        <p className="text-sm text-stone-300 max-w-lg mx-auto leading-relaxed">
          Create your own customized, budget-aware day-by-day travel plan from Instagram & Pinterest screenshots in under 2 minutes.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold bg-coral-500 hover:bg-coral-600 text-white shadow-lg text-sm transition"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Try WanderShot Free</span>
        </Link>
      </div>
    </div>
  );
}

export default SharedTripPage;
