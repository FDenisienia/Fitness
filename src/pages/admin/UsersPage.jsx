import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CoachesPage from './CoachesPage';
import CoachClientsPage from '../coach/CoachClientsPage';

/**
 * Vista "Usuarios" unificada: título según rol; datos filtrados solo en backend.
 * - admin: solo coaches que él creó (CoachesPage embebida; no listado de alumnos)
 * - coach: mis clientes (CoachClientsPage)
 */
export default function UsersPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === 'admin') {
    return (
      <div>
        <div className="mb-4">
          <h2 className="mb-1">Coaches</h2>
          <p className="text-muted mb-0">Solo los coaches que has dado de alta en la plataforma.</p>
        </div>
        <CoachesPage embedded />
      </div>
    );
  }

  if (user.role === 'coach') {
    return (
      <div>
        <div className="mb-4">
          <h2 className="mb-1">Mis clientes</h2>
          <p className="text-muted mb-0">Alumnos asignados a tu cuenta.</p>
        </div>
        <CoachClientsPage embedded basePath="/coach/usuarios" />
      </div>
    );
  }

  return <Navigate to="/" replace />;
}
