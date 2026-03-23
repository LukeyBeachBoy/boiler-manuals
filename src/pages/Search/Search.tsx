import { useEffect, useRef } from 'react';
import { observer } from '@legendapp/state/react';
import { Link, useSearchParams } from 'react-router-dom';
import { search$, performSearch, clearSearch } from '../../store/search';
import { getManualSignedUrl } from '../../store/manuals';
import styles from './Search.module.css';

export const SearchPage = observer(function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const didSearch = useRef('');

  const manufacturers = search$.manufacturers.get();
  const models = search$.models.get();
  const variants = search$.variants.get();
  const manuals = search$.manuals.get();
  const loading = search$.loading.get();
  const searched = search$.searched.get();

  useEffect(() => {
    if (q && q !== didSearch.current) {
      didSearch.current = q;
      performSearch(q);
    }
    return () => { clearSearch(); };
  }, [q]);

  const totalResults = manufacturers.length + models.length + variants.length + manuals.length;

  const handleDownload = async (filePath: string) => {
    const url = await getManualSignedUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  if (!q) {
    return (
      <div className={styles.empty}>
        <p>Enter a search term to find manufacturers, models, variants, or manuals.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.heading}>
        {loading ? 'Searching...' : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${q}"`}
      </h1>

      {searched && !loading && totalResults === 0 && (
        <p className={styles.noResults}>No results found. Try a different search term.</p>
      )}

      {manufacturers.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.icon}>🏭</span> Manufacturers
            <span className={styles.count}>{manufacturers.length}</span>
          </h2>
          <ul className={styles.list}>
            {manufacturers.map((m) => (
              <li key={m.id} className={styles.item}>
                <Link to={`/manufacturer/${m.id}`} className={styles.link}>
                  <span className={styles.name}>{m.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {models.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.icon}>📋</span> Models
            <span className={styles.count}>{models.length}</span>
          </h2>
          <ul className={styles.list}>
            {models.map((m) => (
              <li key={m.id} className={styles.item}>
                <Link to={`/model/${m.id}`} className={styles.link}>
                  <span className={styles.name}>{m.name}</span>
                  <span className={styles.meta}>{m.manufacturers.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {variants.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.icon}>🔧</span> Variants
            <span className={styles.count}>{variants.length}</span>
          </h2>
          <ul className={styles.list}>
            {variants.map((v) => (
              <li key={v.id} className={styles.item}>
                <Link to={`/model/${v.model_id}`} className={styles.link}>
                  <span className={styles.name}>{v.name}</span>
                  <span className={styles.gc}>GC {v.gc_number}</span>
                  <span className={styles.meta}>
                    {v.models.manufacturers.name} › {v.models.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {manuals.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.icon}>📄</span> Manuals
            <span className={styles.count}>{manuals.length}</span>
          </h2>
          <ul className={styles.list}>
            {manuals.map((m) => (
              <li key={m.id} className={styles.item}>
                <div className={styles.manualRow}>
                  <button
                    onClick={() => handleDownload(m.file_path)}
                    className={styles.manualLink}
                  >
                    {m.title}
                  </button>
                  <span className={styles.meta}>
                    {m.models.manufacturers.name} › {m.models.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
});
