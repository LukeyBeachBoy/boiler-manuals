import { useState, useEffect } from 'react';
import { observer } from '@legendapp/state/react';
import {
  variants$,
  fetchVariantsByModel,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../../store/variants';
import { ConfirmDialog } from '../ConfirmDialog';
import styles from './VariantList.module.css';

interface VariantListProps {
  modelId: string;
}

export const VariantList = observer(function VariantList({ modelId }: VariantListProps) {
  const items = variants$.items.get();
  const loading = variants$.loading.get();
  const error = variants$.error.get();

  const [newName, setNewName] = useState('');
  const [newGc, setNewGc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGc, setEditGc] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchVariantsByModel(modelId);
  }, [modelId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGc.trim()) return;
    await createVariant(modelId, newName, newGc);
    setNewName('');
    setNewGc('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName.trim() || !editGc.trim()) return;
    await updateVariant(editId, editName, editGc);
    setEditId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteVariant(deleteId);
    setDeleteId(null);
  };

  const deleteTarget = items.find((v) => v.id === deleteId);

  return (
    <div>
      <h2 className={styles.heading}>Variants</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} className={styles.addForm}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Variant name..."
          className={styles.input}
        />
        <input
          type="text"
          value={newGc}
          onChange={(e) => setNewGc(e.target.value)}
          placeholder="GC number..."
          className={styles.inputSmall}
        />
        <button
          type="submit"
          className={styles.addBtn}
          disabled={!newName.trim() || !newGc.trim()}
        >
          Add
        </button>
      </form>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No variants yet. Add one above.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((v) => (
            <li key={v.id} className={styles.item}>
              {editId === v.id ? (
                <form onSubmit={handleUpdate} className={styles.editForm}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editGc}
                    onChange={(e) => setEditGc(e.target.value)}
                    className={styles.inputSmall}
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
                  <div className={styles.variantInfo}>
                    <span className={styles.name}>{v.name}</span>
                    <span className={styles.gcNumber}>GC {v.gc_number}</span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      onClick={() => {
                        setEditId(v.id);
                        setEditName(v.name);
                        setEditGc(v.gc_number);
                      }}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(v.id)}
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
        title="Delete Variant"
        message={`Delete "${deleteTarget?.name}" (GC ${deleteTarget?.gc_number})?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
});
