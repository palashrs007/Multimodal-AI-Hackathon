import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip.js';
import { useItinerary } from '../hooks/useItinerary.js';
import { formatCurrency, formatTime } from '../lib/format.js';
import { Printer, ArrowLeft, Compass, Calendar, Wallet } from 'lucide-react';
import { AIDisclaimerBanner } from '../components/shared/AIDisclaimerBanner.jsx';

export function PrintItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trip } = useTrip(tripId);
  const { itinerary, loading } = useItinerary(tripId);

  useEffect(() => {
    // If not loading and itinerary is present, auto trigger print dialog after 600ms
    if (!loading && itinerary) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, itinerary]);

  if (loading || !itinerary) {
    return (
      <div className="py-20 text-center text-sm font-semibold text-stone-500">
        Preparing print layout...
      </div>
    );
  }

  const days = itinerary.days || [];

  return (
    <div className="print-container max-w-4xl mx-auto px-6 py-8 space-y-8 bg-white text-black min-h-screen">
      {/* Non-printable action bar */}
      <div className="no-print flex items-center justify-between border-b pb-4 mb-6">
        <button
          onClick={() => navigate(`/trips/${tripId}/itinerary`)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Interactive Itinerary</span>
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs shadow-sm hover:bg-stone-800"
        >
          <Printer className="w-4 h-4" />
          <span>Print or Save to PDF</span>
        </button>
      </div>

      {/* Printable Header */}
      <div className="border-b-2 border-stone-900 pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-stone-900 font-extrabold text-sm tracking-wider uppercase">
            <Compass className="w-4 h-4" />
            <span>WanderShot Travel Planner</span>
          </div>
          <span className="text-xs text-stone-500">
            Generated {new Date().toLocaleDateString()}
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight">{itinerary.title}</h1>
        <p className="text-sm font-bold text-stone-700">📍 {itinerary.destination}</p>
        {itinerary.summary && (
          <p className="text-xs text-stone-600 leading-relaxed pt-1">{itinerary.summary}</p>
        )}

        <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-stone-800">
          <div>
            Duration: <strong>{trip?.duration_days} days</strong>
          </div>
          <div>
            Total Est. Cost:{' '}
            <strong>{formatCurrency(itinerary.total_estimated_cost, itinerary.currency)}</strong>
          </div>
          <div>
            Pace: <strong className="capitalize">{trip?.pace}</strong>
          </div>
        </div>
      </div>

      {/* Printable Disclaimer */}
      <AIDisclaimerBanner compact={true} />

      {/* Sequential Days */}
      <div className="space-y-8">
        {days.map((day) => (
          <div key={day.day_number} className="avoid-break-inside space-y-4 border-b pb-6">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  Day {day.day_number}: {day.title}
                </h2>
                {day.theme && <p className="text-xs text-stone-500 italic">{day.theme}</p>}
              </div>
              <span className="text-xs font-bold text-stone-700">
                Est. {formatCurrency(day.daily_estimated_cost, itinerary.currency)}
              </span>
            </div>

            {day.notes && (
              <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <strong>Note:</strong> {day.notes}
              </p>
            )}

            {/* Activities Table */}
            <div className="space-y-3">
              {(day.activities || []).map((act, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 text-xs">
                  <div className="w-24 font-mono font-bold text-stone-600 flex-shrink-0">
                    {formatTime(act.start_time)} - {formatTime(act.end_time)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="font-bold text-stone-900 text-sm">{act.title}</div>
                    <div className="text-stone-600 font-semibold">{act.place_name}</div>
                    {act.description && <p className="text-stone-500">{act.description}</p>}
                    {act.tips && <p className="text-amber-900 italic">Tip: {act.tips}</p>}
                  </div>
                  <div className="w-24 text-right font-bold text-stone-800 flex-shrink-0">
                    {act.estimated_cost > 0
                      ? formatCurrency(act.estimated_cost, itinerary.currency)
                      : 'Included'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* General Tips */}
      {itinerary.general_tips?.length > 0 && (
        <div className="avoid-break-inside pt-4 space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            Travel Tips & Etiquette
          </h3>
          <ul className="list-disc list-inside text-xs space-y-1 text-stone-600">
            {itinerary.general_tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PrintItineraryPage;
