import type { BoilerType, FuelType } from '../../types/database';
import { BOILER_TYPE_LABELS, FUEL_TYPE_LABELS } from '../../types/database';
import styles from './TypeSelect.module.css';

interface TypeSelectProps {
  boilerType: BoilerType | null;
  fuelType: FuelType | null;
  onBoilerTypeChange: (value: BoilerType | null) => void;
  onFuelTypeChange: (value: FuelType | null) => void;
  compact?: boolean;
}

export function TypeSelect({
  boilerType,
  fuelType,
  onBoilerTypeChange,
  onFuelTypeChange,
  compact = false,
}: TypeSelectProps) {
  return (
    <div className={compact ? styles.rowCompact : styles.row}>
      <select
        value={boilerType ?? ''}
        onChange={(e) => onBoilerTypeChange((e.target.value as BoilerType) || null)}
        className={styles.select}
      >
        <option value="">Boiler type...</option>
        {(Object.entries(BOILER_TYPE_LABELS) as [BoilerType, string][]).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select
        value={fuelType ?? ''}
        onChange={(e) => onFuelTypeChange((e.target.value as FuelType) || null)}
        className={styles.select}
      >
        <option value="">Fuel type...</option>
        {(Object.entries(FUEL_TYPE_LABELS) as [FuelType, string][]).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
