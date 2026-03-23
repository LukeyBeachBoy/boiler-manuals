import { observer } from '@legendapp/state/react';
import { Navigate } from 'react-router-dom';
import { auth$ } from '../../store/auth';
import { LoginForm } from '../../components/LoginForm';
import styles from './Login.module.css';

export const LoginPage = observer(function LoginPage() {
  const user = auth$.user.get();
  const loading = auth$.loading.get();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
});
