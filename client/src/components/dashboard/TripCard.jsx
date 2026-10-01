import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { TripActionsMenu } from './TripActionsMenu.jsx';
import { Modal } from '../shared/Modal.jsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.jsx';
import { MapPin, Calendar, Wallet, Sparkles, Image as ImageIcon } from 'lucide-react';

export function TripCard({ trip, onDelete, onDuplicate, onUpdateTitle }) {
  const navigate = useNavigate();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(trip.title);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = {
    draft: { label: 'Draft', bg: 'bg-stone-100 text-stone-700 border-stone-200' },
    analyzing: { label: 'Analyzing Vision...', bg: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' },
    review: { label: 'Ready to Review', bg: 'bg-sky-100 text-sky-800 border-sky-300' },
    generating: { label: 'Generating Plan...', bg: 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse' },
    ready: { label: 'Itinerary Ready', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    error: { label: 'Needs Attention', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
  };

  const statusBadge = statusConfig[trip.status] || statusConfig.draft;

  // Destination destination URL:
  // If status is analyzing or review -> goes to /trips/:id/review
  // If status is ready -> goes to /trips/:id/itinerary
  const targetUrl =
    trip.status === 'ready'
      ? `/trips/${trip.id}/itinerary`
      : `/trips/${trip.id}/review`;

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle.trim() !== trip.title) {
      await onUpdateTitle(trip.id, newTitle.trim());
    }
    setIsRenameOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await onDelete(trip.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="group relative bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
        {/* Cover thumbnail */}
        <Link to={targetUrl} className="relative h-44 w-full bg-stone-100 overflow-hidden block">
          {trip.cover_image_url ? (
            <img
              src={trip.cover_image_url}
              alt={trip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-stone-100 to-brand-50 text-stone-400">
              <ImageIcon className="w-8 h-8 stroke-[1.5] mb-1 text-stone-300" />
              <span className="text-xs font-medium">No preview image</span>
            </div>
          )}

          {/* Status badge pill */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${statusBadge.bg}`}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Screenshot count chip */}
          {trip.images_count > 0 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-stone-900/70 backdrop-blur-md text-white text-[11px] font-semibold flex items-center space-x-1">
              <ImageIcon className="w-3 h-3" />
              <span>{trip.images_count} screens</span>
            </div>
          )}
        </Link>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <Link to={targetUrl} className="flex-1">
                <h3 className="text-base font-bold text-stone-900 line-clamp-1 group-hover:text-coral-600 transition-colors">
                  {trip.title}
                </h3>
              </Link>
              <TripActionsMenu
                onRename={() => setIsRenameOpen(true)}
                onDuplicate={() => onDuplicate(trip.id)}
                onDelete={() => setIsDeleteOpen(true)}
              />
            </div>

            {(trip.destination || trip.destination_hint) && (
              <div className="flex items-center space-x-1 text-xs text-stone-500 mb-3">
                <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span className="truncate">{trip.destination || trip.destination_hint}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-medium">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{formatDuration(trip.duration_days)}</span>
            </div>

            <div className="flex items-center space-x-1.5 font-bold text-stone-900">
              <Wallet className="w-3.5 h-3.5 text-coral-500" />
              <span>{formatCurrency(trip.budget_amount, trip.budget_currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <Modal isOpen={isRenameOpen} onClose={() => setIsRenameOpen(false)} title="Rename Trip">
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Trip Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={80}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRenameOpen(false)}
              className="px-4 py-2 text-sm text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-coral-500 hover:bg-coral-600 rounded-xl shadow-sm"
            >
              Save Title
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete this Trip?"
        message={`Are you sure you want to permanently delete "${trip.title}" and its uploaded screenshots? This action cannot be reversed.`}
        confirmText="Delete Trip"
        isDestructive={true}
        loading={isDeleting}
      />
    </>
  );
}

export default TripCard;
