import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from './useToast.jsx';

export function useItinerary(tripId, selectedVersion = null) {
  const [itinerary, setItinerary] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchVersions = useCallback(async () => {
    if (!tripId) return;
    try {
      const data = await apiClient.get(`/trips/${tripId}/itineraries`);
      setVersions(data || []);
      return data;
    } catch {
      // ignore
    }
  }, [tripId]);

  const fetchItinerary = useCallback(
    async (version = selectedVersion) => {
      if (!tripId) return;
      try {
        setLoading(true);
        setError(null);
        const endpoint = version
          ? `/trips/${tripId}/itineraries/${version}`
          : `/trips/${tripId}/itineraries/1`; // latest version default
        const data = await apiClient.get(endpoint);
        setItinerary(data);
        await fetchVersions();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchVersions, selectedVersion, tripId]
  );

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const generateNewVersion = async () => {
    try {
      setGenerating(true);
      const data = await apiClient.post(`/trips/${tripId}/itinerary/generate`);
      setItinerary(data);
      await fetchVersions();
      toast.success(`Itinerary v${data.version} created successfully!`);
      return data;
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const regenerateDay = async (dayId, instruction) => {
    if (!itinerary) return;
    try {
      setLoading(true);
      const updated = await apiClient.post(
        `/itineraries/${itinerary.id}/days/${dayId}/regenerate`,
        { instruction }
      );
      setItinerary(updated);
      toast.success('Day regenerated with new recommendations');
    } catch (err) {
      toast.error(`Could not regenerate day: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const swapActivity = async (activityId, instruction) => {
    if (!itinerary) return;
    try {
      setLoading(true);
      const updated = await apiClient.post(
        `/itineraries/${itinerary.id}/activities/${activityId}/swap`,
        { instruction }
      );
      setItinerary(updated);
      toast.success('Activity swapped with curated alternative');
    } catch (err) {
      toast.error(`Could not swap activity: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = async (activityId, updates) => {
    if (!itinerary) return;
    try {
      const updated = await apiClient.patch(
        `/itineraries/${itinerary.id}/activities/${activityId}`,
        updates
      );
      setItinerary(updated);
      toast.success('Activity updated');
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
      throw err;
    }
  };

  const deleteActivity = async (activityId) => {
    if (!itinerary) return;
    // Optimistic delete
    const prevItinerary = { ...itinerary };
    try {
      const updated = await apiClient.delete(
        `/itineraries/${itinerary.id}/activities/${activityId}`
      );
      setItinerary(updated);
      toast.success('Activity deleted');
    } catch (err) {
      setItinerary(prevItinerary);
      toast.error(`Failed to delete activity: ${err.message}`);
      throw err;
    }
  };

  const reorderActivities = async (dayId, orderedIds) => {
    if (!itinerary) return;
    const prevItinerary = { ...itinerary };

    // Optimistic UI update
    setItinerary((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d) => {
        if (d.id !== dayId) return d;
        const actMap = new Map(d.activities.map((a) => [a.id, a]));
        const sorted = orderedIds.map((id, idx) => ({
          ...actMap.get(id),
          sort_order: idx + 1,
        }));
        return { ...d, activities: sorted };
      });
      return { ...prev, days };
    });

    try {
      const updated = await apiClient.post(
        `/itineraries/${itinerary.id}/days/${dayId}/reorder`,
        { orderedActivityIds: orderedIds }
      );
      setItinerary(updated);
    } catch (err) {
      // Rollback on failure
      setItinerary(prevItinerary);
      toast.error(`Reorder failed: ${err.message}`);
    }
  };

  const createShare = async () => {
    try {
      const res = await apiClient.post(`/trips/${tripId}/share`);
      toast.success('Share link enabled!');
      return res;
    } catch (err) {
      toast.error(`Could not create share link: ${err.message}`);
      throw err;
    }
  };

  const revokeShare = async () => {
    try {
      await apiClient.delete(`/trips/${tripId}/share`);
      toast.success('Share link revoked.');
    } catch (err) {
      toast.error(`Could not revoke share link: ${err.message}`);
      throw err;
    }
  };

  return {
    itinerary,
    versions,
    loading,
    generating,
    error,
    refresh: fetchItinerary,
    generateNewVersion,
    regenerateDay,
    swapActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    createShare,
    revokeShare,
  };
}
