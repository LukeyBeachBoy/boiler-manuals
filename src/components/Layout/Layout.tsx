import { useState } from 'react';
import { observer } from '@legendapp/state/react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { auth$, signOut } from '../../store/auth';
import styles from './Layout.module.css';

export const Layout = observer(function Layout() {
  const user = auth$.user.get();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
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
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
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
});
