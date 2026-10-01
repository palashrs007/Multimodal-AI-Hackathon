import React, { useState, useRef, useEffect } from 'react';
import { Printer, Copy, Check, Download, ChevronDown, Share2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatTime } from '../../lib/format.js';

export function ExportMenu({ itinerary, tripId, onOpenShare }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleCopyText = () => {
    if (!itinerary) return;

    let text = `✈️ ${itinerary.title}\n📍 Destination: ${itinerary.destination}\n💰 Total Est. Cost: ${formatCurrency(itinerary.total_estimated_cost, itinerary.currency)}\n\n`;
    text += `${itinerary.summary}\n\n`;

    (itinerary.days || []).forEach((day) => {
      text += `📅 DAY ${day.day_number}: ${day.title} (${formatCurrency(day.daily_estimated_cost, itinerary.currency)})\n`;
      if (day.theme) text += `   Theme: ${day.theme}\n`;
      (day.activities || []).forEach((act) => {
        text += `   • ${formatTime(act.start_time)} - ${formatTime(act.end_time)}: ${act.title} @ ${act.place_name} [${formatCurrency(act.estimated_cost, itinerary.currency)}]\n`;
        if (act.description) text += `     ${act.description}\n`;
      });
      text += '\n';
    });

    if (itinerary.general_tips && itinerary.general_tips.length > 0) {
      text += `💡 TIPS:\n`;
      itinerary.general_tips.forEach((t) => (text += `   - ${t}\n`));
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Itinerary copied to clipboard as text!');
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const handlePrint = () => {
    setOpen(false);
    navigate(`/trips/${tripId}/itinerary/print`);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div className="inline-flex rounded-2xl shadow-sm border border-stone-200 overflow-hidden bg-white">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-stone-500" />
          <span>Print / PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-2 py-2 border-l border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition"
          aria-label="More export options"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-30 animate-slide-up text-left">
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? 'Copied Text' : 'Copy as Text'}</span>
          </button>

          {onOpenShare && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenShare();
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              <Share2 className="w-3.5 h-3.5 text-stone-400" />
              <span>Share Itinerary Link</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
