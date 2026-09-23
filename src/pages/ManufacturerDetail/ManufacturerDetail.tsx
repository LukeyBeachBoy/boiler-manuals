import { useEffect, useRef } from 'react';
import { useObservable, useValue } from '@legendapp/state/react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { manufacturerLogoUrl, isUploadedManufacturerLogo } from '../../lib/manufacturerLogo';
import { ModelList } from '../../components/ModelList';
import type { Tables, Json } from '../../types/supabase';
import styles from './ManufacturerDetail.module.css';

type Manufacturer = Tables<'manufacturers'>;
type Category = Tables<'product_categories'>;
type Contact = Tables<'manufacturer_contacts'>;
type Kind = Contact['kind'];
type ContactDraft = Pick<Contact, 'id' | 'kind' | 'label' | 'value' | 'platform' | 'action_role' | 'display_order'>;
type Profile = Pick<Manufacturer, 'name' | 'published' | 'logo_path' | 'search_keywords'> & {
  description: string;
  technical_support_hours: string;
  uk_headquarters: string;
  warranty_information: string;
  training_available: string;
  approved_installer_scheme: string;
  notes: string;
};

const kinds: { kind: Kind; title: string; placeholder: string }[] = [
  { kind: 'phone', title: 'Telephone numbers', placeholder: '+44…' },
  { kind: 'email', title: 'Email addresses', placeholder: 'help@example.com' },
  { kind: 'website', title: 'Website links', placeholder: 'https://…' },
  { kind: 'social', title: 'Social media', placeholder: 'https://…' },
];

const emptyProfile: Profile = {
  name: '', description: '', logo_path: null, search_keywords: [], published: false,
  technical_support_hours: '', uk_headquarters: '', warranty_information: '',
  training_available: '', approved_installer_scheme: '', notes: '',
};

function optional(value: string | null): string { return value ?? ''; }
export function ManufacturerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const local$ = useObservable({
    profile: { ...emptyProfile },
    keywordText: '',
    contacts: [] as ContactDraft[],
    categories: [] as Category[],
    selectedCategories: [] as string[],
    hasManuals: false,
    loading: true,
    saving: false,
    error: '',
    success: '',
  });
  const profile = useValue(local$.profile);
  const keywordText = useValue(local$.keywordText);
  const contacts = useValue(local$.contacts);
  const categories = useValue(local$.categories);
  const selectedCategories = useValue(local$.selectedCategories);
  const hasManuals = useValue(local$.hasManuals);
  const loading = useValue(local$.loading);
  const saving = useValue(local$.saving);
  const error = useValue(local$.error);
  const success = useValue(local$.success);
  const logoFile = useRef<File | null>(null);
  const previousLogo = useRef<string | null>(null);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    local$.loading.set(true);
    local$.error.set('');
    Promise.all([
      supabase.from('manufacturers').select('*').eq('id', id).single(),
      supabase.from('manufacturer_contacts').select('*').eq('manufacturer_id', id).order('display_order'),
      supabase.from('product_categories').select('*').order('display_order'),
      supabase.from('manufacturer_categories').select('category_id').eq('manufacturer_id', id),
      supabase.from('manuals').select('id, models!inner(manufacturer_id)', { head: true, count: 'exact' })
        .eq('models.manufacturer_id', id),
    ]).then(([manufacturer, contactResult, categoryResult, linkResult, manualResult]) => {
      if (!active) return;
      const failure = manufacturer.error || contactResult.error || categoryResult.error ||
        linkResult.error || manualResult.error;
      if (failure || !manufacturer.data) {
        local$.error.set(failure?.message ?? 'Manufacturer not found');
      } else {
        const m = manufacturer.data;
        previousLogo.current = m.logo_path;
        local$.profile.set({
          name: m.name, description: optional(m.description), logo_path: m.logo_path,
          search_keywords: m.search_keywords, published: m.published,
          technical_support_hours: optional(m.technical_support_hours),
          uk_headquarters: optional(m.uk_headquarters),
          warranty_information: optional(m.warranty_information),
          training_available: optional(m.training_available),
          approved_installer_scheme: optional(m.approved_installer_scheme),
          notes: optional(m.notes),
        });
        local$.keywordText.set(m.search_keywords.join(', '));
        local$.contacts.set((contactResult.data ?? []).map(({ id, kind, label, value, platform, action_role, display_order }) =>
          ({ id, kind, label, value, platform, action_role, display_order })));
        local$.categories.set(categoryResult.data ?? []);
        local$.selectedCategories.set((linkResult.data ?? []).map((link) => link.category_id));
        local$.hasManuals.set((manualResult.count ?? 0) > 0);
      }
      local$.loading.set(false);
    });
    return () => { active = false; };
  }, [id]);

  if (!id) return null;

  const setField = (field: keyof Profile, value: string | boolean) => {
    local$.profile.set({ ...local$.profile.get(), [field]: value });
    local$.success.set('');
  };

  const updateContact = (contactId: string, patch: Partial<ContactDraft>) => {
    local$.contacts.set(contacts.map((c) => {
      if (patch.action_role && c.id !== contactId && c.action_role === patch.action_role) {
        return { ...c, action_role: null };
      }
      return c.id === contactId ? { ...c, ...patch } : c;
    }));
    local$.success.set('');
  };

  const addContact = (kind: Kind) => {
    local$.contacts.set([...contacts, {
      id: crypto.randomUUID(), kind, label: '', value: '',
      platform: null, action_role: null, display_order: contacts.filter((c) => c.kind === kind).length,
    }]);
  };

  const moveContact = (sourceId: string, targetId: string) => {
    const source = contacts.find((c) => c.id === sourceId);
    const target = contacts.find((c) => c.id === targetId);
    if (!source || !target || source.kind !== target.kind || sourceId === targetId) return;
    const group = contacts.filter((c) => c.kind === source.kind && c.id !== sourceId);
    group.splice(group.findIndex((c) => c.id === targetId), 0, source);
    local$.contacts.set([
      ...contacts.filter((c) => c.kind !== source.kind),
      ...group.map((c, index) => ({ ...c, display_order: index })),
    ]);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    local$.error.set('');
    local$.success.set('');
    const draft = local$.profile.get();
    const entries = local$.contacts.get();
    if (!draft.name.trim()) { local$.error.set('Enter a manufacturer name.'); return; }
    for (const c of entries) {
      if (!c.label.trim() || !c.value.trim() || (c.kind === 'social' && !c.platform?.trim())) {
        local$.error.set('Complete every contact label, value and social platform, or remove the empty entry.');
        return;
      }
      if (c.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim())) {
        local$.error.set('Enter a valid email address.'); return;
      }
      if (c.kind === 'website' || c.kind === 'social') {
        try {
          const url = new URL(c.value.trim());
          if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid protocol');
        } catch { local$.error.set('Website and social links must be full http or https URLs.'); return; }
      }
    }
    local$.saving.set(true);
    let uploadedPath: string | null = null;
    try {
      let logoPath = draft.logo_path;
      if (logoFile.current) {
        const file = logoFile.current;
        const extensions: Record<string, string> = {
          'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
        };
        if (!extensions[file.type] || file.size > 2 * 1024 * 1024) {
          throw new Error('Logo must be PNG, JPEG or WebP and no larger than 2 MB.');
        }
        uploadedPath = `${id}/${crypto.randomUUID()}.${extensions[file.type]}`;
        const upload = await supabase.storage.from('manufacturer-logos').upload(uploadedPath, file, {
          contentType: file.type,
        });
        if (upload.error) throw upload.error;
        logoPath = uploadedPath;
      }
      const result = await supabase.rpc('save_manufacturer_directory', {
        p_manufacturer_id: id,
        p_profile: {
          ...draft, logo_path: logoPath,
          search_keywords: local$.keywordText.get().split(',').map((s) => s.trim()).filter(Boolean),
        } as Json,
        p_contacts: entries.map((c) => ({
          ...c, display_order: contacts.filter((x) => x.kind === c.kind).findIndex((x) => x.id === c.id),
        })) as Json,
        p_category_ids: local$.selectedCategories.get(),
      });
      if (result.error) throw result.error;
      if (isUploadedManufacturerLogo(previousLogo.current) && previousLogo.current !== logoPath) {
        await supabase.storage.from('manufacturer-logos').remove([previousLogo.current]);
      }
      previousLogo.current = logoPath;
      local$.profile.set({
        ...draft, logo_path: logoPath,
        search_keywords: local$.keywordText.get().split(',').map((s) => s.trim()).filter(Boolean),
      });
      logoFile.current = null;
      if (logoInput.current) logoInput.current.value = '';
      local$.success.set('Manufacturer saved.');
    } catch (cause) {
      if (uploadedPath) await supabase.storage.from('manufacturer-logos').remove([uploadedPath]);
      local$.error.set(cause instanceof Error ? cause.message : 'Could not save manufacturer.');
    } finally {
      local$.saving.set(false);
    }
  };

  const logoUrl = manufacturerLogoUrl(profile.logo_path);
  const support = contacts.find((c) => c.action_role === 'technical_support');
  const website = contacts.find((c) => c.action_role === 'main_website');
  const external = contacts.find((c) => c.action_role === 'external_manuals');

  return (
    <div>
      <Link to="/" className={styles.back}>← All Manufacturers</Link>
      {loading ? <p>Loading manufacturer…</p> : (
        <>
          <h1 className={styles.heading}>{profile.name}</h1>
          <form onSubmit={save} className={styles.editor}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <h2>Company details</h2>
                <label className={styles.publish}>
                  <input type="checkbox" checked={profile.published}
                    onChange={(e) => setField('published', e.target.checked)} />
                  Published in directory
                </label>
              </div>
              <div className={styles.grid}>
                <label>Name<input required value={profile.name} onChange={(e) => setField('name', e.target.value)} /></label>
                <label>Logo (PNG, JPEG or WebP; max 2 MB)
                  <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => { logoFile.current = e.target.files?.[0] ?? null; }} />
                </label>
              </div>
              {logoUrl && <img className={styles.logo} src={logoUrl} alt={`${profile.name} logo`} />}
              {profile.logo_path && <button type="button" className={styles.textButton}
                onClick={() => { setField('logo_path', ''); logoFile.current = null; if (logoInput.current) logoInput.current.value = ''; }}>
                Remove logo
              </button>}
              <label>Short description<textarea rows={3} value={profile.description}
                onChange={(e) => setField('description', e.target.value)} /></label>
              <label>Search keywords (comma separated)<input value={keywordText}
                onChange={(e) => local$.keywordText.set(e.target.value)}
                placeholder="Also known as, alternate spelling…" /></label>
              <h3>Product categories</h3>
              <div className={styles.categories}>
                {categories.map((category) => <label key={category.id}>
                  <input type="checkbox" checked={selectedCategories.includes(category.id)}
                    onChange={(e) => local$.selectedCategories.set(e.target.checked
                      ? [...selectedCategories, category.id]
                      : selectedCategories.filter((x) => x !== category.id))} />
                  {category.name}
                </label>)}
              </div>
            </section>

            {kinds.map(({ kind, title, placeholder }) => (
              <section className={styles.card} key={kind}>
                <div className={styles.sectionHeading}><h2>{title}</h2>
                  <button type="button" className={styles.add} onClick={() => addContact(kind)}>+ Add</button>
                </div>
                {contacts.filter((c) => c.kind === kind).map((contact) => (
                  <div key={contact.id} className={styles.contact} draggable
                    onDragStart={() => { dragId.current = contact.id; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragId.current) moveContact(dragId.current, contact.id); dragId.current = null; }}>
                    <span className={styles.handle} title="Drag to reorder">⋮⋮</span>
                    <input aria-label={`${title} label`} placeholder={kind === 'social' ? 'Profile label' : 'Label'}
                      value={contact.label} onChange={(e) => updateContact(contact.id, { label: e.target.value })} />
                    {kind === 'social' && <input aria-label="Platform" placeholder="Platform"
                      value={contact.platform ?? ''} onChange={(e) => updateContact(contact.id, { platform: e.target.value })} />}
                    <input aria-label={`${title} value`} placeholder={placeholder}
                      value={contact.value} onChange={(e) => updateContact(contact.id, { value: e.target.value })} />
                    {(kind === 'phone' || kind === 'website') && <select aria-label="Quick action"
                      value={contact.action_role ?? ''}
                      onChange={(e) => updateContact(contact.id, { action_role: e.target.value || null })}>
                      <option value="">No quick action</option>
                      {kind === 'phone'
                        ? <option value="technical_support">Technical support</option>
                        : <><option value="main_website">Main website</option>
                            <option value="external_manuals">External manuals fallback</option></>}
                    </select>}
                    <button type="button" className={styles.remove} aria-label="Remove contact"
                      onClick={() => local$.contacts.set(contacts.filter((c) => c.id !== contact.id))}>Remove</button>
                  </div>
                ))}
                {contacts.every((c) => c.kind !== kind) && <p className={styles.muted}>No entries yet.</p>}
              </section>
            ))}

            <section className={styles.card}>
              <h2>Additional information</h2>
              <div className={styles.grid}>
                {([
                  ['technical_support_hours', 'Technical support hours'],
                  ['uk_headquarters', 'UK headquarters'],
                  ['warranty_information', 'Warranty information'],
                  ['training_available', 'Training available'],
                  ['approved_installer_scheme', 'Approved installer scheme'],
                  ['notes', 'Notes'],
                ] as const).map(([field, label]) => (
                  <label key={field}>{label}<textarea rows={2} value={profile[field]}
                    onChange={(e) => setField(field, e.target.value)} /></label>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2>Directory preview</h2>
              <p className={styles.muted}>Only populated sections appear to engineers.</p>
              <h3>{profile.name || 'Manufacturer name'}</h3>
              {profile.description && <p>{profile.description}</p>}
              <div className={styles.previewActions}>
                {support?.value && <span>Call Technical Support · {support.value}</span>}
                {website?.value && <span>Visit Main Website</span>}
                {hasManuals ? <span>Boiler Manuals · Internal Manual Finder</span> :
                  external?.value ? <span>Boiler Manuals · External site</span> : null}
              </div>
              {kinds.map(({ kind, title }) => {
                const populated = contacts.filter((c) => c.kind === kind && c.label && c.value);
                return populated.length ? <div key={kind}><h4>{title}</h4>
                  <p>{populated.map((c) => `${c.label}: ${c.value}`).join(' · ')}</p>
                </div> : null;
              })}
            </section>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            {success && <p role="status" className={styles.success}>{success}</p>}
            <button className={styles.save} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save manufacturer'}</button>
          </form>
          <div className={styles.models}><ModelList manufacturerId={id} /></div>
        </>
      )}
    </div>
  );
}
