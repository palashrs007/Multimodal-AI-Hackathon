import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export function AIDisclaimerBanner({ className = '', compact = false }) {
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-stone-500 bg-stone-100/80 px-3 py-1.5 rounded-lg border border-stone-200/60 ${className}`}>
        <Sparkles className="w-3.5 h-3.5 text-coral-500 flex-shrink-0" />
        <span>
          <strong>AI Estimates:</strong> All costs, hours, and travel routes are AI-generated approximations and must be verified before booking.
        </span>
      </div>
    );
  }

  return (
    <div
      role="note"
      className={`flex items-start space-x-3.5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs sm:text-sm leading-relaxed ${className}`}
    >
      <div className="p-1 rounded-lg bg-amber-100/80 text-amber-700 flex-shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-coral-500" />
      </div>
      <div>
        <span className="font-bold text-amber-950">Honest AI Travel Notice:</span>{' '}
        All activity recommendations, estimated prices, transit durations, and opening hours are synthesized by Gemini multimodal AI models based on your visual screenshots. Real-world costs and availability fluctuate seasonally; please verify museum passes, temple dress codes, and booking requirements directly before traveling.
      </div>
    </div>
  );
}

export default AIDisclaimerBanner;
