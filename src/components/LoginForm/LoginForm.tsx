import { useObservable, useValue } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
import { auth$, signIn } from '../../store/auth';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const local$ = useObservable({ email: '', password: '' });
  const loading = useValue(auth$.loading);
  const error = useValue(auth$.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(local$.email.get(), local$.password.get());
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>🔥 Boiler Manuals</h1>
      <p className={styles.subtitle}>Sign in to continue</p>

      {error && <div className={styles.error}>{error}</div>}

      <label className={styles.label}>
        Email
        <$React.input
          type="email"
          $value={local$.email}
          className={styles.input}
          required
          autoFocus
        />
      </label>

      <label className={styles.label}>
        Password
        <$React.input
          type="password"
          $value={local$.password}
          className={styles.input}
          required
        />
      </label>

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
