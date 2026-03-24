import { useEffect } from 'react';
import { useObservable, useValue } from '@legendapp/state/react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { VariantList } from '../../components/VariantList';
import { ManualList } from '../../components/ManualList';
import type { Manufacturer, Model } from '../../types/database';
import styles from './ModelDetail.module.css';

interface ModelWithManufacturer extends Model {
  manufacturers: Manufacturer;
}

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const model$ = useObservable<ModelWithManufacturer | null>(null);
  const model = useValue(model$);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('models')
      .select('*, manufacturers (*)')
      .eq('id', id)
      .single()
      .then(({ data }) => model$.set(data as ModelWithManufacturer));
  }, [id]);

  if (!id) return null;

  return (
    <div>
      <div className={styles.breadcrumbs}>
        <Link to="/" className={styles.crumb}>Manufacturers</Link>
        <span className={styles.sep}>›</span>
        {model && (
          <>
            <Link to={`/manufacturer/${model.manufacturer_id}`} className={styles.crumb}>
              {model.manufacturers.name}
            </Link>
            <span className={styles.sep}>›</span>
          </>
        )}
        <span className={styles.current}>{model?.name ?? 'Loading...'}</span>
      </div>

      <h1 className={styles.heading}>{model?.name ?? 'Loading...'}</h1>

      <div className={styles.sections}>
        <section>
          <VariantList modelId={id} />
        </section>
        <section>
          <ManualList modelId={id} />
        </section>
      </div>
    </div>
  );
}
