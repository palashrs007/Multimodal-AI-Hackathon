import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from './useToast.jsx';

export function useTrip(tripId) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);
  const toast = useToast();

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      setError(null);
      const data = await apiClient.get(`/trips/${tripId}`);
      setTrip(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchTrip]);

  // Polling helper when trip is in transient states (analyzing, generating)
  const startPolling = useCallback((targetStatus, onComplete) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await apiClient.get(`/trips/${tripId}`);
        setTrip(data);
        if (data.status === targetStatus || data.status === 'review' || data.status === 'ready' || data.status === 'error') {
          clearInterval(pollTimerRef.current);
          if (onComplete) onComplete(data);
        }
      } catch {
        // keep polling
      }
    }, 2500);
  }, [tripId]);

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      await apiClient.post(`/trips/${tripId}/analyze`);
      await fetchTrip();
      toast.success('Screenshots analyzed and places extracted!');
    } catch (err) {
      toast.error(`Analysis failed: ${err.message}`);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  };

  const updatePlace = async (placeId, updates) => {
    try {
      const updated = await apiClient.patch(`/trips/${tripId}/places/${placeId}`, updates);
      setTrip((prev) => {
        if (!prev) return prev;
        const newPlaces = (prev.extracted_places || []).map((p) =>
          p.id === placeId ? { ...p, ...updated } : p
        );
        return { ...prev, extracted_places: newPlaces };
      });
      toast.success('Place updated');
    } catch (err) {
      toast.error(`Failed to update place: ${err.message}`);
      throw err;
    }
  };

  const addPlace = async (placeData) => {
    try {
      const created = await apiClient.post(`/trips/${tripId}/places`, placeData);
      setTrip((prev) => ({
        ...prev,
        extracted_places: [...(prev.extracted_places || []), created],
      }));
      toast.success('New place added');
      return created;
    } catch (err) {
      toast.error(`Failed to add place: ${err.message}`);
      throw err;
    }
  };

  const deletePlace = async (placeId) => {
    try {
      await apiClient.delete(`/trips/${tripId}/places/${placeId}`);
      setTrip((prev) => ({
        ...prev,
        extracted_places: (prev.extracted_places || []).filter((p) => p.id !== placeId),
      }));
      toast.success('Place removed');
    } catch (err) {
      toast.error(`Failed to remove place: ${err.message}`);
      throw err;
    }
  };

  const updateTripDetails = async (updates) => {
    try {
      const updated = await apiClient.patch(`/trips/${tripId}`, updates);
      setTrip((prev) => ({ ...prev, ...updated }));
      toast.success('Trip constraints updated');
    } catch (err) {
      toast.error(`Failed to update trip: ${err.message}`);
      throw err;
    }
  };

  return {
    trip,
    loading,
    analyzing,
    error,
    refresh: fetchTrip,
    runAnalysis,
    updatePlace,
    addPlace,
    deletePlace,
    updateTripDetails,
    startPolling,
  };
}
