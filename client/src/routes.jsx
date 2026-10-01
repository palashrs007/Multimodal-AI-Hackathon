import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { NewTripPage } from './pages/NewTripPage.jsx';
import { ReviewPage } from './pages/ReviewPage.jsx';
import { ItineraryPage } from './pages/ItineraryPage.jsx';
import { PrintItineraryPage } from './pages/PrintItineraryPage.jsx';
import { SharedTripPage } from './pages/SharedTripPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/share/:shareToken" element={<SharedTripPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/new"
        element={
          <ProtectedRoute>
            <NewTripPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:tripId/review"
        element={
          <ProtectedRoute>
            <ReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:tripId/itinerary"
        element={
          <ProtectedRoute>
            <ItineraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/:tripId/itinerary/print"
        element={
          <ProtectedRoute>
            <PrintItineraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
