import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from '../hooks/useToast.jsx';
import { CURRENCIES } from '../schemas/common.js';
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx';
import { User, Wallet, Trash2, Shield, AlertTriangle, Check } from 'lucide-react';
import { Spinner } from '../components/shared/Spinner.jsx';

export function SettingsPage() {
  const { user, profile, logout } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setDefaultCurrency(profile.default_currency || 'INR');
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.patch('/me', {
        display_name: displayName.trim(),
        default_currency: defaultCurrency,
      });
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete('/me/data');
      toast.success('All your trips and photos have been permanently removed.');
      setDeleteModalOpen(false);
      await logout();
      window.location.href = '/';
    } catch (err) {
      toast.error(`Failed to wipe data: ${err.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        title="Account & Privacy Settings"
        subtitle="Manage your traveler profile, default currency, and privacy preferences."
      />

      {/* Profile Form */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-coral-500" />
          <span>Traveler Profile</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Default Trip Currency
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-semibold"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-white bg-coral-500 hover:bg-coral-600 transition shadow-sm text-xs active:scale-98 disabled:opacity-50"
            >
              {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Privacy Notice */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-3">
        <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Data Privacy & AI Processing</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          WanderShot treats all uploaded images and personal notes as strictly confidential. Images are stripped of GPS and camera EXIF metadata prior to storage. Images and audio snippets are passed to Google Gemini models securely via server-side APIs solely to identify landmarks and constraints. We do not sell or monetize your trip data.
        </p>
      </div>

      {/* Danger Zone: Account & Data Deletion */}
      <div className="bg-rose-50/70 rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-rose-950 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-xs sm:text-sm text-rose-800 mt-1">
            Permanently delete all your trips, uploaded screenshot files, itineraries, and profile records from WanderShot databases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Wipe All My Data & Account</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAllData}
        title="Permanently Delete Everything?"
        message="This will delete every trip, every screenshot, and all custom itinerary versions from both PostgreSQL and Storage buckets. This action is irreversible."
        confirmText="Yes, Permanently Delete"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  );
}

export default SettingsPage;
