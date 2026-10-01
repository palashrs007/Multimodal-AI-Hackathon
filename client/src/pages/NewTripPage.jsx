import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripFormSchema } from '../schemas/trip.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { ImageDropzone } from '../components/trip/ImageDropzone.jsx';
import { ImagePreviewGrid } from '../components/trip/ImagePreviewGrid.jsx';
import { VoiceRecorder } from '../components/trip/VoiceRecorder.jsx';
import {
  CurrencySelect,
  Stepper,
  PaceSelector,
  InterestChips,
  SourcePlatformSelect,
} from '../components/trip/TripConstraintInputs.jsx';
import { AnalysisProgressStepper } from '../components/trip/AnalysisProgressStepper.jsx';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from '../hooks/useToast.jsx';
import { Sparkles, Calendar, Wallet, Users, Compass, AlertCircle, ArrowRight, MapPin, Lightbulb, Info } from 'lucide-react';

const ROTATING_DESTINATION_PLACEHOLDERS = [
  'e.g. Tokyo, Japan',
  'e.g. Paris, France',
  'e.g. Bali, Indonesia',
  'e.g. Lisbon, Portugal',
  'e.g. Amalfi Coast, Italy',
  'e.g. Cape Town, South Africa',
  'e.g. Jaipur, India',
];

const EXAMPLE_PROMPTS = [
  '7 days in Japan exploring Tokyo and Kyoto with scenic trains, local culinary gems and tranquil gardens.',
  '4-day beach & villa getaway in Bali under $1,200. Sunset cocktail bars, aesthetic brunch spots, and coastal rides.',
  '4 days of cafés, art museums and historic walking alleys in Paris.',
  '3 days in Amalfi Coast with budget €800. Scenic cliffside views, authentic espresso bars, and historic lemon groves.',
];

const POPULAR_DESTINATIONS = [
  'Tokyo, Japan',
  'Paris, France',
  'Bali, Indonesia',
  'Lisbon, Portugal',
  'Amalfi Coast, Italy',
  'Cape Town, South Africa',
  'Jaipur, India',
];

export function NewTripPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const destinationInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [destinationHighlighted, setDestinationHighlighted] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_DESTINATION_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      note_text: '',
      destination: '',
      origin_city: '',
      budget_amount: 35000,
      budget_currency: 'INR',
      duration_days: 4,
      travelers: 1,
      pace: 'balanced',
      interests: [],
      source_platform: 'unknown',
    },
  });

  const noteText = watch('note_text') || '';
  const destination = watch('destination') || '';
  const durationDays = watch('duration_days');
  const travelers = watch('travelers');
  const pace = watch('pace');
  const currency = watch('budget_currency');
  const interests = watch('interests');
  const sourcePlatform = watch('source_platform');

  const executePipeline = async (tripId, isTextOnly) => {
    try {
      setActiveTripId(tripId);

      // Step 1: Understanding your trip
      setCurrentStep(1);
      setStepError(null);

      // Step 2: Reading screenshots / constraint parsing
      setCurrentStep(2);
      const analyzeRes = await apiClient.post(`/trips/${tripId}/analyze`);

      if (isTextOnly || analyzeRes.nextStep === 'generate' || analyzeRes.status === 'review-skipped') {
        // Step 3: Planning your days
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 600));

        // Step 4: Calculating costs & synthesizing
        setCurrentStep(4);
        await apiClient.post(`/trips/${tripId}/itinerary/generate`);

        toast.success('Your personalized itinerary is ready!');
        navigate(`/trips/${tripId}/itinerary`);
      } else {
        toast.success('Analysis complete! Review the places found in your screenshots.');
        navigate(`/trips/${tripId}/review`);
      }
    } catch (err) {
      const isNeedsDest =
        err?.code === 'NEEDS_DESTINATION' ||
        err?.message?.includes('Tell us where you want to go') ||
        err?.message?.includes('NEEDS_DESTINATION');

      if (isNeedsDest) {
        setIsSubmitting(false);
        setDestinationHighlighted(true);
        toast.error('Tell us where you want to go so we can plan accurately.');
        if (destinationInputRef.current) {
          destinationInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          destinationInputRef.current.focus();
        }
        return;
      }

      setStepError(err.message || 'Something went wrong during trip generation.');
    }
  };

  const handleRetryStep = async () => {
    if (!activeTripId) return;
    setStepError(null);
    await executePipeline(activeTripId, images.length === 0);
  };

  const onSubmit = async (values) => {
    setDestinationHighlighted(false);
    setStepError(null);

    try {
      setIsSubmitting(true);
      setCurrentStep(1);

      const formData = new FormData();
      if (values.title) formData.append('title', values.title);
      formData.append('note_text', values.note_text);
      if (values.destination) formData.append('destination', values.destination);
      if (values.origin_city) formData.append('origin_city', values.origin_city);
      if (values.destination) formData.append('destination_hint', values.destination);
      if (values.budget_amount) formData.append('budget_amount', values.budget_amount);
      formData.append('budget_currency', values.budget_currency);
      if (values.duration_days) formData.append('duration_days', values.duration_days);
      formData.append('travelers', values.travelers);
      formData.append('pace', values.pace);
      if (values.start_date) formData.append('start_date', values.start_date);
      if (values.dietary_or_access_notes) formData.append('dietary_or_access_notes', values.dietary_or_access_notes);
      formData.append('source_platform', values.source_platform);
      formData.append('interests', JSON.stringify(values.interests || []));

      // Append image files if any
      images.forEach((imgObj) => {
        formData.append('images', imgObj.file);
      });

      // Append voice note if recorded
      if (voiceBlob) {
        formData.append('voice_note', voiceBlob, 'voice_memo.webm');
        formData.append('has_voice_note', 'true');
      }

      // 1. Create Trip record
      const createRes = await apiClient.post('/trips', formData);
      const tripId = createRes.tripId;

      await executePipeline(tripId, images.length === 0);
    } catch (err) {
      setIsSubmitting(false);
      const isNeedsDest =
        err?.code === 'NEEDS_DESTINATION' ||
        err?.message?.includes('Tell us where you want to go') ||
        err?.message?.includes('NEEDS_DESTINATION');

      if (isNeedsDest) {
        setDestinationHighlighted(true);
        toast.error('Tell us where you want to go so we can plan accurately.');
        if (destinationInputRef.current) {
          destinationInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          destinationInputRef.current.focus();
        }
      } else {
        toast.error(err.message || 'Failed to submit trip request.');
      }
    }
  };

  const handleChipClick = (example) => {
    setValue('note_text', example, { shouldValidate: true });
  };

  const handleDestinationChip = (dest) => {
    setValue('destination', dest, { shouldValidate: true });
    setDestinationHighlighted(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        title="Plan Your Dream Journey"
        subtitle="Describe your dream trip, set your destination, and let multimodal AI craft your itinerary"
      />

      {isSubmitting ? (
        <div className="py-8 animate-fade-in">
          <AnalysisProgressStepper
            currentStep={currentStep}
            error={stepError}
            onRetry={handleRetryStep}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          {/* Section 1: Tell Us About Your Trip */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-black text-xs">
                  1
                </span>
                <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wider">
                  Tell Us About Your Trip *
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-400">Main Input</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Describe your dream trip
                  </label>
                  <span
                    className={`text-xs font-semibold ${
                      noteText.length < 10
                        ? 'text-amber-600'
                        : noteText.length > 2000
                        ? 'text-rose-600'
                        : 'text-stone-400'
                    }`}
                  >
                    {noteText.length} / 2000 characters (min 10)
                  </span>
                </div>
                <textarea
                  rows={4}
                  {...register('note_text')}
                  placeholder="e.g. 5 days exploring local food, historic spots, art and quiet viewpoints. Looking for relaxed morning cafés and authentic evening strolls."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 transition ${
                    errors.note_text
                      ? 'border-rose-300 focus:ring-rose-400/50 bg-rose-50/20'
                      : 'border-stone-200 focus:ring-coral-500/50'
                  }`}
                />
                {errors.note_text && (
                  <p className="text-xs text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.note_text.message}</span>
                  </p>
                )}
              </div>

              {/* Example Prompt Chips */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs text-stone-500 font-bold uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Try an example prompt:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_PROMPTS.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(ex)}
                      className="text-left p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100/90 text-stone-700 text-xs font-medium transition line-clamp-2"
                    >
                      "{ex}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Voice Memo directly under textarea */}
              <div className="pt-2 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-2 font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-coral-500" />
                  <span>Optional voice memo (transcribed and appended to your trip note, max 60s)</span>
                </div>
                <VoiceRecorder
                  onAudioReady={(blob) => setVoiceBlob(blob)}
                  onResetAudio={() => setVoiceBlob(null)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Where To? (Destination) */}
          <div
            className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5 transition duration-300 ${
              destinationHighlighted
                ? 'border-coral-500 ring-4 ring-coral-100 bg-coral-50/10'
                : 'border-stone-200/90'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-black text-xs">
                  2
                </span>
                <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wider">
                  Where To? (Destination)
                </h3>
              </div>
              <span className="text-xs font-bold text-coral-600">Strongly Encouraged</span>
            </div>

            {destinationHighlighted && (
              <div className="p-3.5 rounded-2xl bg-coral-50 border border-coral-200 text-coral-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-coral-600 flex-shrink-0" />
                <span>Tell us where you want to go so we can plan accurately.</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Destination
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    ref={destinationInputRef}
                    type="text"
                    {...register('destination')}
                    placeholder={ROTATING_DESTINATION_PLACEHOLDERS[placeholderIndex]}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1.5">
                  If you fill this in, we'll plan exactly here and use your screenshots only as inspiration.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Starting City (Optional)
                </label>
                <input
                  type="text"
                  {...register('origin_city')}
                  placeholder="e.g. New Delhi, Mumbai, London"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
                <p className="text-xs text-stone-400 mt-1">Used for realistic travel time and transit cost estimates.</p>
              </div>

              {/* Suggestion Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">
                  Popular destinations:
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_DESTINATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDestinationChip(d)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                        destination === d
                          ? 'bg-coral-500 text-white border-coral-500 shadow-sm'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Trip Structure & Budget */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-black text-xs">
                3
              </span>
              <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wider">
                Trip Structure & Budget
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Trip Title (Optional)
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Rajasthan Heritage Getaway"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
              />
            </div>

            {/* Budget input with currency selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Total Budget
              </label>
              <div className="flex gap-2">
                <CurrencySelect
                  value={currency}
                  onChange={(c) => setValue('budget_currency', c)}
                />
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    {...register('budget_amount')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                  />
                </div>
              </div>
              {errors.budget_amount && (
                <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.budget_amount.message}</p>
              )}
            </div>

            {/* Steppers: Duration & Travelers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Stepper
                label="Duration"
                value={durationDays}
                onChange={(d) => setValue('duration_days', d)}
                min={1}
                max={30}
                unit="days"
                icon={Calendar}
              />
              <Stepper
                label="Travelers"
                value={travelers}
                onChange={(t) => setValue('travelers', t)}
                min={1}
                max={20}
                unit="people"
                icon={Users}
              />
            </div>

            {/* Pace Selector */}
            <PaceSelector
              value={pace}
              onChange={(p) => setValue('pace', p)}
            />

            {/* Interest Chips */}
            <InterestChips
              selected={interests}
              onChange={(ints) => setValue('interests', ints)}
              max={8}
            />

            {/* Dietary or Accessibility notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Dietary or Mobility Notes (Optional)
              </label>
              <input
                type="text"
                {...register('dietary_or_access_notes')}
                placeholder="e.g. Vegetarian, wheelchair accessible routes only"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
              />
            </div>
          </div>

          {/* Section 4: Add Screenshots for Inspiration (Optional) */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-black text-xs">
                  4
                </span>
                <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wider">
                  Visual Inspiration & Moodboard (Optional)
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-400">0 to 10 photos</span>
            </div>

            <p className="text-xs text-stone-500">
              Optional — attach saved photos, reels, or pins to capture the vibe and aesthetics you love.
            </p>

            <ImageDropzone
              images={images}
              onImagesChange={(imgs) => setImages(imgs)}
              maxCount={10}
            />

            <ImagePreviewGrid
              images={images}
              onRemove={(idx) => {
                const updated = [...images];
                updated.splice(idx, 1);
                setImages(updated);
              }}
              onReorder={(reordered) => setImages(reordered)}
            />

            {images.length > 0 && (
              <div className="max-w-xs pt-2">
                <SourcePlatformSelect
                  value={sourcePlatform}
                  onChange={(val) => setValue('source_platform', val)}
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <span>Screenshots with a visible place name or location tag are recognized most accurately.</span>
            </div>
          </div>

          {/* Sticky Primary CTA */}
          <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {images.length === 0 ? 'Text-First Planning' : `${images.length} Screenshots Attached`}
              </div>
              <div className="text-sm font-bold text-stone-800">
                {images.length === 0
                  ? 'Plan directly from your description & destination'
                  : 'We will match places from your screenshots to your destination'}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || noteText.trim().length < 10}
              className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-bold text-white transition active:scale-98 text-base shadow-xl ${
                noteText.trim().length < 10
                  ? 'bg-stone-300 cursor-not-allowed text-stone-500 shadow-none'
                  : 'bg-gradient-to-r from-coral-500 via-brand-600 to-amber-500 hover:from-coral-600 hover:to-amber-600 shadow-coral-500/25'
              }`}
            >
              <span>
                {images.length === 0
                  ? 'Generate Itinerary →'
                  : 'Analyze Screenshots & Review Places →'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default NewTripPage;
