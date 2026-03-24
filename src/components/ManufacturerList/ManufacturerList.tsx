import { useEffect } from 'react';
import { useObservable, useValue, Show } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
import { Link } from 'react-router-dom';
import {
  manufacturers$,
  fetchManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from '../../store/manufacturers';
import { ConfirmDialog } from '../ConfirmDialog';
import styles from './ManufacturerList.module.css';

export function ManufacturerList() {
  const items = useValue(manufacturers$.items);
  const loading = useValue(manufacturers$.loading);
  const error = useValue(manufacturers$.error);

  const local$ = useObservable({
    newName: '',
    editId: null as string | null,
    editName: '',
    deleteId: null as string | null,
  });

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = local$.newName.get();
    if (!name.trim()) return;
    await createManufacturer(name);
    local$.newName.set('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = local$.editId.get();
    const name = local$.editName.get();
    if (!id || !name.trim()) return;
    await updateManufacturer(id, name);
    local$.editId.set(null);
  };

  const handleDelete = async () => {
    const id = local$.deleteId.get();
    if (!id) return;
    await deleteManufacturer(id);
    local$.deleteId.set(null);
  };

  return (
    <div>
      <h1 className={styles.heading}>Manufacturers</h1>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} className={styles.addForm}>
        <$React.input
          type="text"
          $value={local$.newName}
          placeholder="Add manufacturer..."
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
        <p className={styles.empty}>No manufacturers yet. Add one above.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((m) => (
            <li key={m.id} className={styles.item}>
              <Show
                if={() => local$.editId.get() === m.id}
                else={() => (
                  <>
                    <Link to={`/manufacturer/${m.id}`} className={styles.name}>
                      {m.name}
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
              title="Delete Manufacturer"
              message={`Delete "${target?.name}"? This will also delete all its models, variants, and manuals.`}
              onConfirm={handleDelete}
              onCancel={() => local$.deleteId.set(null)}
            />
          );
        }}
      </Show>
    </div>
  );
}
