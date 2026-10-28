import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { EquipmentListPage } from '@/pages/inventory/EquipmentListPage';
import { EquipmentDetailPage } from '@/pages/inventory/EquipmentDetailPage';
import { LaboratoryListPage } from '@/pages/inventory/LaboratoryListPage';
import { MyReservationsPage } from '@/pages/reservation/MyReservationsPage';
import { ApprovalsQueuePage } from '@/pages/reservation/ApprovalsQueuePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Authenticated Application Routes */}
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/equipment"
        element={
          <ProtectedRoute>
            <EquipmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/equipment/:id"
        element={
          <ProtectedRoute>
            <EquipmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/laboratories"
        element={
          <ProtectedRoute>
            <LaboratoryListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/reservations"
        element={
          <ProtectedRoute>
            <MyReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/approvals"
        element={
          <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_LAB_ASSISTANT']}>
            <ApprovalsQueuePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback to Public Landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
