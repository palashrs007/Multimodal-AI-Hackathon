import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Compass,
  Sparkles,
  ArrowRight,
  PenTool,
  UploadCloud,
  CheckCircle,
  MapPin,
  Clock,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-24 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-coral-50 border border-coral-200/80 text-coral-700 text-xs sm:text-sm font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-coral-500" />
          <span>Multimodal Gemini 3.8 Flash AI Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-stone-900 tracking-tight max-w-4xl mx-auto leading-[1.08]">
          Turn your travel daydreams into a{' '}
          <span className="bg-gradient-to-r from-coral-500 via-brand-600 to-amber-500 bg-clip-text text-transparent">
            flawless, realistic itinerary
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Describe your vibe, lock in your dream destination, and let WanderShot&apos;s multimodal AI craft your complete day-by-day journey — with smart budgets, real travel times, and curated local gems.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to={isAuthenticated ? '/trips/new' : '/signup'}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-coral-500 to-brand-600 hover:from-coral-600 hover:to-brand-700 shadow-xl shadow-coral-500/25 transition-all text-base active:scale-98"
          >
            <span>Start Planning My Trip</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-bold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition text-base"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Sign in to Account'}</span>
          </Link>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs sm:text-sm font-semibold text-stone-500">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Text-first planning with hard destination lock</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Visual vibe matching with Gemini 3.8 Flash</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Strict Budget & Route Optimization</span>
          </div>
        </div>
      </section>

      {/* How it Works (3 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-coral-600">
            How WanderShot Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            From Your Thoughts to a Cohesive Plan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-8 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-coral-100 text-coral-600 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="text-xl font-bold text-stone-900">Tell Us About Your Trip</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Describe your ideal vacation, pace, interests, budget, and exact destination. Your manually typed destination always wins as a hard constraint.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/90 p-8 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="text-xl font-bold text-stone-900">Fuel with Visual Inspiration</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Drop in saved Instagram or Pinterest shots to set the mood. Gemini 3.8 Flash extracts the vibe and secret spots without overriding your destination.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/90 p-8 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="text-xl font-bold text-stone-900">Review & Explore</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Confirm your itinerary, swap activities, adjust costs, open direct Google Maps routes, and export or share with travel companions.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to turn ideas into an unforgettable itinerary?
            </h2>
            <p className="text-sm text-stone-300">
              Instant access. Works with simple thoughts, detailed requirements, or aesthetic photo inspiration.
            </p>
          </div>

          <Link
            to={isAuthenticated ? '/trips/new' : '/signup'}
            className="flex-shrink-0 inline-flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold text-stone-900 bg-white hover:bg-stone-100 transition shadow-lg text-sm"
          >
            <span>Create Free Trip</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
