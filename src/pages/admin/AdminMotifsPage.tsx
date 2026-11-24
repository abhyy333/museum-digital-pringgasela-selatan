import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { WeavingMotif, MotifTranslation, Category, Contributor, PublicationStatus } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminMotifsPage: React.FC = () => {
  const { user, canPublish, canDelete } = useAuth();
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotif, setEditingMotif] = useState<WeavingMotif | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [slug, setSlug] = useState('');
  const [codeName, setCodeName] = useState('');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [contributorId, setContributorId] = useState('');

  // Translations Form State
  const [nameId, setNameId] = useState('');
  const [visualDescId, setVisualDescId] = useState('');
  const [philosophyId, setPhilosophyId] = useState('');
  const [techniqueId, setTechniqueId] = useState('');
  const [historicalUsageId, setHistoricalUsageId] = useState('');
  const [originStoryId, setOriginStoryId] = useState('');

  const [nameEn, setNameEn] = useState('');
  const [visualDescEn, setVisualDescEn] = useState('');
  const [philosophyEn, setPhilosophyEn] = useState('');
  const [techniqueEn, setTechniqueEn] = useState('');
  const [historicalUsageEn, setHistoricalUsageEn] = useState('');
  const [originStoryEn, setOriginStoryEn] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [motifsRes, catsRes, contribsRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'weaving_motifs', [Query.limit(100), Query.orderDesc('$createdAt')]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [Query.limit(50)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(50)]),
      ]);

      const rawMotifs = motifsRes.rows as unknown as WeavingMotif[];
      
      // Fetch translations for each motif
      const withTrans = await Promise.all(
        rawMotifs.map(async (m) => {
          try {
            const transRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'motif_translations', [
              Query.equal('motifId', m.$id),
            ]);
            m.translations = transRes.rows as unknown as MotifTranslation[];
          } catch (e) {
            m.translations = [];
          }
          return m;
        })
      );

      setMotifs(withTrans);
      setCategories(catsRes.rows as unknown as Category[]);
      setContributors(contribsRes.rows as unknown as Contributor[]);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat motif.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingMotif(null);
    setSlug('');
    setCodeName('');
    setStatus('draft');
    setIsFeatured(false);
    setCategoryId(categories[0]?.$id || '');
    setContributorId(contributors[0]?.$id || '');

    setNameId('');
    setVisualDescId('');
    setPhilosophyId('');
    setTechniqueId('');
    setHistoricalUsageId('');
    setOriginStoryId('');

    setNameEn('');
    setVisualDescEn('');
    setPhilosophyEn('');
    setTechniqueEn('');
    setHistoricalUsageEn('');
    setOriginStoryEn('');

    setModalOpen(true);
  };

  const openEditModal = (m: WeavingMotif) => {
    setEditingMotif(m);
    setSlug(m.slug);
    setCodeName(m.codeName || '');
    setStatus(m.status);
    setIsFeatured(m.isFeatured);
    setCategoryId(m.categoryId || '');
    setContributorId(m.contributorId || '');

    const idTrans = m.translations?.find((t) => t.locale === 'id');
    const enTrans = m.translations?.find((t) => t.locale === 'en');

    setNameId(idTrans?.name || '');
    setVisualDescId(idTrans?.visualDescription || '');
    setPhilosophyId(idTrans?.philosophy || '');
    setTechniqueId(idTrans?.technique || '');
    setHistoricalUsageId(idTrans?.historicalUsage || '');
    setOriginStoryId(idTrans?.originStory || '');

    setNameEn(enTrans?.name || '');
    setVisualDescEn(enTrans?.visualDescription || '');
    setPhilosophyEn(enTrans?.philosophy || '');
    setTechniqueEn(enTrans?.technique || '');
    setHistoricalUsageEn(enTrans?.historicalUsage || '');
    setOriginStoryEn(enTrans?.originStory || '');

    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !nameId || !philosophyId) {
      setAlertMsg({ type: 'error', text: 'Mohon isi kolom Slug, Nama Motif (ID), dan Filosofi (ID).' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const motifPayload: any = {
        slug: slug.trim().toLowerCase(),
        codeName: codeName.trim(),
        status,
        isFeatured,
        categoryId: categoryId || null,
        contributorId: contributorId || null,
      };

      let motifId = editingMotif?.$id;

      if (editingMotif) {
        // Update existing motif
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'weaving_motifs', editingMotif.$id, motifPayload);
      } else {
        // Create new motif
        motifId = ID.unique();
        motifPayload.createdById = user?.$id || 'unknown';
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'weaving_motifs', motifId, motifPayload);
      }

      // Handle Translations (ID)
      const existingIdTrans = editingMotif?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        motifId: motifId!,
        locale: 'id',
        name: nameId,
        visualDescription: visualDescId || null,
        philosophy: philosophyId,
        technique: techniqueId || null,
        historicalUsage: historicalUsageId || null,
        originStory: originStoryId || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'motif_translations', existingIdTrans.$id, idPayload);
      } else {
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'motif_translations', ID.unique(), idPayload);
      }

      // Handle Translations (EN)
      if (nameEn || philosophyEn) {
        const existingEnTrans = editingMotif?.translations?.find((t) => t.locale === 'en');
        const enPayload = {
          motifId: motifId!,
          locale: 'en',
          name: nameEn || nameId,
          visualDescription: visualDescEn || null,
          philosophy: philosophyEn || philosophyId,
          technique: techniqueEn || null,
          historicalUsage: historicalUsageEn || null,
          originStory: originStoryEn || null,
        };

        if (existingEnTrans) {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'motif_translations', existingEnTrans.$id, enPayload);
        } else {
          await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'motif_translations', ID.unique(), enPayload);
        }
      }

      setAlertMsg({ type: 'success', text: `Motif '${slug}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyimpan motif.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: WeavingMotif) => {
    if (!canDelete) {
      // Soft-archive if not super admin
      if (confirm(`Anda tidak memiliki wewenang hard-delete. Ubah status '${m.slug}' menjadi 'archived'?`)) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'weaving_motifs', m.$id, { status: 'archived' });
        await fetchData();
      }
      return;
    }

    if (confirm(`YAKIN menghapus permanen motif '${m.slug}'? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'weaving_motifs', m.$id);
        setAlertMsg({ type: 'success', text: `Motif '${m.slug}' telah dihapus.` });
        await fetchData();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus motif.' });
      }
    }
  };

  const filtered = motifs.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idName = m.translations?.find((t) => t.locale === 'id')?.name?.toLowerCase() || '';
    return m.slug.toLowerCase().includes(q) || m.codeName?.toLowerCase().includes(q) || idName.includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Manajemen Ensiklopedia Motif</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola dokumentasi motif tenun, terjemahan bilingual, morfologi, filosofi, dan atribusi pengrajin.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Motif Baru</span>
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

      {/* Search Input */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari slug motif, nama, atau kode..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {/* Table Data */}
      {loading ? (
        <LoadingSpinner message="Mengambil daftar motif tenun..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Kode</th>
                  <th className="px-6 py-3.5">Nama Motif (ID)</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Unggulan</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((m) => {
                  const idName = m.translations?.find((t) => t.locale === 'id')?.name || '-';
                  return (
                    <tr key={m.$id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-text">
                        {m.codeName || '-'}
                      </td>
                      <td className="px-6 py-4 font-serif font-bold text-text text-sm">
                        {idName}
                      </td>
                      <td className="px-6 py-4 text-muted font-mono">{m.slug}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={m.status === 'published' ? 'success' : m.status === 'in_review' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {m.isFeatured ? (
                          <span className="flex items-center gap-1 text-accent font-semibold">
                            <Sparkles className="w-3.5 h-3.5" /> Ya
                          </span>
                        ) : (
                          <span className="text-muted">Tidak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          title="Edit Motif"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Hapus / Arsipkan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted">
                      Tidak ada data motif tenun yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MOTIF MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMotif ? `Sunting Motif: ${editingMotif.slug}` : 'Dokumentasikan Motif Tenun Baru'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          
          {/* Row 1: Core Identifier & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="misal: motif-subahnale"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Kode Motif</label>
              <input
                type="text"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                placeholder="misal: SBN-01"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PublicationStatus)}
                disabled={!canPublish && status === 'draft'}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-medium"
              >
                <option value="draft">Draft (Draf Peneliti)</option>
                <option value="in_review">In Review (Verifikasi Desa)</option>
                <option value="published">Published (Terbit Publik)</option>
                <option value="archived">Archived (Diarsipkan)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <label htmlFor="isFeatured" className="font-semibold text-text cursor-pointer">
                Tampilkan di Unggulan
              </label>
            </div>
          </div>

          {/* Row 2: Categories and Informants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Kategori Tekstil</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.nameId} ({c.slug})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Atribusi Pengrajin / Tetua Adat</label>
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="">Pilih Pengrajin / Narasumber</option>
                {contributors.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.name} ({c.type} - {c.dusun || 'Desa'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BILINGUAL TABS */}
          <div className="border-t border-border pt-4 space-y-6">
            
            {/* Indonesian Content */}
            <div className="bg-sand-50 p-5 rounded-2xl border border-border space-y-4">
              <h4 className="font-serif text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <span>1. Konten Bahasa Indonesia (Wajib)</span>
              </h4>

              <div>
                <label className="block font-semibold text-text mb-1">Nama Motif (ID) *</label>
                <input
                  type="text"
                  value={nameId}
                  onChange={(e) => setNameId(e.target.value)}
                  placeholder="misal: Motif Subahnale"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden font-serif font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Filosofi & Makna Spiritual (ID) *</label>
                <textarea
                  rows={3}
                  value={philosophyId}
                  onChange={(e) => setPhilosophyId(e.target.value)}
                  placeholder="Makna filosofis, doa spiritual, dan simbol kosmik motif..."
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">Morfologi & Deskripsi Visual (ID)</label>
                  <textarea
                    rows={2}
                    value={visualDescId}
                    onChange={(e) => setVisualDescId(e.target.value)}
                    placeholder="Pola belah ketupat bertingkat, garis melintang..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Teknik & Mekanika Tenun (ID)</label>
                  <textarea
                    rows={2}
                    value={techniqueId}
                    onChange={(e) => setTechniqueId(e.target.value)}
                    placeholder="Alat tenun gedogan, pakan ekstra..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">Penggunaan Adat & Ritual (ID)</label>
                  <input
                    type="text"
                    value={historicalUsageId}
                    onChange={(e) => setHistoricalUsageId(e.target.value)}
                    placeholder="Upacara daur hidup, pernikahan..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Asal-Usul & Tutur Lisan (ID)</label>
                  <input
                    type="text"
                    value={originStoryId}
                    onChange={(e) => setOriginStoryId(e.target.value)}
                    placeholder="Riwayat leluhur era Kesultanan Selaparang..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* English Content */}
            <div className="bg-sand-50 p-5 rounded-2xl border border-border space-y-4">
              <h4 className="font-serif text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <span>2. English Translation (Optional)</span>
              </h4>

              <div>
                <label className="block font-semibold text-text mb-1">Motif Name (EN)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Subahnale Motif"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden font-serif font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Philosophy & Spiritual Meaning (EN)</label>
                <textarea
                  rows={3}
                  value={philosophyEn}
                  onChange={(e) => setPhilosophyEn(e.target.value)}
                  placeholder="Cosmic symbolism, spiritual meaning in English..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">Visual Morphology (EN)</label>
                  <textarea
                    rows={2}
                    value={visualDescEn}
                    onChange={(e) => setVisualDescEn(e.target.value)}
                    placeholder="Stepped rhombus pattern, symmetric layout..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Weaving Technique (EN)</label>
                  <textarea
                    rows={2}
                    value={techniqueEn}
                    onChange={(e) => setTechniqueEn(e.target.value)}
                    placeholder="Handwoven on backstrap loom, natural dye..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-sand-50 hover:bg-sand-100 text-text font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface font-semibold shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data Motif'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
};
