import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ModelList } from '../../components/ModelList';
import type { Manufacturer } from '../../types/database';
import styles from './ManufacturerDetail.module.css';

export function ManufacturerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('manufacturers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setManufacturer(data));
  }, [id]);

  if (!id) return null;

  return (
    <div>
      <Link to="/" className={styles.back}>← All Manufacturers</Link>
      <h1 className={styles.heading}>{manufacturer?.name ?? 'Loading...'}</h1>
      <ModelList manufacturerId={id} />
    </div>
  );
}
