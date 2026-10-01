import React, { useState } from 'react';
import { Modal } from '../shared/Modal.jsx';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Spinner } from '../shared/Spinner.jsx';

export function SwapActivityDialog({ isOpen, onClose, activity, onSwap, loading = false }) {
  const [instruction, setInstruction] = useState('');

  if (!activity) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSwap(activity.id, instruction.trim());
    setInstruction('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Swap Activity with AI" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Current Activity to Replace
          </span>
          <p className="text-sm font-bold text-stone-900 mt-0.5">{activity.title}</p>
          <p className="text-xs text-stone-500">
            {activity.place_name} ({activity.start_time} - {activity.end_time})
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Custom Wish / Preference (Optional)
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., 'Prefer a cozy quiet cafe with matcha', or 'Looking for an outdoor scenic photo spot instead'"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>AI will preserve the exact time window and nearby location.</span>
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
                <span>Finding alternative...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Find & Swap Alternative</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SwapActivityDialog;
