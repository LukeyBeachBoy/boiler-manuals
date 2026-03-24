import { useEffect } from 'react';
import { useObservable, useValue } from '@legendapp/state/react';
import { Link } from 'react-router-dom';
import {
  models$,
  fetchModelsByManufacturer,
  createModel,
  updateModel,
  deleteModel,
} from '../../store/models';
import { ConfirmDialog } from '../ConfirmDialog';
import styles from './ModelList.module.css';

interface ModelListProps {
  manufacturerId: string;
}

export function ModelList({ manufacturerId }: ModelListProps) {
  const items = useValue(models$.items);
  const loading = useValue(models$.loading);
  const error = useValue(models$.error);

  const local$ = useObservable({
    newName: '',
    editId: null as string | null,
    editName: '',
    deleteId: null as string | null,
  });
  const newName = useValue(local$.newName);
  const editId = useValue(local$.editId);
  const editName = useValue(local$.editName);
  const deleteId = useValue(local$.deleteId);

  useEffect(() => {
    fetchModelsByManufacturer(manufacturerId);
  }, [manufacturerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createModel(manufacturerId, newName);
    local$.newName.set('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName.trim()) return;
    await updateModel(editId, editName);
    local$.editId.set(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteModel(deleteId);
    local$.deleteId.set(null);
  };

  const deleteTarget = items.find((m) => m.id === deleteId);

  return (
    <div>
      <h2 className={styles.heading}>Models</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} className={styles.addForm}>
        <input
          type="text"
          value={newName}
          onChange={(e) => local$.newName.set(e.target.value)}
          placeholder="Add model..."
          className={styles.input}
        />
        <button type="submit" className={styles.addBtn} disabled={!newName.trim()}>
          Add
        </button>
      </form>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No models yet. Add one above.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((m) => (
            <li key={m.id} className={styles.item}>
              {editId === m.id ? (
                <form onSubmit={handleUpdate} className={styles.editForm}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => local$.editName.set(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                  <button type="submit" className={styles.saveBtn}>Save</button>
                  <button
                    type="button"
                    onClick={() => local$.editId.set(null)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <Link to={`/model/${m.id}`} className={styles.name}>
                    {m.name}
                    {m.manuals?.[0]?.count > 0 && (
                      <svg
                        className={styles.pdfIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-label="Has PDF manuals"
                      >
                        <path d="M4 1h5.5L13 4.5V13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z" fill="#e74c3c" opacity="0.15" stroke="#e74c3c" strokeWidth="1.2" />
                        <text x="6.5" y="11.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="#e74c3c">PDF</text>
                      </svg>
                    )}
                  </Link>
                  <div className={styles.actions}>
                    <button
                      onClick={() => { local$.editId.set(m.id); local$.editName.set(m.name); }}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => local$.deleteId.set(m.id)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Model"
        message={`Delete "${deleteTarget?.name}"? This will also delete all its variants and manuals.`}
        onConfirm={handleDelete}
        onCancel={() => local$.deleteId.set(null)}
      />
    </div>
  );
}
