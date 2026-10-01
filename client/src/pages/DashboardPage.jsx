import React from 'react';
import { useTrips } from '../hooks/useTrips.js';
import { TripGrid } from '../components/dashboard/TripGrid.jsx';
import { NewTripButton } from '../components/dashboard/NewTripButton.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from '../hooks/useToast.jsx';

export function DashboardPage() {
  const { trips, total, page, setPage, loading, error, refresh, deleteTrip, duplicateTrip } = useTrips(1, 12);
  const toast = useToast();

  const handleUpdateTitle = async (tripId, newTitle) => {
    try {
      await apiClient.patch(`/trips/${tripId}`, { title: newTitle });
      toast.success('Trip renamed successfully');
      refresh();
    } catch (err) {
      toast.error(`Rename failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Your Planned Journeys"
        subtitle="Manage and edit your travel itineraries generated from your photo saves."
        actions={<NewTripButton size="md" />}
      />

      {error && error.includes('not initialized') && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 text-amber-900 shadow-sm space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-amber-900">Database Tables Initialization Required</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Your Supabase project is connected, but the PostgreSQL database tables have not been created yet.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-4 border border-amber-200/60 text-xs space-y-2 text-stone-700">
            <p className="font-semibold text-stone-900">How to initialize with 1 click:</p>
            <ol className="list-decimal list-inside space-y-1 text-stone-600">
              <li>
                Open the{' '}
                <a
                  href="https://supabase.com/dashboard/project/fvrfwabwthysrtuilkca/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-coral-600 hover:text-coral-700 underline"
                >
                  Supabase SQL Editor for your project ↗
                </a>
              </li>
              <li>Copy and paste the code from <code className="px-1.5 py-0.5 bg-stone-100 rounded font-mono text-stone-800">supabase/schema_combined.sql</code></li>
              <li>Click <strong>Run</strong> and refresh this page.</li>
            </ol>
          </div>

          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Refresh & Check Again
          </button>
        </div>
      )}

      <TripGrid
        trips={trips}
        loading={loading}
        onDelete={deleteTrip}
        onDuplicate={duplicateTrip}
        onUpdateTitle={handleUpdateTitle}
      />
    </div>
  );
}

export default DashboardPage;
