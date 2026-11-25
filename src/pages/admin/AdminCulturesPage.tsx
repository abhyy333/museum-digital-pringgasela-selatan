import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import {
  Culture,
  CultureTranslation,
  Category,
  Contributor,
  CulturePeriodicity,
  PublicationStatus,
} from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EntityMediaManager, GalleryDraftItem } from '../../components/admin/EntityMediaManager';
import { buildCreatorRowPermissions, formatAppwriteError, recordAuditLog } from '../../utils/audit';
import {
  cascadeDeleteEntityChildren,
  clearDraftFromSession,
  loadDraftFromSession,
  loadEntityGallery,
  saveDraftToSession,
  slugifyInput,
  syncEntityGallery,
} from '../../utils/cmsHelpers';

interface CultureDraftState {
  slug: string;
  periodicity: CulturePeriodicity;
  status: PublicationStatus;
  isFeatured: boolean;
  categoryId: string;
  contributorId: string;
  titleId: string;
  summaryId: string;
  descriptionId: string;
  ritualProcedureId: string;
  spiritualValueId: string;
  titleEn: string;
  summaryEn: string;
  descriptionEn: string;
  ritualProcedureEn: string;
  spiritualValueEn: string;
  galleryItems: GalleryDraftItem[];
}

export const AdminCulturesPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [mediaCounts, setMediaCounts] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCulture, setEditingCulture] = useState<Culture | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDraft, setPendingDraft] = useState<CultureDraftState | null>(null);

  // Core Form
  const [slug, setSlug] = useState('');
  const [periodicity, setPeriodicity] = useState<CulturePeriodicity>('insidental');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [contributorId, setContributorId] = useState('');

  // ID Translations
  const [titleId, setTitleId] = useState('');
  const [summaryId, setSummaryId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [ritualProcedureId, setRitualProcedureId] = useState('');
  const [spiritualValueId, setSpiritualValueId] = useState('');

  // EN Translations
  const [titleEn, setTitleEn] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [ritualProcedureEn, setRitualProcedureEn] = useState('');
  const [spiritualValueEn, setSpiritualValueEn] = useState('');

  // Gallery (Photos / Video / Audio Chant)
  const [galleryItems, setGalleryItems] = useState<GalleryDraftItem[]>([]);

  const draftKey = editingCulture ? `culture_${editingCulture.$id}` : 'culture_new';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cultsRes, catsRes, contribsRes, mediaRelRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'cultures', [
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [Query.limit(100)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(100)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'culture_media', [Query.limit(200)]),
      ]);

      const counts: Record<string, number> = {};
      for (const rel of mediaRelRes.rows as any[]) {
        if (rel.cultureId) counts[rel.cultureId] = (counts[rel.cultureId] || 0) + 1;
      }
      setMediaCounts(counts);

      const rawCults = cultsRes.rows as unknown as Culture[];
      const withTrans = await Promise.all(
        rawCults.map(async (c) => {
          try {
            const transRes = await tablesDB.listRows(
              APPWRITE_CONFIG.databaseId,
              'culture_translations',
              [Query.equal('cultureId', c.$id)]
            );
            c.translations = transRes.rows as unknown as CultureTranslation[];
          } catch {
            c.translations = [];
          }
          return c;
        })
      );

      setCultures(withTrans);
      setCategories(catsRes.rows as unknown as Category[]);
      setContributors(contribsRes.rows as unknown as Contributor[]);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    if (!slug && !titleId && !descriptionId && galleryItems.length === 0) return;
    saveDraftToSession(draftKey, {
      slug,
      periodicity,
      status,
      isFeatured,
      categoryId,
      contributorId,
      titleId,
      summaryId,
      descriptionId,
      ritualProcedureId,
      spiritualValueId,
      titleEn,
      summaryEn,
      descriptionEn,
      ritualProcedureEn,
      spiritualValueEn,
      galleryItems,
    });
  }, [
    modalOpen,
    draftKey,
    slug,
    periodicity,
    status,
    isFeatured,
    categoryId,
    contributorId,
    titleId,
    summaryId,
    descriptionId,
    ritualProcedureId,
    spiritualValueId,
    titleEn,
    summaryEn,
    descriptionEn,
    ritualProcedureEn,
    spiritualValueEn,
    galleryItems,
  ]);

  const applyDraft = (draft: CultureDraftState) => {
    setSlug(draft.slug || '');
    setPeriodicity(draft.periodicity || 'insidental');
    setStatus(draft.status || 'draft');
    setIsFeatured(Boolean(draft.isFeatured));
    setCategoryId(draft.categoryId || '');
    setContributorId(draft.contributorId || '');
    setTitleId(draft.titleId || '');
    setSummaryId(draft.summaryId || '');
    setDescriptionId(draft.descriptionId || '');
    setRitualProcedureId(draft.ritualProcedureId || '');
    setSpiritualValueId(draft.spiritualValueId || '');
    setTitleEn(draft.titleEn || '');
    setSummaryEn(draft.summaryEn || '');
    setDescriptionEn(draft.descriptionEn || '');
    setRitualProcedureEn(draft.ritualProcedureEn || '');
    setSpiritualValueEn(draft.spiritualValueEn || '');
    setGalleryItems(Array.isArray(draft.galleryItems) ? draft.galleryItems : []);
    setPendingDraft(null);
  };

  const openCreateModal = () => {
    const preferredCat = categories.find((c) => c.type === 'culture') || categories[0];
    setEditingCulture(null);
    setSlug('');
    setPeriodicity('insidental');
    setStatus('draft');
    setIsFeatured(false);
    setCategoryId(preferredCat?.$id || '');
    setContributorId(contributors[0]?.$id || '');

    setTitleId('');
    setSummaryId('');
    setDescriptionId('');
    setRitualProcedureId('');
    setSpiritualValueId('');

    setTitleEn('');
    setSummaryEn('');
    setDescriptionEn('');
    setRitualProcedureEn('');
    setSpiritualValueEn('');

    setGalleryItems([]);
    setPendingDraft(loadDraftFromSession<CultureDraftState>('culture_new'));
    setAlertMsg(null);
    setModalOpen(true);
  };

  const openEditModal = async (c: Culture) => {
    setEditingCulture(c);
    setSlug(c.slug);
    setPeriodicity(c.periodicity);
    setStatus(c.status);
    setIsFeatured(c.isFeatured);
    setCategoryId(c.categoryId || '');
    setContributorId(c.contributorId || '');

    const idTrans = c.translations?.find((t) => t.locale === 'id');
    const enTrans = c.translations?.find((t) => t.locale === 'en');

    setTitleId(idTrans?.title || '');
    setSummaryId(idTrans?.summary || '');
    setDescriptionId(idTrans?.description || '');
    setRitualProcedureId(idTrans?.ritualProcedure || '');
    setSpiritualValueId(idTrans?.spiritualValue || '');

    setTitleEn(enTrans?.title || '');
    setSummaryEn(enTrans?.summary || '');
    setDescriptionEn(enTrans?.description || '');
    setRitualProcedureEn(enTrans?.ritualProcedure || '');
    setSpiritualValueEn(enTrans?.spiritualValue || '');

    setGalleryItems([]);
    setPendingDraft(loadDraftFromSession<CultureDraftState>(`culture_${c.$id}`));
    setAlertMsg(null);
    setModalOpen(true);

    try {
      const attached = await loadEntityGallery('culture', c.$id);
      setGalleryItems(attached);
    } catch {
      setGalleryItems([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = slugifyInput(slug || titleId);
    const chosenCat =
      categoryId || categories.find((c) => c.type === 'culture')?.$id || categories[0]?.$id;
    if (!normalizedSlug || !titleId.trim() || !descriptionId.trim() || !chosenCat) {
      setAlertMsg({
        type: 'error',
        text: 'Mohon isi Slug, Kategori, Judul (ID), dan Deskripsi (ID).',
      });
      return;
    }

    if (!canPublish && (status === 'published' || status === 'archived')) {
      setAlertMsg({
        type: 'error',
        text: 'Akun KKN hanya dapat menyimpan status Draft atau In Review.',
      });
      return;
    }

    const userId = user?.$id;
    if (!userId) {
      setAlertMsg({ type: 'error', text: 'Sesi pengguna tidak valid.' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const cultPayload: Record<string, any> = {
        slug: normalizedSlug,
        categoryId: chosenCat,
        periodicity,
        status,
        isFeatured,
        contributorId: contributorId || null,
      };

      let cultureId = editingCulture?.$id;

      if (editingCulture) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'cultures',
          editingCulture.$id,
          cultPayload
        );
      } else {
        cultureId = ID.unique();
        cultPayload.createdById = userId;
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'cultures',
          cultureId,
          cultPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      const existingIdTrans = editingCulture?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        cultureId: cultureId!,
        locale: 'id',
        title: titleId.trim(),
        summary: summaryId.trim() || titleId.trim(),
        description: descriptionId.trim(),
        ritualProcedure: ritualProcedureId.trim() || null,
        spiritualValue: spiritualValueId.trim() || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'culture_translations',
          existingIdTrans.$id,
          idPayload
        );
      } else {
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'culture_translations',
          ID.unique(),
          idPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      if (
        titleEn.trim() ||
        descriptionEn.trim() ||
        summaryEn.trim() ||
        ritualProcedureEn.trim() ||
        spiritualValueEn.trim()
      ) {
        const existingEnTrans = editingCulture?.translations?.find((t) => t.locale === 'en');
        const enPayload = {
          cultureId: cultureId!,
          locale: 'en',
          title: titleEn.trim() || titleId.trim(),
          summary: summaryEn.trim() || summaryId.trim() || titleEn.trim() || titleId.trim(),
          description: descriptionEn.trim() || descriptionId.trim(),
          ritualProcedure: ritualProcedureEn.trim() || null,
          spiritualValue: spiritualValueEn.trim() || null,
        };

        if (existingEnTrans) {
          await tablesDB.updateRow(
            APPWRITE_CONFIG.databaseId,
            'culture_translations',
            existingEnTrans.$id,
            enPayload
          );
        } else {
          await tablesDB.createRow(
            APPWRITE_CONFIG.databaseId,
            'culture_translations',
            ID.unique(),
            enPayload,
            buildCreatorRowPermissions(userId)
          );
        }
      }

      await syncEntityGallery('culture', cultureId!, galleryItems, userId);

      await recordAuditLog({
        actorUserId: userId,
        action:
          status === 'published'
            ? 'publish'
            : status === 'archived'
            ? 'archive'
            : editingCulture
            ? 'update'
            : 'create',
        entityType: 'culture',
        entityId: cultureId!,
        changes: { slug: normalizedSlug, status, mediaCount: galleryItems.length },
      });

      clearDraftFromSession(draftKey);
      setAlertMsg({ type: 'success', text: `Tradisi '${normalizedSlug}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Culture) => {
    if (!user) return;
    if (!canDelete) {
      if (!canPublish) {
        setAlertMsg({
          type: 'error',
          text: 'Akun KKN tidak diizinkan menghapus atau mengarsipkan tradisi.',
        });
        return;
      }
      if (confirm(`Ubah status '${c.slug}' menjadi 'archived'?`)) {
        try {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'cultures', c.$id, {
            status: 'archived',
          });
          await recordAuditLog({
            actorUserId: user.$id,
            action: 'archive',
            entityType: 'culture',
            entityId: c.$id,
            changes: { slug: c.slug },
          });
          await fetchData();
        } catch (err: any) {
          setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
        }
      }
      return;
    }

    if (confirm(`YAKIN menghapus permanen '${c.slug}' beserta terjemahan dan relasi media?`)) {
      try {
        await cascadeDeleteEntityChildren('culture', c.$id);
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'cultures', c.$id);
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'delete',
          entityType: 'culture',
          entityId: c.$id,
          changes: { slug: c.slug },
        });
        setAlertMsg({ type: 'success', text: `Tradisi '${c.slug}' telah dihapus.` });
        await fetchData();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
      }
    }
  };

  const filtered = cultures.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idTitle = c.translations?.find((t) => t.locale === 'id')?.title?.toLowerCase() || '';
    return c.slug.toLowerCase().includes(q) || idTitle.includes(q);
  });

  const isStatusLockedForKKN =
    !canPublish &&
    Boolean(editingCulture) &&
    (editingCulture?.status === 'published' || editingCulture?.status === 'archived');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <span>Manajemen Tradisi Budaya & Dzikir Saman</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola arsip budaya takbenda, upacara adat, kesenian rakyat, foto, video, dan rekaman
            audio pelafalan adat.
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

      {alertMsg && !modalOpen && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari slug atau nama tradisi budaya..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil daftar tradisi budaya..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Tradisi (ID / EN)</th>
                  <th className="px-6 py-3.5">Periodisitas</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Media</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((c) => {
                  const idTitle = c.translations?.find((t) => t.locale === 'id')?.title || '-';
                  const enTitle = c.translations?.find((t) => t.locale === 'en')?.title;
                  return (
                    <tr key={c.$id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-serif font-bold text-text text-sm">{idTitle}</div>
                        {enTitle ? (
                          <div className="text-[11px] text-muted">{enTitle}</div>
                        ) : (
                          <div className="text-[10px] text-amber-700">Belum ada terjemahan EN</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-muted">{c.periodicity}</td>
                      <td className="px-6 py-4 text-muted font-mono">{c.slug}</td>
                      <td className="px-6 py-4 font-mono text-muted">
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> {mediaCounts[c.$id] || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            c.status === 'published'
                              ? 'success'
                              : c.status === 'in_review'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          title="Edit Tradisi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {(canDelete || canPublish) && (
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors"
                            title={canDelete ? 'Hapus Permanen' : 'Arsipkan'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted">
                      Tidak ada data tradisi budaya ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCulture ? `Sunting: ${editingCulture.slug}` : 'Tambah Tradisi Budaya Baru'
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {alertMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
          )}

          {pendingDraft && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-amber-900">
              <span>Ditemukan draf lokal tradisi yang belum tersimpan.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyDraft(pendingDraft)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700 text-white rounded-lg font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Pulihkan Draf
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDraftFromSession(draftKey);
                    setPendingDraft(null);
                  }}
                  className="px-2.5 py-1 border border-amber-300 rounded-lg"
                >
                  Abaikan
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                placeholder="misal: dzikir-saman"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-mono"
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
                disabled={isStatusLockedForKKN}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="published" disabled={!canPublish}>
                  Published {!canPublish ? '(Admin Desa)' : ''}
                </option>
                <option value="archived" disabled={!canPublish}>
                  Archived {!canPublish ? '(Admin Desa)' : ''}
                </option>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Kategori Budaya *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.nameId} ({c.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Narasumber / Tetua Adat / Pelaku Seni
              </label>
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="">Pilih Narasumber</option>
                {contributors.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.name} ({c.type} - {c.dusun || 'Desa'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <EntityMediaManager
            entityType="culture"
            items={galleryItems}
            onChange={setGalleryItems}
          />

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-accent">
              1. Konten Tradisi Bahasa Indonesia (Wajib)
            </h4>
            <div>
              <label className="block font-semibold text-text mb-1">Nama Tradisi (ID) *</label>
              <input
                type="text"
                value={titleId}
                onChange={(e) => {
                  setTitleId(e.target.value);
                  if (!editingCulture && !slug) setSlug(slugifyInput(e.target.value));
                }}
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
                placeholder="Ringkasan singkat tradisi & tempat pelaksanaannya..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Uraian Sejarah, Lokasi & Sumber Informasi (ID) *
              </label>
              <textarea
                rows={4}
                value={descriptionId}
                onChange={(e) => setDescriptionId(e.target.value)}
                required
                placeholder="Cantumkan latar sejarah, dusun lokasi pelaksanaan, dan sumber keterangan tokoh adat..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Tata Cara & Prosedur Ritual (ID)
              </label>
              <textarea
                rows={3}
                value={ritualProcedureId}
                onChange={(e) => setRitualProcedureId(e.target.value)}
                placeholder="Urutan zikir, gerak, perlengkapan, dan doa..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Nilai Luhur & Spiritualitas (ID)
              </label>
              <input
                type="text"
                value={spiritualValueId}
                onChange={(e) => setSpiritualValueId(e.target.value)}
                placeholder="Penyucian jiwa, persaudaraan komunal..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
          </div>

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-secondary">
              2. English Translation (Opsional)
            </h4>
            <div>
              <label className="block font-semibold text-text mb-1">Tradition Title (EN)</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Short Synopsis (EN)</label>
              <input
                type="text"
                value={summaryEn}
                onChange={(e) => setSummaryEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Heritage History & Location Notes (EN)
              </label>
              <textarea
                rows={3}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Ritual Execution Order (EN)
              </label>
              <textarea
                rows={2}
                value={ritualProcedureEn}
                onChange={(e) => setRitualProcedureEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Spiritual Philosophy & Social Harmony (EN)
              </label>
              <input
                type="text"
                value={spiritualValueEn}
                onChange={(e) => setSpiritualValueEn(e.target.value)}
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
