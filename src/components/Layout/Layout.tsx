import { useObservable, useValue } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { auth$, signOut } from '../../store/auth';
import styles from './Layout.module.css';

export function Layout() {
  const user = useValue(auth$.user);
  const navigate = useNavigate();
  const searchValue$ = useObservable('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue$.get().trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            🔥 Boiler Manuals
          </Link>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <$React.input
              type="search"
              $value={searchValue$}
              placeholder="Search manufacturers, models, GC numbers..."
              className={styles.searchInput}
            />
          </form>
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
}
