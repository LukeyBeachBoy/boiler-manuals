import { useEffect } from 'react';
import { useObservable, useValue, Show } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
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

export function VariantList({ modelId }: VariantListProps) {
  const items = useValue(variants$.items);
  const loading = useValue(variants$.loading);
  const error = useValue(variants$.error);

  const local$ = useObservable({
    newName: '',
    newGc: '',
    editId: null as string | null,
    editName: '',
    editGc: '',
    deleteId: null as string | null,
  });

  useEffect(() => {
    fetchVariantsByModel(modelId);
  }, [modelId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = local$.newName.get();
    const gc = local$.newGc.get();
    if (!name.trim() || !gc.trim()) return;
    await createVariant(modelId, name, gc);
    local$.newName.set('');
    local$.newGc.set('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = local$.editId.get();
    const name = local$.editName.get();
    const gc = local$.editGc.get();
    if (!id || !name.trim() || !gc.trim()) return;
    await updateVariant(id, name, gc);
    local$.editId.set(null);
  };

  const handleDelete = async () => {
    const id = local$.deleteId.get();
    if (!id) return;
    await deleteVariant(id);
    local$.deleteId.set(null);
  };

  return (
    <div>
      <h2 className={styles.heading}>Variants</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} className={styles.addForm}>
        <$React.input
          type="text"
          $value={local$.newName}
          placeholder="Variant name..."
          className={styles.input}
        />
        <$React.input
          type="text"
          $value={local$.newGc}
          placeholder="GC number..."
          className={styles.inputSmall}
        />
        <$React.button
          type="submit"
          className={styles.addBtn}
          $disabled={() => !local$.newName.get().trim() || !local$.newGc.get().trim()}
        >
          Add
        </$React.button>
      </form>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No variants yet. Add one above.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((v) => (
            <li key={v.id} className={styles.item}>
              <Show
                if={() => local$.editId.get() === v.id}
                else={() => (
                  <>
                    <div className={styles.variantInfo}>
                      <span className={styles.name}>{v.name}</span>
                      <span className={styles.gcNumber}>GC {v.gc_number}</span>
                    </div>
                    <div className={styles.actions}>
                      <button
                        onClick={() => {
                          local$.editId.set(v.id);
                          local$.editName.set(v.name);
                          local$.editGc.set(v.gc_number);
                        }}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => local$.deleteId.set(v.id)}
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
                    <$React.input
                      type="text"
                      $value={local$.editGc}
                      className={styles.inputSmall}
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
          const target = items.find((v) => v.id === local$.deleteId.get());
          return (
            <ConfirmDialog
              open={true}
              title="Delete Variant"
              message={`Delete "${target?.name}" (GC ${target?.gc_number})?`}
              onConfirm={handleDelete}
              onCancel={() => local$.deleteId.set(null)}
            />
          );
        }}
      </Show>
    </div>
  );
}
