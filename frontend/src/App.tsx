import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RefreshCw } from 'lucide-react';

import { LandingPage } from '@/pages/LandingPage';

// Code-split authenticated application pages via dynamic imports for optimized performance and bundle size
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const ForbiddenPage = lazy(() =>
  import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage }))
);
const EquipmentListPage = lazy(() =>
  import('@/pages/inventory/EquipmentListPage').then((m) => ({ default: m.EquipmentListPage }))
);
const EquipmentDetailPage = lazy(() =>
  import('@/pages/inventory/EquipmentDetailPage').then((m) => ({ default: m.EquipmentDetailPage }))
);
const LaboratoryListPage = lazy(() =>
  import('@/pages/inventory/LaboratoryListPage').then((m) => ({ default: m.LaboratoryListPage }))
);
const MyReservationsPage = lazy(() =>
  import('@/pages/reservation/MyReservationsPage').then((m) => ({ default: m.MyReservationsPage }))
);
const ApprovalsQueuePage = lazy(() =>
  import('@/pages/reservation/ApprovalsQueuePage').then((m) => ({ default: m.ApprovalsQueuePage }))
);
const FaultInboxPage = lazy(() =>
  import('@/pages/maintenance/FaultInboxPage').then((m) => ({ default: m.FaultInboxPage }))
);
const FaultDetailPage = lazy(() =>
  import('@/pages/maintenance/FaultDetailPage').then((m) => ({ default: m.FaultDetailPage }))
);
const WorkOrdersPage = lazy(() =>
  import('@/pages/maintenance/WorkOrdersPage').then((m) => ({ default: m.WorkOrdersPage }))
);
const WorkOrderDetailPage = lazy(() =>
  import('@/pages/maintenance/WorkOrderDetailPage').then((m) => ({ default: m.WorkOrderDetailPage }))
);
const NotificationsPage = lazy(() =>
  import('@/pages/notification/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const AuditLogsPage = lazy(() =>
  import('@/pages/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
);
const DashboardPage = lazy(() =>
  import('@/pages/analytics/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ReportsPage = lazy(() =>
  import('@/pages/analytics/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);

const PageFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-muted-foreground"
  >
    <RefreshCw className="w-8 h-8 animate-spin text-accent-lime mb-3" aria-hidden="true" />
    <p className="text-sm font-medium">Loading LabLedger workspace...</p>
    <span className="sr-only">Loading page view</span>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
        <Route
          path="/app/faults"
          element={
            <ProtectedRoute>
              <FaultInboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/faults/:id"
          element={
            <ProtectedRoute>
              <FaultDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/work-orders"
          element={
            <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_LAB_ASSISTANT', 'ROLE_TECHNICIAN']}>
              <WorkOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/work-orders/:id"
          element={
            <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_LAB_ASSISTANT', 'ROLE_TECHNICIAN']}>
              <WorkOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/audit-logs"
          element={
            <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_LAB_ASSISTANT']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reports"
          element={
            <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_LAB_ASSISTANT', 'ROLE_TECHNICIAN']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback to Public Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
