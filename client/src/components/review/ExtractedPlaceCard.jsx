import React, { useState } from 'react';
import { PLACE_CATEGORIES, CATEGORY_LABELS } from '../../schemas/common.js';
import { MapPin, Tag, Check, Edit2, AlertCircle, EyeOff, Eye } from 'lucide-react';

export function ExtractedPlaceCard({ place, sourceImage, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(place.name);
  const [city, setCity] = useState(place.city || '');
  const [category, setCategory] = useState(place.category || 'other');

  const handleSave = () => {
    onUpdate(place.id, {
      name: name.trim(),
      city: city.trim() || null,
      category,
    });
    setIsEditing(false);
  };

  const handleToggleInclude = () => {
    onUpdate(place.id, {
      included: !place.included,
    });
  };

  const confidencePercent = Math.round((place.confidence || 0.8) * 100);

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 p-5 overflow-hidden flex flex-col justify-between ${
        place.included
          ? 'bg-white border-stone-200/90 shadow-sm hover:shadow-md'
          : 'bg-stone-100/70 border-stone-200 opacity-60'
      }`}
    >
      <div className="space-y-4">
        {/* Header with thumbnail & badges */}
        <div className="flex items-start gap-4">
          {sourceImage?.signed_url ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
              <img
                src={sourceImage.signed_url}
                alt="Source Screenshot"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-coral-50 text-coral-600 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-coral-200/60">
              Manually Added
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {place.is_identified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {confidencePercent}% Identified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Unidentified Vibe
                </span>
              )}

              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                {CATEGORY_LABELS[place.category] || place.category}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold border rounded-lg"
                  placeholder="Place Name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="px-2.5 py-1 text-xs border rounded-lg"
                    placeholder="City / Region"
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-2 py-1 text-xs border rounded-lg bg-white"
                  >
                    {PLACE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c] || c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1 text-xs font-bold text-white bg-coral-500 rounded-lg shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-base font-bold text-stone-900 truncate">{place.name}</h4>
                {place.city && (
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>
                      {place.city}
                      {place.country ? `, ${place.country}` : ''}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Inline Input for Unidentified or Low-confidence Places (< 0.6) */}
        {(!place.is_identified || (place.confidence ?? 1) < 0.6) && !isEditing && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-amber-900">
              We couldn't recognize this one — what's the place name?
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter exact place name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    onUpdate(place.id, {
                      name: e.target.value.trim(),
                      is_identified: true,
                      user_edited: true,
                      confidence: 1.0,
                    });
                  }
                }}
                id={`place-input-${place.id}`}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(`place-input-${place.id}`);
                  if (input && input.value.trim()) {
                    onUpdate(place.id, {
                      name: input.value.trim(),
                      is_identified: true,
                      user_edited: true,
                      confidence: 1.0,
                    });
                  }
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Set Place
              </button>
            </div>
          </div>
        )}

        {/* Outside Destination Warning */}
        {place.description?.includes('[Warning: This place appears to be in') && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Outside Destination</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This place is in {place.city || ''}{place.country ? `, ${place.country}` : ''}, outside your destination. Exclude or change destination?
              </p>
            </div>
          </div>
        )}

        {/* Description & Style tags */}
        {!isEditing && (
          <div className="space-y-2.5">
            {place.description && (
              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {place.description.replace(/\[Warning:[^\]]+\]\s*/g, '')}
              </p>
            )}

            {place.style_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {place.style_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Edit place details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(place.id)}
            className="text-xs text-stone-400 hover:text-rose-600 font-medium transition"
          >
            Remove
          </button>
        </div>

        <button
          type="button"
          onClick={handleToggleInclude}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
            place.included
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
          }`}
        >
          {place.included ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Included</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Excluded</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ExtractedPlaceCard;
