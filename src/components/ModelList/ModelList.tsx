import { useState, useEffect } from 'react';
import { observer } from '@legendapp/state/react';
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

export const ModelList = observer(function ModelList({ manufacturerId }: ModelListProps) {
  const items = models$.items.get();
  const loading = models$.loading.get();
  const error = models$.error.get();

  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchModelsByManufacturer(manufacturerId);
  }, [manufacturerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createModel(manufacturerId, newName);
    setNewName('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName.trim()) return;
    await updateModel(editId, editName);
    setEditId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteModel(deleteId);
    setDeleteId(null);
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
          onChange={(e) => setNewName(e.target.value)}
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
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                  <button type="submit" className={styles.saveBtn}>Save</button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <Link to={`/model/${m.id}`} className={styles.name}>
                    {m.name}
                  </Link>
                  <div className={styles.actions}>
                    <button
                      onClick={() => { setEditId(m.id); setEditName(m.name); }}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(m.id)}
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
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
});
