import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { ExtractedPlaceCard } from '../components/review/ExtractedPlaceCard.jsx';
import { ParsedConstraintsPanel } from '../components/review/ParsedConstraintsPanel.jsx';
import { AddPlaceForm } from '../components/review/AddPlaceForm.jsx';
import { StyleTagCloud } from '../components/review/StyleTagCloud.jsx';
import { GenerateItineraryButton } from '../components/review/GenerateItineraryButton.jsx';
import { AIDisclaimerBanner } from '../components/shared/AIDisclaimerBanner.jsx';
import { Spinner } from '../components/shared/Spinner.jsx';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from '../hooks/useToast.jsx';
import { Sparkles, MapPin, RefreshCw, AlertCircle, ArrowRight, Check, Compass, FastForward } from 'lucide-react';

export function ReviewPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { trip, loading, analyzing, error, updatePlace, addPlace, deletePlace, updateTripDetails, runAnalysis } =
    useTrip(tripId);

  const [generating, setGenerating] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');
  const [isUpdatingDest, setIsUpdatingDest] = useState(false);

  useEffect(() => {
    if (trip?.destination || trip?.destination_hint) {
      setDestinationInput(trip.destination || trip.destination_hint);
    }
  }, [trip?.destination, trip?.destination_hint]);

  if (loading || analyzing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-coral-500" />
        <div className="text-center space-y-1">
          <p className="text-base font-bold text-stone-900">
            {analyzing ? 'Analyzing screenshots with Gemini 3.8 Flash...' : 'Loading extracted places...'}
          </p>
          <p className="text-xs text-stone-500">Detecting architecture, signage, and style tags...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error || 'Trip not found.'}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const places = trip.extracted_places || [];
  const images = trip.images || [];
  const imageMap = new Map(images.map((img) => [img.id, img]));
  const includedCount = places.filter((p) => p.included).length;

  const getSourceBadge = (source) => {
    switch (source) {
      case 'user':
        return { text: 'You entered this', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'note':
        return { text: 'From your note', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'screenshot':
        return { text: 'From screenshots', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { text: 'Inferred by AI', color: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const badge = getSourceBadge(trip.destination_source);

  const handleUpdateDestinationAndRecheck = async () => {
    if (!destinationInput.trim()) {
      toast.error('Destination cannot be empty');
      return;
    }

    try {
      setIsUpdatingDest(true);
      await apiClient.patch(`/trips/${tripId}/destination`, {
        destination: destinationInput.trim(),
        rerun_matching: true,
      });
      toast.success('Destination updated! Re-checking matching places...');
      await runAnalysis();
    } catch (err) {
      toast.error(err.message || 'Failed to update destination');
    } finally {
      setIsUpdatingDest(false);
    }
  };

  const handleGenerateItinerary = async () => {
    try {
      setGenerating(true);
      toast.info('Synthesizing day-by-day plan with Gemini 3.8 Flash...');
      await apiClient.post(`/trips/${tripId}/itinerary/generate`);
      toast.success('Itinerary generated successfully!');
      navigate(`/trips/${tripId}/itinerary`);
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSkipScreenshotsAndPlan = async () => {
    try {
      setGenerating(true);
      toast.info('Planning itinerary directly from your trip note & destination...');
      // Set all places to excluded if any exist, then generate
      for (const p of places) {
        if (p.included) {
          await updatePlace(p.id, { included: false });
        }
      }
      await apiClient.post(`/trips/${tripId}/itinerary/generate`);
      toast.success('Itinerary generated from your text description!');
      navigate(`/trips/${tripId}/itinerary`);
    } catch (err) {
      toast.error(err.message || 'Failed to generate itinerary');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        title="Review Extracted Places & Destination"
        subtitle="Verify the locations Gemini identified before generating your day-by-day itinerary."
        breadcrumbs={`Trips / ${trip.title} / Review`}
        actions={
          <button
            type="button"
            onClick={runAnalysis}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-analyze Photos</span>
          </button>
        }
      />

      {/* Honest AI Disclaimer Banner */}
      <AIDisclaimerBanner />

      {/* Resolved Destination Card with Source Badge */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-coral-500" />
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
              Confirmed Destination
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
              {badge.text}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <MapPin className="w-4 h-4 text-coral-500" />
            </div>
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Destination city / region"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-bold bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral-500/50"
            />
          </div>

          <button
            type="button"
            disabled={isUpdatingDest}
            onClick={handleUpdateDestinationAndRecheck}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition shadow-sm"
          >
            {isUpdatingDest ? (
              <Spinner size="xs" className="text-stone-700" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Re-check Places</span>
          </button>
        </div>
        <p className="text-xs text-stone-400">
          Editing the destination here updates the primary target and re-runs matching against places.
        </p>
      </div>

      {/* Blueprint & Constraints Panel */}
      <ParsedConstraintsPanel trip={trip} onUpdateTrip={updateTripDetails} />

      {/* Style Tag Cloud */}
      <StyleTagCloud places={places} />

      {/* Extracted Places Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200/80 pb-3">
          <div>
            <h3 className="text-lg font-black text-stone-900">
              Extracted Places ({includedCount} included)
            </h3>
            <p className="text-xs text-stone-500">
              Edit place details, toggle inclusions, or add missing spots.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkipScreenshotsAndPlan}
            disabled={generating}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-coral-600 hover:text-coral-700 underline underline-offset-4 transition"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip screenshots and plan from my text only</span>
          </button>
        </div>

        {places.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 text-sm space-y-2">
            <p>No places extracted from screenshots.</p>
            <p className="text-xs text-stone-400">
              You can generate directly from your description, or add places manually below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place) => {
              const sourceImage = place.image_id ? imageMap.get(place.image_id) : null;
              return (
                <ExtractedPlaceCard
                  key={place.id}
                  place={place}
                  sourceImage={sourceImage}
                  onUpdate={updatePlace}
                  onDelete={deletePlace}
                />
              );
            })}
          </div>
        )}

        {/* Add place manually */}
        <div className="pt-2">
          <AddPlaceForm onAddPlace={addPlace} />
        </div>
      </div>

      {/* Generate CTA floating or bottom bar */}
      <div className="sticky bottom-6 z-30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-stone-200/90 shadow-xl">
        <div className="text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Ready to Plan</div>
          <div className="text-sm font-bold text-stone-800">
            {includedCount} places selected for a {trip.duration_days}-day itinerary in {trip.destination || trip.destination_hint || 'your destination'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GenerateItineraryButton
            onClick={handleGenerateItinerary}
            loading={generating}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}

export default ReviewPage;
