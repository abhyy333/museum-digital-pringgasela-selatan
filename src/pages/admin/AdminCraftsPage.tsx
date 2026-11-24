import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { Craft, CraftTranslation, Category, Contributor, CraftType, PublicationStatus } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminCraftsPage: React.FC = () => {
  const { user, canPublish, canDelete } = useAuth();
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCraft, setEditingCraft] = useState<Craft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [slug, setSlug] = useState('');
  const [craftType, setCraftType] = useState<CraftType>('tenun');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [contributorId, setContributorId] = useState('');

  // Translations Form State
  const [titleId, setTitleId] = useState('');
  const [summaryId, setSummaryId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [techniqueId, setTechniqueId] = useState('');
  const [materialsId, setMaterialsId] = useState('');
  const [culturalMeaningId, setCulturalMeaningId] = useState('');

  const [titleEn, setTitleEn] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [craftsRes, catsRes, contribsRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'crafts', [Query.limit(100), Query.orderDesc('$createdAt')]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [Query.limit(50)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(50)]),
      ]);

      const rawCrafts = craftsRes.rows as unknown as Craft[];

      const withTrans = await Promise.all(
        rawCrafts.map(async (c) => {
          try {
            const transRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'craft_translations', [
              Query.equal('craftId', c.$id),
            ]);
            c.translations = transRes.rows as unknown as CraftTranslation[];
          } catch (e) {
            c.translations = [];
          }
          return c;
        })
      );

      setCrafts(withTrans);
      setCategories(catsRes.rows as unknown as Category[]);
      setContributors(contribsRes.rows as unknown as Contributor[]);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat kriya.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCraft(null);
    setSlug('');
    setCraftType('tenun');
    setStatus('draft');
    setIsFeatured(false);
    setCategoryId(categories[0]?.$id || '');
    setContributorId(contributors[0]?.$id || '');

    setTitleId('');
    setSummaryId('');
    setDescriptionId('');
    setTechniqueId('');
    setMaterialsId('');
    setCulturalMeaningId('');

    setTitleEn('');
    setSummaryEn('');
    setDescriptionEn('');

    setModalOpen(true);
  };

  const openEditModal = (c: Craft) => {
    setEditingCraft(c);
    setSlug(c.slug);
    setCraftType(c.craftType);
    setStatus(c.status);
    setIsFeatured(c.isFeatured);
    setCategoryId(c.categoryId || '');
    setContributorId(c.contributorId || '');

    const idTrans = c.translations?.find((t) => t.locale === 'id');
    const enTrans = c.translations?.find((t) => t.locale === 'en');

    setTitleId(idTrans?.title || '');
    setSummaryId(idTrans?.summary || '');
    setDescriptionId(idTrans?.description || '');
    setTechniqueId(idTrans?.technique || '');
    setMaterialsId(idTrans?.materials || '');
    setCulturalMeaningId(idTrans?.culturalMeaning || '');

    setTitleEn(enTrans?.title || '');
    setSummaryEn(enTrans?.summary || '');
    setDescriptionEn(enTrans?.description || '');

    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !titleId || !descriptionId) {
      setAlertMsg({ type: 'error', text: 'Mohon isi Slug, Judul (ID), dan Uraian Lengkap (ID).' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const craftPayload: any = {
        slug: slug.trim().toLowerCase(),
        craftType,
        status,
        isFeatured,
        categoryId: categoryId || categories[0]?.$id,
        contributorId: contributorId || null,
      };

      let craftId = editingCraft?.$id;

      if (editingCraft) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'crafts', editingCraft.$id, craftPayload);
      } else {
        craftId = ID.unique();
        craftPayload.createdById = user?.$id || 'unknown';
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'crafts', craftId, craftPayload);
      }

      // Handle Translations (ID)
      const existingIdTrans = editingCraft?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        craftId: craftId!,
        locale: 'id',
        title: titleId,
        summary: summaryId || titleId,
        description: descriptionId,
        technique: techniqueId || null,
        materials: materialsId || null,
        culturalMeaning: culturalMeaningId || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'craft_translations', existingIdTrans.$id, idPayload);
      } else {
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'craft_translations', ID.unique(), idPayload);
      }

      // Handle Translations (EN)
      if (titleEn || descriptionEn) {
        const existingEnTrans = editingCraft?.translations?.find((t) => t.locale === 'en');
        const enPayload = {
          craftId: craftId!,
          locale: 'en',
          title: titleEn || titleId,
          summary: summaryEn || summaryId,
          description: descriptionEn || descriptionId,
        };

        if (existingEnTrans) {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'craft_translations', existingEnTrans.$id, enPayload);
        } else {
          await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'craft_translations', ID.unique(), enPayload);
        }
      }

      setAlertMsg({ type: 'success', text: `Karya '${slug}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyimpan karya kriya.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Craft) => {
    if (!canDelete) {
      if (confirm(`Ubah status '${c.slug}' menjadi 'archived'?`)) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'crafts', c.$id, { status: 'archived' });
        await fetchData();
      }
      return;
    }

    if (confirm(`YAKIN menghapus permanen '${c.slug}'?`)) {
      try {
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'crafts', c.$id);
        setAlertMsg({ type: 'success', text: `Karya '${c.slug}' telah dihapus.` });
        await fetchData();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus.' });
      }
    }
  };

  const filtered = crafts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idTitle = c.translations?.find((t) => t.locale === 'id')?.title?.toLowerCase() || '';
    return c.slug.toLowerCase().includes(q) || idTitle.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-secondary" />
            <span>Manajemen Kerajinan & Tenun</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola kain tenun tradisional, Batik Sasambo, teknik pembuatan, dan bahan serat lokal.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karya Baru</span>
        </button>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari slug atau nama kriya..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil daftar karya..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Karya (ID)</th>
                  <th className="px-6 py-3.5">Tipe Kriya</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((c) => {
                  const idTitle = c.translations?.find((t) => t.locale === 'id')?.title || '-';
                  return (
                    <tr key={c.$id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-6 py-4 font-serif font-bold text-text text-sm">
                        {idTitle}
                      </td>
                      <td className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">
                        {c.craftType}
                      </td>
                      <td className="px-6 py-4 text-muted font-mono">{c.slug}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={c.status === 'published' ? 'success' : c.status === 'in_review' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCraft ? `Sunting: ${editingCraft.slug}` : 'Tambah Karya Kerajinan Baru'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="misal: tenun-sundawa"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Tipe Kriya</label>
              <select
                value={craftType}
                onChange={(e) => setCraftType(e.target.value as CraftType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="tenun">Tenun Tradisional</option>
                <option value="batik">Batik Sasambo</option>
                <option value="kerajinan_tangan">Kerajinan Tangan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PublicationStatus)}
                disabled={!canPublish && status === 'draft'}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeaturedCraft"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-border text-secondary focus:ring-secondary w-4 h-4"
              />
              <label htmlFor="isFeaturedCraft" className="font-semibold text-text cursor-pointer">
                Unggulan
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.$id} value={c.$id}>{c.nameId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Pengrajin / Maestro</label>
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="">Pilih Pengrajin</option>
                {contributors.map((c) => (
                  <option key={c.$id} value={c.$id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-secondary">Konten Bahasa Indonesia (Wajib)</h4>
            <div>
              <label className="block font-semibold text-text mb-1">Judul Karya (ID) *</label>
              <input
                type="text"
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Ringkasan Singkat (ID)</label>
              <input
                type="text"
                value={summaryId}
                onChange={(e) => setSummaryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Deskripsi Lengkap (ID) *</label>
              <textarea
                rows={4}
                value={descriptionId}
                onChange={(e) => setDescriptionId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Teknik Tenun (ID)</label>
                <input
                  type="text"
                  value={techniqueId}
                  onChange={(e) => setTechniqueId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
              <div>
                <label className="block font-semibold text-text mb-1">Bahan & Serat (ID)</label>
                <input
                  type="text"
                  value={materialsId}
                  onChange={(e) => setMaterialsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-sand-50 text-text"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-secondary hover:bg-secondary-hover text-surface font-semibold"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Kriya'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
