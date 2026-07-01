import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Redirects unauthenticated users to the login page. */
export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="page empty-state">Loading...</div>;
  }

  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
