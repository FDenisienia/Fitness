import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlanProvider } from './context/PlanContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlanGuard } from './components/PlanGuard';
import PublicLayout from './components/PublicLayout';
import WhatsAppFloatButton from './components/WhatsAppFloatButton';
import SidebarLayout from './components/SidebarLayout';
import LoadingSpinner from './components/LoadingSpinner';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage'));
const ExerciseLibraryPage = lazy(() => import('./pages/admin/ExerciseLibraryPage'));
const ConsultationsPage = lazy(() => import('./pages/admin/ConsultationsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const RoutinesPage = lazy(() => import('./pages/admin/RoutinesPage'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));

const CoachDashboard = lazy(() => import('./pages/coach/CoachDashboard'));
const CoachRoutinesPage = lazy(() => import('./pages/coach/CoachRoutinesPage'));
const CoachRoutineDetailPage = lazy(() => import('./pages/coach/CoachRoutineDetailPage'));
const CoachCalendarPage = lazy(() => import('./pages/coach/CoachCalendarPage'));
const CoachExerciseLibraryPage = lazy(() => import('./pages/coach/CoachExerciseLibraryPage'));
const CoachWeightPage = lazy(() => import('./pages/coach/CoachWeightPage'));
const CoachConsultationsPage = lazy(() => import('./pages/coach/CoachConsultationsPage'));
const CoachSupportPage = lazy(() => import('./pages/coach/CoachSupportPage'));

const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const ClientRoutinesPage = lazy(() => import('./pages/client/ClientRoutinesPage'));
const ClientProfilePage = lazy(() => import('./pages/client/ClientProfilePage'));
const ClientCalendarPage = lazy(() => import('./pages/client/ClientCalendarPage'));
const ClientSeguimientoPage = lazy(() => import('./pages/client/ClientSeguimientoPage'));
const ClientConsultationsPage = lazy(() => import('./pages/client/ClientConsultationsPage'));

function RedirectCoachAlumnosToUsuarios() {
  const { clientId } = useParams();
  return <Navigate to={clientId ? `/coach/usuarios/${clientId}` : '/coach/usuarios'} replace />;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'coach') return <Navigate to="/coach" replace />;
  return <Navigate to="/cliente" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <PlanProvider>
      <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SidebarLayout basePath="/admin" role="admin" />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="coaches" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="rutinas" element={<RoutinesPage />} />
          <Route path="planes" element={<AdminPlansPage />} />
          <Route path="biblioteca-ejercicios" element={<ExerciseLibraryPage />} />
          <Route path="consultas" element={<ConsultationsPage />} />
          <Route path="perfil" element={<AdminProfilePage />} />
        </Route>

        <Route path="/coach" element={
          <ProtectedRoute allowedRoles={['coach']}>
            <SidebarLayout basePath="/coach" role="coach" />
          </ProtectedRoute>
        }>
          <Route index element={<CoachDashboard />} />
          <Route path="calendario" element={<CoachCalendarPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="usuarios/:clientId" element={<UsersPage />} />
          <Route path="alumnos" element={<RedirectCoachAlumnosToUsuarios />} />
          <Route path="alumnos/:clientId" element={<RedirectCoachAlumnosToUsuarios />} />
          <Route path="seguimiento" element={<PlanGuard feature="hasWeightTracking"><CoachWeightPage /></PlanGuard>} />
          <Route path="seguimiento/:clientId" element={<PlanGuard feature="hasWeightTracking"><CoachWeightPage /></PlanGuard>} />
          <Route path="rutinas" element={<CoachRoutinesPage />} />
          <Route path="rutinas/:routineId" element={<CoachRoutineDetailPage />} />
          <Route path="biblioteca-ejercicios" element={<CoachExerciseLibraryPage />} />
          <Route path="consultas" element={<CoachConsultationsPage />} />
          <Route path="soporte" element={<CoachSupportPage />} />
        </Route>

        <Route path="/cliente" element={
          <ProtectedRoute allowedRoles={['cliente']}>
            <SidebarLayout basePath="/cliente" role="cliente" />
          </ProtectedRoute>
        }>
          <Route index element={<ClientDashboard />} />
          <Route path="calendario" element={<ClientCalendarPage />} />
          <Route path="rutinas" element={<ClientRoutinesPage />} />
          <Route path="rutinas/:routineId" element={<ClientRoutinesPage />} />
          <Route path="seguimiento" element={<ClientSeguimientoPage />} />
          <Route path="perfil" element={<ClientProfilePage />} />
          <Route path="consultas" element={<ClientConsultationsPage />} />
        </Route>

        <Route path="/dashboard" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      <WhatsAppFloatButton />
      </PlanProvider>
    </AuthProvider>
  );
}
