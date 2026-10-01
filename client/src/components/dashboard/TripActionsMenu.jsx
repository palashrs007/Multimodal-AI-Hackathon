import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Copy, Trash2, Edit3 } from 'lucide-react';

export function TripActionsMenu({ onRename, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition focus:outline-none"
        aria-label="Trip actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-30 animate-slide-up text-left">
          {onRename && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onRename();
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-400" />
              <span>Rename Trip</span>
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onDuplicate();
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>Duplicate</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Trip</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TripActionsMenu;
