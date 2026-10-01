import React from 'react';
import { TripCard } from './TripCard.jsx';
import { TripCardSkeleton } from '../shared/Skeleton.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { NewTripButton } from './NewTripButton.jsx';
import { Compass } from 'lucide-react';

export function TripGrid({
  trips = [],
  loading = false,
  onDelete,
  onDuplicate,
  onUpdateTitle,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <TripCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="No trips created yet"
        description="Describe your dream vacation, pick your destination, and let multimodal AI build your perfect plan."
        action={<NewTripButton size="lg" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onUpdateTitle={onUpdateTitle}
        />
      ))}
    </div>
  );
}

export default TripGrid;
