import { useValue } from '@legendapp/state/react';
import { Navigate } from 'react-router-dom';
import { auth$ } from '../../store/auth';
import { LoginForm } from '../../components/LoginForm';
import styles from './Login.module.css';

export function LoginPage() {
  const user = useValue(auth$.user);
  const loading = useValue(auth$.loading);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
}
