import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlanProvider } from './context/PlanContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlanGuard } from './components/PlanGuard';
import PublicLayout from './components/PublicLayout';
import SidebarLayout from './components/SidebarLayout';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import CoachesPage from './pages/admin/CoachesPage';
import AdminPlansPage from './pages/admin/AdminPlansPage';
import ExerciseLibraryPage from './pages/admin/ExerciseLibraryPage';
import ConsultationsPage from './pages/admin/ConsultationsPage';
import ClientsPage from './pages/admin/ClientsPage';
import UsersPage from './pages/admin/UsersPage';
import RoutinesPage from './pages/admin/RoutinesPage';

import CoachDashboard from './pages/coach/CoachDashboard';
import CoachClientsPage from './pages/coach/CoachClientsPage';
import CoachRoutinesPage from './pages/coach/CoachRoutinesPage';
import CoachRoutineDetailPage from './pages/coach/CoachRoutineDetailPage';
import CoachCalendarPage from './pages/coach/CoachCalendarPage';
import CoachExerciseLibraryPage from './pages/coach/CoachExerciseLibraryPage';
import CoachWeightPage from './pages/coach/CoachWeightPage';
import CoachConsultationsPage from './pages/coach/CoachConsultationsPage';
import CoachSupportPage from './pages/coach/CoachSupportPage';

import ClientDashboard from './pages/client/ClientDashboard';
import ClientRoutinesPage from './pages/client/ClientRoutinesPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClientCalendarPage from './pages/client/ClientCalendarPage';
import ClientSeguimientoPage from './pages/client/ClientSeguimientoPage';
import ClientConsultationsPage from './pages/client/ClientConsultationsPage';

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
          <Route path="coaches" element={<CoachesPage />} />
          <Route path="alumnos" element={<ClientsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="rutinas" element={<RoutinesPage />} />
          <Route path="planes" element={<AdminPlansPage />} />
          <Route path="biblioteca-ejercicios" element={<ExerciseLibraryPage />} />
          <Route path="consultas" element={<ConsultationsPage />} />
        </Route>

        <Route path="/coach" element={
          <ProtectedRoute allowedRoles={['coach']}>
            <SidebarLayout basePath="/coach" role="coach" />
          </ProtectedRoute>
        }>
          <Route index element={<CoachDashboard />} />
          <Route path="calendario" element={<CoachCalendarPage />} />
          <Route path="alumnos" element={<CoachClientsPage />} />
          <Route path="alumnos/:clientId" element={<CoachClientsPage />} />
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
      </PlanProvider>
    </AuthProvider>
  );
}
