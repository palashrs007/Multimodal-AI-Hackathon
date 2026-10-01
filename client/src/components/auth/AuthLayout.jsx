import React from 'react';
import { Compass, Sparkles, MapPin, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-stone-50">
      {/* Left branding pane */}
      <div className="lg:w-1/2 bg-gradient-to-br from-stone-900 via-brand-950 to-stone-900 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background ambient lights */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-coral-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-coral-500 flex items-center justify-center text-white shadow-lg shadow-coral-500/30">
              <Compass className="w-5 h-5 stroke-[2.25]" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              Wander<span className="text-coral-400">Shot</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-coral-300 text-xs font-semibold backdrop-blur-md border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multimodal Travel Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Stop collecting pins. Start living the journey.
          </h2>
          <p className="text-stone-300 text-base leading-relaxed">
            Drop your Instagram saves, reels snapshots, and quick audio memos. WanderShot identifies hidden viewpoints, clusters stops smartly, and crafts a flawless, budget-respecting itinerary in 60 seconds.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-3 text-stone-300">
              <Camera className="w-5 h-5 text-coral-400" />
              <span className="text-xs font-medium">Vision Landmark Extraction</span>
            </div>
            <div className="flex items-center space-x-3 text-stone-300">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-medium">Smart Day-to-Day Routing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-stone-500">
          Crafted for modern travelers worldwide.
        </div>
      </div>

      {/* Right form pane */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h2>
            {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
