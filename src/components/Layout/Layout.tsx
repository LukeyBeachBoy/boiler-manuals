import { observer } from '@legendapp/state/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { auth$, signOut } from '../../store/auth';
import styles from './Layout.module.css';

export const Layout = observer(function Layout() {
  const user = auth$.user.get();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            🔥 Boiler Manuals
          </Link>
          {user && (
            <div className={styles.headerRight}>
              <span className={styles.email}>{user.email}</span>
              <button onClick={handleSignOut} className={styles.signOutBtn}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
});
