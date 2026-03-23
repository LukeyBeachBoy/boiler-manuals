import { observer } from '@legendapp/state/react';
import { Navigate } from 'react-router-dom';
import { auth$ } from '../../store/auth';

export const ProtectedRoute = observer(function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = auth$.user.get();
  const loading = auth$.loading.get();

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
});
