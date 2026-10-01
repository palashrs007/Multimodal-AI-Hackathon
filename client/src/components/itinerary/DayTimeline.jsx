import React, { useState } from 'react';
import { ActivityCard } from './ActivityCard.jsx';
import { ActivityEditor } from './ActivityEditor.jsx';
import { SwapActivityDialog } from './SwapActivityDialog.jsx';
import { RegenerateDayDialog } from './RegenerateDayDialog.jsx';
import { Sparkles, Calendar, Info, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../lib/format.js';

export function DayTimeline({
  day,
  currency = 'INR',
  tripImages = [],
  onSwapActivity,
  onEditActivity,
  onDeleteActivity,
  onReorderActivities,
  onRegenerateDay,
  readOnly = false,
}) {
  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState(null);
  const [selectedActivityForSwap, setSelectedActivityForSwap] = useState(null);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!day) return null;

  // Build image map by ID
  const imageMap = new Map(tripImages.map((img) => [img.id, img]));

  const activities = day.activities || [];

  const handleMove = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= activities.length) return;
    const reordered = [...activities];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    onReorderActivities(day.id, reordered.map((a) => a.id));
  };

  const handleSwapConfirm = async (actId, instruction) => {
    try {
      setIsSwapping(true);
      await onSwapActivity(actId, instruction);
    } finally {
      setIsSwapping(false);
      setSelectedActivityForSwap(null);
    }
  };

  const handleRegenerateConfirm = async (dayId, instruction) => {
    try {
      setIsRegenerating(true);
      await onRegenerateDay(dayId, instruction);
    } finally {
      setIsRegenerating(false);
      setIsRegenerateOpen(false);
    }
  };

  return (
    <div className="space-y-6 avoid-break-inside">
      {/* Day header banner */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-coral-600 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Day {day.day_number} Plan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {day.title}
          </h2>
          {day.theme && (
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">{day.theme}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-stone-400 block uppercase">
              Day Est. Cost
            </span>
            <span className="text-lg font-black text-stone-900">
              {formatCurrency(day.daily_estimated_cost, currency)}
            </span>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsRegenerateOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition no-print"
              title="Regenerate this specific day"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Day</span>
            </button>
          )}
        </div>
      </div>

      {/* Day notes if any */}
      {day.notes && (
        <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Daily Tip:</span> {day.notes}
          </div>
        </div>
      )}

      {/* Activities Timeline list */}
      <div className="space-y-4 relative before:absolute before:top-4 before:bottom-4 before:left-8 before:w-0.5 before:bg-stone-200 before:hidden sm:before:block">
        {activities.map((act, idx) => {
          const sourceImage = act.source_image_id ? imageMap.get(act.source_image_id) : null;

          return (
            <div key={act.id || idx} className="relative sm:pl-16">
              {/* Timeline marker pip */}
              <div className="absolute left-6 top-6 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white bg-coral-500 shadow-sm hidden sm:block z-10" />

              <ActivityCard
                activity={act}
                currency={currency}
                sourceImage={sourceImage}
                onSwap={() => setSelectedActivityForSwap(act)}
                onEdit={() => setSelectedActivityForEdit(act)}
                onDelete={() => onDeleteActivity(act.id)}
                onMoveUp={() => handleMove(idx, -1)}
                onMoveDown={() => handleMove(idx, 1)}
                isFirst={idx === 0}
                isLast={idx === activities.length - 1}
                readOnly={readOnly}
              />
            </div>
          );
        })}
      </div>

      {/* Modals for Edit, Swap, and Regenerate Day */}
      {selectedActivityForEdit && (
        <ActivityEditor
          isOpen={true}
          onClose={() => setSelectedActivityForEdit(null)}
          activity={selectedActivityForEdit}
          currency={currency}
          onSave={onEditActivity}
        />
      )}

      {selectedActivityForSwap && (
        <SwapActivityDialog
          isOpen={true}
          onClose={() => setSelectedActivityForSwap(null)}
          activity={selectedActivityForSwap}
          onSwap={handleSwapConfirm}
          loading={isSwapping}
        />
      )}

      {isRegenerateOpen && (
        <RegenerateDayDialog
          isOpen={true}
          onClose={() => setIsRegenerateOpen(false)}
          day={day}
          onRegenerate={handleRegenerateConfirm}
          loading={isRegenerating}
        />
      )}
    </div>
  );
}

export default DayTimeline;
