import React, { useState } from 'react';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { AlertCircle, CheckCircle, Edit3, DollarSign, Calendar, Users, MapPin, Sparkles } from 'lucide-react';

export function ParsedConstraintsPanel({ trip, onUpdateTrip }) {
  const constraints = trip.parsed_constraints || {};
  const [isEditing, setIsEditing] = useState(false);
  const [budget, setBudget] = useState(trip.budget_amount);
  const [duration, setDuration] = useState(trip.duration_days);
  const [destination, setDestination] = useState(trip.destination_hint || constraints.destination_mentioned || '');

  const handleSave = async (e) => {
    e.preventDefault();
    await onUpdateTrip({
      budget_amount: Number(budget),
      duration_days: Number(duration),
      destination_hint: destination.trim() || null,
    });
    setIsEditing(false);
  };

  const ambiguities = constraints.ambiguities || [];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-coral-500" />
          <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
            AI-Parsed Trip Blueprint
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center space-x-1 text-xs font-bold text-coral-600 hover:text-coral-700 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel' : 'Edit Blueprint'}</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Budget ({trip.budget_currency})
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min={1}
              required
              className="w-full px-3 py-2 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Duration (Days)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              max={30}
              required
              className="w-full px-3 py-2 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
              Destination Focus
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kyoto, Japan"
              className="w-full px-3 py-2 border rounded-xl text-sm"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-stone-800"
            >
              Update Constraints
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Budget Allocated
            </span>
            <span className="text-base font-black text-stone-900 mt-0.5 block">
              {formatCurrency(trip.budget_amount, trip.budget_currency)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Duration
            </span>
            <span className="text-base font-black text-stone-900 mt-0.5 block">
              {formatDuration(trip.duration_days)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Travel Pace
            </span>
            <span className="text-base font-black text-stone-900 mt-0.5 capitalize block">
              {trip.pace}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Destination Hub
            </span>
            <span className="text-base font-black text-stone-900 mt-0.5 truncate block">
              {trip.destination_hint || constraints.destination_mentioned || 'Visual Clues'}
            </span>
          </div>
        </div>
      )}

      {/* Voice transcript if available */}
      {trip.voice_transcript && (
        <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 text-xs text-brand-950">
          <span className="font-bold">Audio Transcript:</span> &ldquo;{trip.voice_transcript}&rdquo;
        </div>
      )}

      {/* Ambiguities callout */}
      {ambiguities.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>AI Notes & Clarifications:</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-800">
            {ambiguities.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ParsedConstraintsPanel;
