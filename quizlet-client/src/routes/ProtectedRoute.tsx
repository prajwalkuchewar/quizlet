import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

type Props = { children: React.ReactNode; adminOnly?: boolean };

const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const location = useLocation();
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
