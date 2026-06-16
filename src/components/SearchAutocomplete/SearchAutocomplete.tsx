import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { autocompleteSearch, type AutocompleteItem } from '../../store/search';
import styles from './SearchAutocomplete.module.css';

export function SearchAutocomplete() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  // Debounced fetch on value change.
  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      return;
    }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const results = await autocompleteSearch(q);
      if (id !== reqId.current) return; // stale response
      setItems(results);
      setActive(-1);
      setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (item: AutocompleteItem) => {
    setOpen(false);
    setValue('');
    navigate(item.to);
  };

  const submitFullSearch = () => {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && items.length) { setOpen(true); return; }
      setActive((i) => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && items[active]) go(items[active]);
      else submitFullSearch();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-autocomplete-list"
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 && items[active] ? `ac-${items[active].key}` : undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => { if (items.length) setOpen(true); }}
        placeholder="Search manufacturers, models, GC numbers..."
        className={styles.input}
        autoComplete="off"
      />
      {open && (
        <ul id="search-autocomplete-list" role="listbox" className={styles.dropdown}>
          {items.length === 0 ? (
            <li className={styles.noResults}>No matches</li>
          ) : (
            items.map((item, i) => (
              <li
                key={item.key}
                id={`ac-${item.key}`}
                role="option"
                aria-selected={i === active}
                className={`${styles.option} ${i === active ? styles.active : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); go(item); }}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {item.gc && <span className={styles.gc}>GC {item.gc}</span>}
                {item.sublabel && <span className={styles.sub}>{item.sublabel}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
