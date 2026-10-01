import React from 'react';
import {
  PLACE_CATEGORIES,
  CATEGORY_LABELS,
  TRAVEL_PACES,
  CURRENCIES,
  SOURCE_PLATFORMS,
} from '../../schemas/common.js';
import { Minus, Plus, Wallet, Calendar, Users, Gauge, Globe } from 'lucide-react';

export function CurrencySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

export function Stepper({ label, value, onChange, min = 1, max = 30, unit = '', icon: Icon }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-coral-500" />}
          {label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xl font-black text-stone-900">
          {value} <span className="text-xs font-semibold text-stone-400">{unit}</span>
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:pointer-events-none transition"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:pointer-events-none transition"
            aria-label={`Increase ${label}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaceSelector({ value, onChange }) {
  const paces = [
    { id: 'relaxed', label: 'Relaxed', desc: '2–3 stops / day' },
    { id: 'balanced', label: 'Balanced', desc: '3–4 stops / day' },
    { id: 'packed', label: 'Packed', desc: '5–6 stops / day' },
  ];

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
        Trip Pace
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {paces.map((p) => {
          const isSelected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'border-coral-500 bg-coral-50/70 text-coral-950 font-bold shadow-sm ring-2 ring-coral-500/20'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="text-sm font-bold capitalize">{p.label}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">{p.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InterestChips({ selected = [], onChange, max = 8 }) {
  const toggleInterest = (category) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      if (selected.length < max) {
        onChange([...selected, category]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
          Travel Interests ({selected.length}/{max})
        </label>
        <span className="text-[11px] text-stone-400">Select vibe priorities</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLACE_CATEGORIES.map((cat) => {
          const isChecked = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleInterest(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isChecked
                  ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SourcePlatformSelect({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
        Screenshot Source Platform
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50"
      >
        {SOURCE_PLATFORMS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
