import React, { useState } from 'react';
import { PLACE_CATEGORIES, CATEGORY_LABELS } from '../../schemas/common.js';
import { Modal } from '../shared/Modal.jsx';

export function ActivityEditor({ isOpen, onClose, activity, currency = 'INR', onSave }) {
  if (!activity) return null;

  const [title, setTitle] = useState(activity.title || '');
  const [placeName, setPlaceName] = useState(activity.place_name || '');
  const [category, setCategory] = useState(activity.category || 'other');
  const [startTime, setStartTime] = useState(activity.start_time || '09:00');
  const [endTime, setEndTime] = useState(activity.end_time || '11:00');
  const [estimatedCost, setEstimatedCost] = useState(activity.estimated_cost || 0);
  const [description, setDescription] = useState(activity.description || '');
  const [tips, setTips] = useState(activity.tips || '');
  const [bookingRecommended, setBookingRecommended] = useState(activity.booking_recommended || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(activity.id, {
      title: title.trim(),
      place_name: placeName.trim(),
      category,
      start_time: startTime,
      end_time: endTime,
      estimated_cost: Number(estimatedCost),
      description: description.trim(),
      tips: tips.trim() || null,
      booking_recommended: bookingRecommended,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Activity Details" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Place / Venue Name *
            </label>
            <input
              type="text"
              required
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Start Time (24h)
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              End Time (24h)
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Cost ({currency})
            </label>
            <input
              type="number"
              min={0}
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
            >
              {PLACE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] || c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="booking-checkbox"
              checked={bookingRecommended}
              onChange={(e) => setBookingRecommended(e.target.checked)}
              className="w-4 h-4 rounded text-coral-500 focus:ring-coral-400"
            />
            <label htmlFor="booking-checkbox" className="text-xs font-bold text-stone-700">
              Advance Reservation Recommended
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
            Traveler Tip (Optional)
          </label>
          <input
            type="text"
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            placeholder="e.g. Bring exact cash or visit during sunset"
            className="w-full px-3 py-2 text-sm border rounded-xl"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-coral-500 hover:bg-coral-600 rounded-xl shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ActivityEditor;
