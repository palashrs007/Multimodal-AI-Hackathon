import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { useToast } from './useToast.jsx';

export function useTrips(initialPage = 1, limit = 12) {
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchTrips = useCallback(async (p = page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/trips?page=${p}&limit=${limit}`);
      setTrips(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load trips: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [limit, page, toast]);

  useEffect(() => {
    fetchTrips(page);
  }, [page]);

  const deleteTrip = async (tripId) => {
    try {
      await apiClient.delete(`/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success('Trip deleted successfully');
    } catch (err) {
      toast.error(`Could not delete trip: ${err.message}`);
      throw err;
    }
  };

  const duplicateTrip = async (tripId) => {
    try {
      const res = await apiClient.post(`/trips/${tripId}/duplicate`);
      toast.success('Trip duplicated successfully');
      fetchTrips(1);
      return res.tripId;
    } catch (err) {
      toast.error(`Could not duplicate trip: ${err.message}`);
      throw err;
    }
  };

  return {
    trips,
    total,
    page,
    setPage,
    loading,
    error,
    refresh: fetchTrips,
    deleteTrip,
    duplicateTrip,
  };
}
