import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip.js';
import { useItinerary } from '../hooks/useItinerary.js';
import { ItineraryHeader } from '../components/itinerary/ItineraryHeader.jsx';
import { BudgetSummaryBar } from '../components/itinerary/BudgetSummaryBar.jsx';
import { BudgetBreakdownChart } from '../components/itinerary/BudgetBreakdownChart.jsx';
import { DayTabs } from '../components/itinerary/DayTabs.jsx';
import { DayTimeline } from '../components/itinerary/DayTimeline.jsx';
import { VersionSelector } from '../components/itinerary/VersionSelector.jsx';
import { WarningsPanel } from '../components/itinerary/WarningsPanel.jsx';
import { GeneralTipsPanel } from '../components/itinerary/GeneralTipsPanel.jsx';
import { ShareDialog } from '../components/itinerary/ShareDialog.jsx';
import { ExportMenu } from '../components/itinerary/ExportMenu.jsx';
import { AIDisclaimerBanner } from '../components/shared/AIDisclaimerBanner.jsx';
import { ItinerarySkeleton } from '../components/shared/Skeleton.jsx';
import { Sparkles, Share2, PlusCircle, ArrowLeft } from 'lucide-react';
import { Spinner } from '../components/shared/Spinner.jsx';

export function ItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const { trip, loading: tripLoading, refresh: refreshTrip } = useTrip(tripId);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const {
    itinerary,
    versions,
    loading: itinLoading,
    generating,
    generateNewVersion,
    regenerateDay,
    swapActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    createShare,
    revokeShare,
  } = useItinerary(tripId, selectedVersion);

  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const loading = tripLoading || itinLoading;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ItinerarySkeleton />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-stone-900">No Itinerary Generated Yet</h3>
        <p className="text-xs text-stone-500">
          Review your extracted screenshot places and click Generate Itinerary to build your schedule.
        </p>
        <button
          onClick={() => navigate(`/trips/${tripId}/review`)}
          className="px-6 py-2.5 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          Go to Review Page
        </button>
      </div>
    );
  }

  const days = itinerary.days || [];
  const activeDay = days.find((d) => d.day_number === activeDayNumber) || days[0];

  const handleShareEnable = async () => {
    await createShare();
    refreshTrip();
  };

  const handleShareRevoke = async () => {
    await revokeShare();
    refreshTrip();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Back and Version selector bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-4 no-print">
        <button
          type="button"
          onClick={() => navigate(`/trips/${tripId}/review`)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Extracted Places Review</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <VersionSelector
            versions={versions}
            currentVersion={itinerary.version}
            onSelectVersion={(v) => setSelectedVersion(v)}
          />

          <button
            type="button"
            onClick={generateNewVersion}
            disabled={generating}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-coral-700 bg-coral-50 hover:bg-coral-100 border border-coral-200 transition shadow-sm disabled:opacity-50"
          >
            {generating ? (
              <Spinner size="sm" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-coral-500" />
            )}
            <span>Generate New Version</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <ItineraryHeader
        itinerary={itinerary}
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-coral-500" />
              <span>Share Link</span>
            </button>

            <ExportMenu
              itinerary={itinerary}
              tripId={tripId}
              onOpenShare={() => setIsShareOpen(true)}
            />
          </>
        }
      />

      {/* Honest AI Disclaimer Banner */}
      <AIDisclaimerBanner />

      {/* Warnings Panel if near limit or over budget */}
      <WarningsPanel warnings={itinerary.warnings} />

      {/* Budget Tracking Bar & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetSummaryBar
          itinerary={itinerary}
          targetBudget={trip?.budget_amount}
        />
        <BudgetBreakdownChart
          breakdown={itinerary.budget_breakdown}
          currency={itinerary.currency}
          totalCost={itinerary.total_estimated_cost}
        />
      </div>

      {/* Day Tabs */}
      <div className="space-y-4 pt-2">
        <DayTabs
          days={days}
          activeDayNumber={activeDayNumber}
          onSelectDay={(num) => setActiveDayNumber(num)}
          currency={itinerary.currency}
        />

        {/* Timeline of Selected Day */}
        <DayTimeline
          day={activeDay}
          currency={itinerary.currency}
          tripImages={trip?.images || []}
          onSwapActivity={swapActivity}
          onEditActivity={updateActivity}
          onDeleteActivity={deleteActivity}
          onReorderActivities={reorderActivities}
          onRegenerateDay={regenerateDay}
        />
      </div>

      {/* Destination Tips & Cultural Etiquette */}
      <GeneralTipsPanel tips={itinerary.general_tips} />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        trip={trip}
        onEnableShare={handleShareEnable}
        onRevokeShare={handleShareRevoke}
      />
    </div>
  );
}

export default ItineraryPage;
