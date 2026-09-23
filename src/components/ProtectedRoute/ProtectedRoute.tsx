import { useEffect } from 'react';
import { useObservable, useValue } from '@legendapp/state/react';
import { Navigate } from 'react-router-dom';
import { auth$ } from '../../store/auth';
import { supabase } from '../../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useValue(auth$.user);
  const loading = useValue(auth$.loading);
  const access$ = useObservable({ userId: '', allowed: false, checking: true });
  const access = useValue(access$);

  useEffect(() => {
    if (!user) return;
    let active = true;
    access$.checking.set(true);
    supabase.rpc('is_directory_admin').then(({ data, error }) => {
      if (!active) return;
      access$.userId.set(user.id);
      access$.allowed.set(!error && data === true);
      access$.checking.set(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (access.checking || access.userId !== user.id) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Checking admin access...</div>;
  }
  if (!access.allowed) {
    return <div role="alert" style={{ padding: 32 }}>
      This account does not have access to the manuals admin app.
      <button onClick={() => supabase.auth.signOut()} style={{ marginLeft: 12 }}>Sign out</button>
    </div>;
  }
  return <>{children}</>;
}
