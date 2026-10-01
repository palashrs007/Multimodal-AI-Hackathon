import React from 'react';
import { X, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';

export function ImagePreviewGrid({ images, onRemove, onReorder }) {
  if (!images || images.length === 0) return null;

  const moveImage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
        <span>Uploaded Screenshots ({images.length}/10)</span>
        <span className="text-[11px] normal-case text-stone-400">Use arrows to reorder importance</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-white aspect-square shadow-sm flex flex-col justify-between"
          >
            {/* Image Preview */}
            <img
              src={img.previewUrl || img.signed_url}
              alt={img.name || `Screenshot #${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Position badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold">
              #{idx + 1}
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute top-2 right-2 p-1 rounded-full bg-stone-900/80 text-white hover:bg-rose-600 transition-colors shadow-sm"
              aria-label={`Remove screenshot ${idx + 1}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Reorder arrows */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={idx === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveImage(idx, idx - 1);
                }}
                className="pointer-events-auto p-1 rounded-lg bg-stone-900/80 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition"
                aria-label="Move left"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={idx === images.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveImage(idx, idx + 1);
                }}
                className="pointer-events-auto p-1 rounded-lg bg-stone-900/80 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition"
                aria-label="Move right"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImagePreviewGrid;
