import React from 'react';

export function Skeleton({ className = '', variant = 'rect' }) {
  const variantStyles = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      className={`animate-pulse bg-stone-200 ${variantStyles[variant] || ''} ${className}`}
      aria-hidden="true"
    />
  );
}

export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-sm space-y-3">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="space-y-2 pt-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function ItinerarySkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default Skeleton;
