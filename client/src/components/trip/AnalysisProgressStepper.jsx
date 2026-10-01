import React from 'react';
import { Compass, Eye, Calendar, DollarSign, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Spinner } from '../shared/Spinner.jsx';

export function AnalysisProgressStepper({ currentStep = 1, error = null, onRetry = null }) {
  const steps = [
    { number: 1, label: 'Understanding your trip', desc: 'Parsing your dream trip & constraints', icon: Compass },
    { number: 2, label: 'Reading your screenshots', desc: 'Detecting landmarks, text & aesthetics', icon: Eye },
    { number: 3, label: 'Planning your days', desc: 'Organizing routes and activities', icon: Calendar },
    { number: 4, label: 'Calculating costs', desc: 'Balancing currency and realistic budgets', icon: DollarSign },
  ];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xl max-w-xl mx-auto my-8 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-black text-stone-900">Crafting Your Itinerary</h3>
        <p className="text-xs text-stone-500">Gemini 3.8 Flash is intelligently synthesizing your travel plan...</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Step</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-3.5">
        {steps.map((step) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number && !error;
          const isFailed = currentStep === step.number && error;
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all duration-300 ${
                isFailed
                  ? 'border-rose-300 bg-rose-50/50'
                  : isCurrent
                  ? 'border-coral-400 bg-coral-50/40 shadow-sm'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-stone-100 bg-stone-50/50 opacity-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isFailed
                    ? 'bg-rose-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-coral-500 text-white shadow-md shadow-coral-500/30'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {isFailed ? (
                  <AlertCircle className="w-5 h-5" />
                ) : isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                )}
              </div>

              <div className="flex-1">
                <div className="text-sm font-bold text-stone-900">{step.label}</div>
                <div className="text-xs text-stone-500">{step.desc}</div>
              </div>

              {isCurrent && (
                <span className="text-xs font-bold text-coral-600 animate-pulse">In progress</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnalysisProgressStepper;
