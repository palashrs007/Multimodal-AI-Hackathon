import React from 'react';
import { Compass, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200/80 bg-white/70 backdrop-blur-sm py-8 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-stone-800">
              Wander<span className="text-coral-500">Shot</span>
            </span>
            <span className="text-xs text-stone-400">© {new Date().getFullYear()}</span>
          </div>

          <p className="text-xs text-stone-500 text-center sm:text-right">
            Turn social screenshots into reality with multimodal Gemini AI. Always check local guidelines and book in advance.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
