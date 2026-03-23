import { useState } from 'react';
import { observer } from '@legendapp/state/react';
import { auth$, signIn } from '../../store/auth';
import styles from './LoginForm.module.css';

export const LoginForm = observer(function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loading = auth$.loading.get();
  const error = auth$.error.get();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>🔥 Boiler Manuals</h1>
      <p className={styles.subtitle}>Sign in to continue</p>

      {error && <div className={styles.error}>{error}</div>}

      <label className={styles.label}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
          autoFocus
        />
      </label>

      <label className={styles.label}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
      </label>

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
});
