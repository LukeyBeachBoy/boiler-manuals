import { useEffect } from 'react';
import { useObservable, useValue, Show } from '@legendapp/state/react';
import { $React } from '@legendapp/state/react-web';
import type { Observable } from '@legendapp/state';
import {
  variants$,
  fetchVariantsByModel,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../../store/variants';
import { ConfirmDialog } from '../ConfirmDialog';
import { TypeSelect } from '../TypeSelect/TypeSelect';
import type { BoilerType, FuelType } from '../../types/database';
import { BOILER_TYPE_LABELS, FUEL_TYPE_LABELS } from '../../types/database';
import { formatGcNumber } from '../../lib/gcNumber';
import styles from './VariantList.module.css';

interface VariantListProps {
  modelId: string;
}

// Separate sub-component so it has its own render cycle and TypeSelect re-renders on change
interface EditFormState {
  editId: string | null;
  editName: string;
  editGc: string;
  editBoilerType: BoilerType | null;
  editFuelType: FuelType | null;
  deleteId: string | null;
}

function VariantEditForm({
  local$,
  onSubmit,
}: {
  local$: Observable<EditFormState & { newName: string; newGc: string; newBoilerType: BoilerType | null; newFuelType: FuelType | null }>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const editBoilerType = useValue(local$.editBoilerType);
  const editFuelType = useValue(local$.editFuelType);
  const editGc = useValue(local$.editGc);

  return (
    <form onSubmit={onSubmit} className={styles.editForm}>
      <$React.input
        type="text"
        $value={local$.editName}
        className={styles.input}
        autoFocus
      />
      <input
        type="text"
        inputMode="numeric"
        value={editGc}
        onChange={(e) => local$.editGc.set(formatGcNumber(e.target.value))}
        placeholder="NN-NNN-NN"
        className={styles.inputSmall}
      />
      <TypeSelect
        boilerType={editBoilerType}
        fuelType={editFuelType}
        onBoilerTypeChange={(v) => local$.editBoilerType.set(v)}
        onFuelTypeChange={(v) => local$.editFuelType.set(v)}
        compact
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
  );
}

export function VariantList({ modelId }: VariantListProps) {
  const items = useValue(variants$.items);
  const loading = useValue(variants$.loading);
  const error = useValue(variants$.error);

  const local$ = useObservable({
    newName: '',
    newGc: '',
    newBoilerType: null as BoilerType | null,
    newFuelType: null as FuelType | null,
    editId: null as string | null,
    editName: '',
    editGc: '',
    editBoilerType: null as BoilerType | null,
    editFuelType: null as FuelType | null,
    deleteId: null as string | null,
  });

  // Subscribe so add-form TypeSelect re-renders when values change
  const newBoilerType = useValue(local$.newBoilerType);
  const newFuelType = useValue(local$.newFuelType);
  const newGc = useValue(local$.newGc);

  useEffect(() => {
    fetchVariantsByModel(modelId);
  }, [modelId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = local$.newName.get();
    const gc = local$.newGc.get();
    if (!name.trim() || !gc.trim()) return;
    await createVariant(
      modelId,
      name,
      gc,
      local$.newBoilerType.get(),
      local$.newFuelType.get(),
    );
    local$.newName.set('');
    local$.newGc.set('');
    local$.newBoilerType.set(null);
    local$.newFuelType.set(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = local$.editId.get();
    const name = local$.editName.get();
    const gc = local$.editGc.get();
    if (!id || !name.trim() || !gc.trim()) return;
    await updateVariant(
      id,
      name,
      gc,
      local$.editBoilerType.get(),
      local$.editFuelType.get(),
    );
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
        <input
          type="text"
          inputMode="numeric"
          value={newGc}
          onChange={(e) => local$.newGc.set(formatGcNumber(e.target.value))}
          placeholder="NN-NNN-NN"
          className={styles.inputSmall}
        />
        <TypeSelect
          boilerType={newBoilerType}
          fuelType={newFuelType}
          onBoilerTypeChange={(v) => local$.newBoilerType.set(v)}
          onFuelTypeChange={(v) => local$.newFuelType.set(v)}
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
                      {v.boiler_type && (
                        <span className={styles.typeBadge}>{BOILER_TYPE_LABELS[v.boiler_type]}</span>
                      )}
                      {v.fuel_type && (
                        <span className={styles.typeBadge}>{FUEL_TYPE_LABELS[v.fuel_type]}</span>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <button
                        onClick={() => {
                          local$.editId.set(v.id);
                          local$.editName.set(v.name);
                          local$.editGc.set(v.gc_number);
                          local$.editBoilerType.set(v.boiler_type ?? null);
                          local$.editFuelType.set(v.fuel_type ?? null);
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
                {() => <VariantEditForm local$={local$} onSubmit={handleUpdate} />}
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
