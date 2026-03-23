import { useState, useEffect, useRef } from 'react';
import { observer } from '@legendapp/state/react';
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

export const ManualList = observer(function ManualList({ modelId }: ManualListProps) {
  const items = manuals$.items.get();
  const variants = variants$.items.get();
  const loading = manuals$.loading.get();
  const uploading = manuals$.uploading.get();
  const error = manuals$.error.get();

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Manual | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchManualsByModel(modelId);
  }, [modelId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    await uploadManual(modelId, title, file, selectedVariants);
    setTitle('');
    setFile(null);
    setSelectedVariants([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteManual(deleteTarget);
    setDeleteTarget(null);
  };

  const handleDownload = async (filePath: string) => {
    const url = await getManualSignedUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  const toggleVariant = (id: string) => {
    setSelectedVariants((prev) =>
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
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
                <button
                  key={v.id}
                  type="button"
                  className={`${styles.chip} ${selectedVariants.includes(v.id) ? styles.chipActive : ''}`}
                  onClick={() => toggleVariant(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="submit"
          className={styles.uploadBtn}
          disabled={!title.trim() || !file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Manual'}
        </button>
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
                onClick={() => setDeleteTarget(m)}
                className={styles.deleteBtn}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Manual"
        message={`Delete "${deleteTarget?.title}"? The PDF file will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
});
