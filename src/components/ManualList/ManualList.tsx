import { useEffect, useRef, useState } from 'react';
import { useObservable, useValue, Show } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
import {
  manuals$,
  fetchManualsByModel,
  uploadManual,
  deleteManual,
  getManualSignedUrl,
} from '../../store/manuals';
import { variants$ } from '../../store/variants';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Manual } from '../../types/database';
import styles from './ManualList.module.css';

interface ManualListProps {
  modelId: string;
}

export function ManualList({ modelId }: ManualListProps) {
  const items = useValue(manuals$.items);
  const variants = useValue(variants$.items);
  const loading = useValue(manuals$.loading);
  const uploading = useValue(manuals$.uploading);
  const error = useValue(manuals$.error);

  // File objects have non-serializable methods — keep as useState
  const [file, setFile] = useState<File | null>(null);
  const local$ = useObservable({
    title: '',
    selectedVariants: [] as string[],
    deleteTarget: null as Manual | null,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchManualsByModel(modelId);
  }, [modelId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = local$.title.get();
    if (!title.trim() || !file) return;
    await uploadManual(modelId, title, file, local$.selectedVariants.get());
    local$.title.set('');
    setFile(null);
    local$.selectedVariants.set([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async () => {
    const target = local$.deleteTarget.get();
    if (!target) return;
    await deleteManual(target);
    local$.deleteTarget.set(null);
  };

  const handleDownload = async (filePath: string) => {
    const newWindow = window.open('', '_blank');
    const url = await getManualSignedUrl(filePath);
    if (url && newWindow) {
      newWindow.location.href = url;
    } else {
      newWindow?.close();
    }
  };

  const toggleVariant = (id: string) => {
    local$.selectedVariants.set((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <h2 className={styles.heading}>Manuals</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleUpload} className={styles.uploadForm}>
        <$React.input
          type="text"
          $value={local$.title}
          placeholder="Manual title..."
          className={styles.input}
        />
        <input
          type="file"
          accept=".pdf"
          ref={fileRef}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={styles.fileInput}
        />
        {variants.length > 0 && (
          <div className={styles.variantSelect}>
            <span className={styles.variantLabel}>Covers variants:</span>
            <div className={styles.variantChips}>
              {variants.map((v) => (
                <$React.button
                  key={v.id}
                  type="button"
                  $className={() =>
                    `${styles.chip} ${local$.selectedVariants.get().includes(v.id) ? styles.chipActive : ''}`
                  }
                  onClick={() => toggleVariant(v.id)}
                >
                  {v.name}
                </$React.button>
              ))}
            </div>
          </div>
        )}
        <$React.button
          type="submit"
          className={styles.uploadBtn}
          $disabled={() => !local$.title.get().trim() || !file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Manual'}
        </$React.button>
      </form>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No manuals yet. Upload one above.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((m: any) => (
            <li key={m.id} className={styles.item}>
              <div className={styles.manualInfo}>
                <button
                  onClick={() => handleDownload(m.file_path)}
                  className={styles.manualTitle}
                >
                  📄 {m.title}
                </button>
                <div className={styles.meta}>
                  {m.file_size && (
                    <span className={styles.size}>{formatSize(m.file_size)}</span>
                  )}
                  {m.manual_variants?.length > 0 && (
                    <span className={styles.covers}>
                      Covers:{' '}
                      {m.manual_variants
                        .map((mv: any) => mv.variants?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => local$.deleteTarget.set(m)}
                className={styles.deleteBtn}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <Show if={() => !!local$.deleteTarget.get()}>
        {() => {
          const target = local$.deleteTarget.get();
          return (
            <ConfirmDialog
              open={true}
              title="Delete Manual"
              message={`Delete "${target?.title}"? The PDF file will also be removed.`}
              onConfirm={handleDelete}
              onCancel={() => local$.deleteTarget.set(null)}
            />
          );
        }}
      </Show>
    </div>
  );
}
