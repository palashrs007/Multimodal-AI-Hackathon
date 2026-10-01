import React, { useState } from 'react';
import { Modal } from '../shared/Modal.jsx';
import { Share2, Copy, Check, Globe, ShieldCheck, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { Spinner } from '../shared/Spinner.jsx';

export function ShareDialog({ isOpen, onClose, trip, onEnableShare, onRevokeShare }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!trip) return null;

  const shareToken = trip.share_token;
  const isShared = trip.is_shared && Boolean(shareToken);
  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : '';

  const handleToggle = async () => {
    try {
      setLoading(true);
      if (isShared) {
        await onRevokeShare();
      } else {
        await onEnableShare();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Itinerary" maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start space-x-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200">
          <Globe className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 leading-relaxed">
            Public share links give anyone with the link <strong>read-only access</strong> to this itinerary and sanitized screenshot thumbnails. Your email, notes, and private profile are never revealed.
          </div>
        </div>

        {/* Share link box */}
        {isShared ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Secret Share Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs text-stone-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Link is active & accessible</span>
              </span>

              <button
                type="button"
                onClick={handleToggle}
                disabled={loading}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revoke Link</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-stone-500">
              Sharing is currently disabled for this trip. Generate a secure, unguessable link to share with friends or family.
            </p>
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-coral-500 to-brand-600 hover:from-coral-600 hover:to-brand-700 shadow-md shadow-coral-500/20 transition active:scale-98 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Create Public Share Link</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ShareDialog;
