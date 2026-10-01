import React, { useState } from 'react';
import { formatCurrency, formatTime } from '../../lib/format.js';
import { buildMapsUrl } from '../../lib/maps.js';
import { CATEGORY_LABELS } from '../../schemas/common.js';
import {
  Clock,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Compass,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Edit2,
  Trash2,
  BookmarkCheck,
  Car,
} from 'lucide-react';

export function ActivityCard({
  activity,
  currency = 'INR',
  sourceImage = null,
  onSwap,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  readOnly = false,
}) {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const mapsUrl = buildMapsUrl(activity.maps_query || `${activity.place_name}`);

  return (
    <div className="group relative bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-4">
      {/* Top row: Timeslot, Category, Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold font-mono">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>
              {formatTime(activity.start_time)} – {formatTime(activity.end_time)}
            </span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600">
            {CATEGORY_LABELS[activity.category] || activity.category}
          </span>
        </div>

        {/* Source traceability and AI chips */}
        <div className="flex items-center space-x-2">
          {sourceImage ? (
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition"
              title="Click to view original inspiration screenshot"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>From your screenshot #{sourceImage.position + 1}</span>
            </button>
          ) : activity.is_ai_suggested ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>AI Route Suggestion</span>
            </span>
          ) : null}

          {activity.booking_recommended && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <BookmarkCheck className="w-3 h-3" />
              <span>Book in advance</span>
            </span>
          )}
        </div>
      </div>

      {/* Main content: Title, Place, Maps link */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <h4 className="text-lg font-bold text-stone-900 tracking-tight leading-snug">
            {activity.title}
          </h4>

          <div className="flex items-center space-x-2 text-sm font-semibold text-coral-600">
            <span>{activity.place_name}</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-medium text-stone-400 hover:text-stone-700 hover:underline"
              title="Open Google Maps search in new tab"
            >
              <span>View Map</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {activity.description && (
            <p className="text-sm text-stone-600 leading-relaxed pt-1">
              {activity.description}
            </p>
          )}

          {activity.tips && (
            <div className="mt-2 text-xs font-medium text-amber-800 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
              <span className="font-bold">Insider Tip:</span> {activity.tips}
            </div>
          )}
        </div>

        {/* Cost & Travel time column */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 sm:min-w-[120px] pt-1">
          <span className="text-xs font-semibold text-stone-400">Estimated Cost</span>
          <span className="text-base font-black text-stone-900">
            {activity.estimated_cost > 0
              ? formatCurrency(activity.estimated_cost, currency)
              : 'Free / Included'}
          </span>

          {activity.travel_minutes_from_previous > 0 && (
            <div className="flex items-center space-x-1 text-[11px] text-stone-500 font-medium mt-1">
              <Car className="w-3 h-3 text-stone-400" />
              <span>~{activity.travel_minutes_from_previous} min transit</span>
            </div>
          )}
        </div>
      </div>

      {/* Editing & Swap Controls (Hidden in read-only / print mode) */}
      {!readOnly && (
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between no-print">
          {/* Reorder up/down */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={isFirst}
              onClick={onMoveUp}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-20 disabled:pointer-events-none transition"
              title="Move earlier"
              aria-label="Move activity earlier"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={onMoveDown}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-20 disabled:pointer-events-none transition"
              title="Move later"
              aria-label="Move activity later"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onSwap}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-coral-600 hover:text-coral-700 bg-coral-50 hover:bg-coral-100 rounded-xl transition"
              title="Ask AI for alternative activity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Swap Activity</span>
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Edit activity details"
              aria-label="Edit activity"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Delete activity"
              aria-label="Delete activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Source Screenshot Modal */}
      {imageModalOpen && sourceImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                Inspiration Screenshot #{sourceImage.position + 1}
              </span>
              <button
                onClick={() => setImageModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-semibold px-2 py-1 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-stone-100 flex items-center justify-center">
              <img
                src={sourceImage.signed_url}
                alt="Original screenshot"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
            <p className="text-xs text-stone-500 text-center">
              This activity was synthesized from your uploaded travel screenshot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityCard;
