import { useEffect } from 'react';
import { useObservable, useValue, Show } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
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

  useEffect(() => {
    fetchModelsByManufacturer(manufacturerId);
  }, [manufacturerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = local$.newName.get();
    if (!name.trim()) return;
    await createModel(manufacturerId, name);
    local$.newName.set('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = local$.editId.get();
    const name = local$.editName.get();
    if (!id || !name.trim()) return;
    await updateModel(id, name);
    local$.editId.set(null);
  };

  const handleDelete = async () => {
    const id = local$.deleteId.get();
    if (!id) return;
    await deleteModel(id);
    local$.deleteId.set(null);
  };

  return (
    <div>
      <h2 className={styles.heading}>Models</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} className={styles.addForm}>
        <$React.input
          type="text"
          $value={local$.newName}
          placeholder="Add model..."
          className={styles.input}
        />
        <$React.button
          type="submit"
          className={styles.addBtn}
          $disabled={() => !local$.newName.get().trim()}
        >
          Add
        </$React.button>
      </form>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No models yet. Add one above.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((m) => (
            <li key={m.id} className={styles.item}>
              <Show
                if={() => local$.editId.get() === m.id}
                else={() => (
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
              >
                {() => (
                  <form onSubmit={handleUpdate} className={styles.editForm}>
                    <$React.input
                      type="text"
                      $value={local$.editName}
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
                )}
              </Show>
            </li>
          ))}
        </ul>
      )}

      <Show if={() => !!local$.deleteId.get()}>
        {() => {
          const target = items.find((m) => m.id === local$.deleteId.get());
          return (
            <ConfirmDialog
              open={true}
              title="Delete Model"
              message={`Delete "${target?.name}"? This will also delete all its variants and manuals.`}
              onConfirm={handleDelete}
              onCancel={() => local$.deleteId.set(null)}
            />
          );
        }}
      </Show>
    </div>
  );
}
