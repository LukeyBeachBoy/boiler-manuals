import { useValue } from '@legendapp/state/react';
import { Navigate } from 'react-router-dom';
import { auth$ } from '../../store/auth';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useValue(auth$.user);
  const loading = useValue(auth$.loading);

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
