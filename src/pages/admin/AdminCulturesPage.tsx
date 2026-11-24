import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { Culture, CultureTranslation, Category, CulturePeriodicity, PublicationStatus } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminCulturesPage: React.FC = () => {
  const { user, canPublish, canDelete } = useAuth();
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCulture, setEditingCulture] = useState<Culture | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [slug, setSlug] = useState('');
  const [periodicity, setPeriodicity] = useState<CulturePeriodicity>('insidental');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState('');

  // Translations
  const [titleId, setTitleId] = useState('');
  const [summaryId, setSummaryId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [ritualProcedureId, setRitualProcedureId] = useState('');
  const [spiritualValueId, setSpiritualValueId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cultsRes, catsRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'cultures', [Query.limit(100), Query.orderDesc('$createdAt')]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [Query.limit(50)]),
      ]);

      const rawCults = cultsRes.rows as unknown as Culture[];
      const withTrans = await Promise.all(
        rawCults.map(async (c) => {
          try {
            const transRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'culture_translations', [
              Query.equal('cultureId', c.$id),
            ]);
            c.translations = transRes.rows as unknown as CultureTranslation[];
          } catch (e) {
            c.translations = [];
          }
          return c;
        })
      );

      setCultures(withTrans);
      setCategories(catsRes.rows as unknown as Category[]);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat tradisi budaya.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCulture(null);
    setSlug('');
    setPeriodicity('insidental');
    setStatus('draft');
    setIsFeatured(false);
    setCategoryId(categories[0]?.$id || '');

    setTitleId('');
    setSummaryId('');
    setDescriptionId('');
    setRitualProcedureId('');
    setSpiritualValueId('');

    setModalOpen(true);
  };

  const openEditModal = (c: Culture) => {
    setEditingCulture(c);
    setSlug(c.slug);
    setPeriodicity(c.periodicity);
    setStatus(c.status);
    setIsFeatured(c.isFeatured);
    setCategoryId(c.categoryId);

    const idTrans = c.translations?.find((t) => t.locale === 'id');
    setTitleId(idTrans?.title || '');
    setSummaryId(idTrans?.summary || '');
    setDescriptionId(idTrans?.description || '');
    setRitualProcedureId(idTrans?.ritualProcedure || '');
    setSpiritualValueId(idTrans?.spiritualValue || '');

    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !titleId || !descriptionId) {
      setAlertMsg({ type: 'error', text: 'Mohon isi Slug, Judul (ID), dan Deskripsi (ID).' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const cultPayload: any = {
        slug: slug.trim().toLowerCase(),
        categoryId: categoryId || categories[0]?.$id,
        periodicity,
        status,
        isFeatured,
      };

      let cultureId = editingCulture?.$id;

      if (editingCulture) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'cultures', editingCulture.$id, cultPayload);
      } else {
        cultureId = ID.unique();
        cultPayload.createdById = user?.$id || 'unknown';
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'cultures', cultureId, cultPayload);
      }

      // Translations (ID)
      const existingIdTrans = editingCulture?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        cultureId: cultureId!,
        locale: 'id',
        title: titleId,
        summary: summaryId || titleId,
        description: descriptionId,
        ritualProcedure: ritualProcedureId || null,
        spiritualValue: spiritualValueId || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'culture_translations', existingIdTrans.$id, idPayload);
      } else {
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'culture_translations', ID.unique(), idPayload);
      }

      setAlertMsg({ type: 'success', text: `Tradisi '${slug}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyimpan tradisi budaya.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Culture) => {
    if (!canDelete) {
      if (confirm(`Ubah status '${c.slug}' menjadi 'archived'?`)) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'cultures', c.$id, { status: 'archived' });
        await fetchData();
      }
      return;
    }

    if (confirm(`YAKIN menghapus permanen '${c.slug}'?`)) {
      try {
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'cultures', c.$id);
        setAlertMsg({ type: 'success', text: `Tradisi '${c.slug}' telah dihapus.` });
        await fetchData();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus.' });
      }
    }
  };

  const filtered = cultures.filter((c) => {
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
            <Shield className="w-6 h-6 text-accent" />
            <span>Manajemen Tradisi Budaya & Dzikir Saman</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola arsip tradisi adat takbenda, tata cara ritual, dan nilai spiritual luhur.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tradisi Baru</span>
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
          placeholder="Cari slug atau nama tradisi..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil data tradisi..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Tradisi (ID)</th>
                  <th className="px-6 py-3.5">Periodisitas</th>
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
                      <td className="px-6 py-4 font-mono text-muted">{c.periodicity}</td>
                      <td className="px-6 py-4 text-muted font-mono">{c.slug}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={c.status === 'published' ? 'success' : 'neutral'}
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
        title={editingCulture ? `Sunting: ${editingCulture.slug}` : 'Tambah Tradisi Budaya Baru'}
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
                placeholder="misal: dzikir-saman"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Periodisitas</label>
              <select
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value as CulturePeriodicity)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="rutin_mingguan">Rutin Mingguan</option>
                <option value="tahunan">Tahunan</option>
                <option value="siklus_hidup">Siklus Hidup</option>
                <option value="insidental">Insidental / Khusus</option>
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
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeaturedCult"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent w-4 h-4"
              />
              <label htmlFor="isFeaturedCult" className="font-semibold text-text cursor-pointer">
                Unggulan
              </label>
            </div>
          </div>

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-accent">Konten Tradisi (ID)</h4>
            <div>
              <label className="block font-semibold text-text mb-1">Nama Tradisi (ID) *</label>
              <input
                type="text"
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Ringkasan / Sinopsis (ID)</label>
              <input
                type="text"
                value={summaryId}
                onChange={(e) => setSummaryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Uraian Sejarah & Makna (ID) *</label>
              <textarea
                rows={4}
                value={descriptionId}
                onChange={(e) => setDescriptionId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Tata Cara & Prosedur Ritual (ID)</label>
              <textarea
                rows={3}
                value={ritualProcedureId}
                onChange={(e) => setRitualProcedureId(e.target.value)}
                placeholder="Urutan zikir, gerak, dan doa..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Nilai Luhur & Spiritualitas (ID)</label>
              <input
                type="text"
                value={spiritualValueId}
                onChange={(e) => setSpiritualValueId(e.target.value)}
                placeholder="Penyucian jiwa, persaudaraan..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
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
              className="px-6 py-2 rounded-xl bg-accent hover:bg-accent-hover text-surface font-semibold"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Tradisi'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
