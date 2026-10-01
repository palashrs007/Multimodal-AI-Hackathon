import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Sparkles } from 'lucide-react';

export function NewTripButton({ size = 'md', className = '' }) {
  const isLarge = size === 'lg';

  return (
    <Link
      to="/trips/new"
      className={`inline-flex items-center justify-center space-x-2 rounded-2xl font-bold text-white bg-gradient-to-r from-coral-500 via-brand-600 to-amber-500 hover:from-coral-600 hover:to-amber-600 shadow-lg shadow-coral-500/25 hover:shadow-xl hover:shadow-coral-500/30 transition-all duration-300 active:scale-[0.98] ${
        isLarge ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-sm'
      } ${className}`}
    >
      <PlusCircle className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>Create New Trip</span>
      <Sparkles className={isLarge ? 'w-4 h-4 text-amber-200' : 'w-3.5 h-3.5 text-amber-200'} />
    </Link>
  );
}

export default NewTripButton;
