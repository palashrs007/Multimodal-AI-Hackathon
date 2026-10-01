import React, { useState } from 'react';
import { Modal } from '../shared/Modal.jsx';
import { Sparkles, Calendar } from 'lucide-react';
import { Spinner } from '../shared/Spinner.jsx';

export function RegenerateDayDialog({ isOpen, onClose, day, onRegenerate, loading = false }) {
  const [instruction, setInstruction] = useState('');

  if (!day) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onRegenerate(day.id, instruction.trim());
    setInstruction('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Regenerate Day ${day.day_number}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Current Theme
          </span>
          <p className="text-sm font-bold text-stone-900 mt-0.5">{day.title}</p>
          {day.theme && <p className="text-xs text-stone-500">{day.theme}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            What would you like to change for this day? (Optional)
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., 'Make it more focused on temples and morning photography', or 'Focus on street food and markets'"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>Screenshot places on this day are preserved by default.</span>
            <span>{instruction.length}/300</span>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-coral-500 hover:bg-coral-600 rounded-xl shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span>Regenerating Day...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Regenerate Day</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RegenerateDayDialog;
