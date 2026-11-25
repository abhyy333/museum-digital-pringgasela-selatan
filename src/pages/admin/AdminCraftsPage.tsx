import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import {
  Craft,
  CraftTranslation,
  Category,
  Contributor,
  CraftType,
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

interface CraftDraftState {
  slug: string;
  craftType: CraftType;
  status: PublicationStatus;
  isFeatured: boolean;
  categoryId: string;
  contributorId: string;
  titleId: string;
  summaryId: string;
  descriptionId: string;
  techniqueId: string;
  materialsId: string;
  culturalMeaningId: string;
  titleEn: string;
  summaryEn: string;
  descriptionEn: string;
  techniqueEn: string;
  materialsEn: string;
  culturalMeaningEn: string;
  galleryItems: GalleryDraftItem[];
}

export const AdminCraftsPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [mediaCounts, setMediaCounts] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCraft, setEditingCraft] = useState<Craft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDraft, setPendingDraft] = useState<CraftDraftState | null>(null);

  // Core Form State
  const [slug, setSlug] = useState('');
  const [craftType, setCraftType] = useState<CraftType>('tenun_gedogan');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [contributorId, setContributorId] = useState('');

  // Indonesian Translations
  const [titleId, setTitleId] = useState('');
  const [summaryId, setSummaryId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [techniqueId, setTechniqueId] = useState('');
  const [materialsId, setMaterialsId] = useState('');
  const [culturalMeaningId, setCulturalMeaningId] = useState('');

  // English Translations
  const [titleEn, setTitleEn] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [techniqueEn, setTechniqueEn] = useState('');
  const [materialsEn, setMaterialsEn] = useState('');
  const [culturalMeaningEn, setCulturalMeaningEn] = useState('');

  // Gallery
  const [galleryItems, setGalleryItems] = useState<GalleryDraftItem[]>([]);

  const draftKey = editingCraft ? `craft_${editingCraft.$id}` : 'craft_new';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [craftsRes, catsRes, contribsRes, mediaRelRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'crafts', [
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [Query.limit(100)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(100)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'craft_media', [Query.limit(200)]),
      ]);

      const rawCrafts = craftsRes.rows as unknown as Craft[];
      const counts: Record<string, number> = {};
      for (const rel of mediaRelRes.rows as any[]) {
        if (rel.craftId) counts[rel.craftId] = (counts[rel.craftId] || 0) + 1;
      }
      setMediaCounts(counts);

      const withTrans = await Promise.all(
        rawCrafts.map(async (c) => {
          try {
            const transRes = await tablesDB.listRows(
              APPWRITE_CONFIG.databaseId,
              'craft_translations',
              [Query.equal('craftId', c.$id)]
            );
            c.translations = transRes.rows as unknown as CraftTranslation[];
          } catch {
            c.translations = [];
          }
          return c;
        })
      );

      setCrafts(withTrans);
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
      craftType,
      status,
      isFeatured,
      categoryId,
      contributorId,
      titleId,
      summaryId,
      descriptionId,
      techniqueId,
      materialsId,
      culturalMeaningId,
      titleEn,
      summaryEn,
      descriptionEn,
      techniqueEn,
      materialsEn,
      culturalMeaningEn,
      galleryItems,
    });
  }, [
    modalOpen,
    draftKey,
    slug,
    craftType,
    status,
    isFeatured,
    categoryId,
    contributorId,
    titleId,
    summaryId,
    descriptionId,
    techniqueId,
    materialsId,
    culturalMeaningId,
    titleEn,
    summaryEn,
    descriptionEn,
    techniqueEn,
    materialsEn,
    culturalMeaningEn,
    galleryItems,
  ]);

  const applyDraft = (draft: CraftDraftState) => {
    setSlug(draft.slug || '');
    setCraftType(draft.craftType || 'tenun_gedogan');
    setStatus(draft.status || 'draft');
    setIsFeatured(Boolean(draft.isFeatured));
    setCategoryId(draft.categoryId || '');
    setContributorId(draft.contributorId || '');
    setTitleId(draft.titleId || '');
    setSummaryId(draft.summaryId || '');
    setDescriptionId(draft.descriptionId || '');
    setTechniqueId(draft.techniqueId || '');
    setMaterialsId(draft.materialsId || '');
    setCulturalMeaningId(draft.culturalMeaningId || '');
    setTitleEn(draft.titleEn || '');
    setSummaryEn(draft.summaryEn || '');
    setDescriptionEn(draft.descriptionEn || '');
    setTechniqueEn(draft.techniqueEn || '');
    setMaterialsEn(draft.materialsEn || '');
    setCulturalMeaningEn(draft.culturalMeaningEn || '');
    setGalleryItems(Array.isArray(draft.galleryItems) ? draft.galleryItems : []);
    setPendingDraft(null);
  };

  const openCreateModal = () => {
    const preferredCat = categories.find((c) => c.type === 'craft') || categories[0];
    setEditingCraft(null);
    setSlug('');
    setCraftType('tenun_gedogan');
    setStatus('draft');
    setIsFeatured(false);
    setCategoryId(preferredCat?.$id || '');
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
    setTechniqueEn('');
    setMaterialsEn('');
    setCulturalMeaningEn('');

    setGalleryItems([]);
    setPendingDraft(loadDraftFromSession<CraftDraftState>('craft_new'));
    setAlertMsg(null);
    setModalOpen(true);
  };

  const openEditModal = async (c: Craft) => {
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
    setTechniqueEn(enTrans?.technique || '');
    setMaterialsEn(enTrans?.materials || '');
    setCulturalMeaningEn(enTrans?.culturalMeaning || '');

    setGalleryItems([]);
    setPendingDraft(loadDraftFromSession<CraftDraftState>(`craft_${c.$id}`));
    setAlertMsg(null);
    setModalOpen(true);

    try {
      const attached = await loadEntityGallery('craft', c.$id);
      setGalleryItems(attached);
    } catch {
      setGalleryItems([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = slugifyInput(slug || titleId);
    const chosenCat = categoryId || categories.find((c) => c.type === 'craft')?.$id || categories[0]?.$id;
    if (!normalizedSlug || !titleId.trim() || !descriptionId.trim() || !chosenCat) {
      setAlertMsg({
        type: 'error',
        text: 'Mohon isi Slug, Kategori, Judul (ID), dan Uraian Lengkap (ID).',
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

      const craftPayload: Record<string, any> = {
        slug: normalizedSlug,
        craftType,
        status,
        isFeatured,
        categoryId: chosenCat,
        contributorId: contributorId || null,
      };

      if (canPublish && (status === 'published' || status === 'archived')) {
        craftPayload.reviewedById = userId;
      }

      let craftId = editingCraft?.$id;

      if (editingCraft) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'crafts',
          editingCraft.$id,
          craftPayload
        );
      } else {
        craftId = ID.unique();
        craftPayload.createdById = userId;
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'crafts',
          craftId,
          craftPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      // Indonesian translation
      const existingIdTrans = editingCraft?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        craftId: craftId!,
        locale: 'id',
        title: titleId.trim(),
        summary: summaryId.trim() || titleId.trim(),
        description: descriptionId.trim(),
        technique: techniqueId.trim() || null,
        materials: materialsId.trim() || null,
        culturalMeaning: culturalMeaningId.trim() || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'craft_translations',
          existingIdTrans.$id,
          idPayload
        );
      } else {
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'craft_translations',
          ID.unique(),
          idPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      // English translation
      if (
        titleEn.trim() ||
        descriptionEn.trim() ||
        summaryEn.trim() ||
        techniqueEn.trim() ||
        materialsEn.trim() ||
        culturalMeaningEn.trim()
      ) {
        const existingEnTrans = editingCraft?.translations?.find((t) => t.locale === 'en');
        const enPayload = {
          craftId: craftId!,
          locale: 'en',
          title: titleEn.trim() || titleId.trim(),
          summary: summaryEn.trim() || summaryId.trim() || titleEn.trim() || titleId.trim(),
          description: descriptionEn.trim() || descriptionId.trim(),
          technique: techniqueEn.trim() || null,
          materials: materialsEn.trim() || null,
          culturalMeaning: culturalMeaningEn.trim() || null,
        };

        if (existingEnTrans) {
          await tablesDB.updateRow(
            APPWRITE_CONFIG.databaseId,
            'craft_translations',
            existingEnTrans.$id,
            enPayload
          );
        } else {
          await tablesDB.createRow(
            APPWRITE_CONFIG.databaseId,
            'craft_translations',
            ID.unique(),
            enPayload,
            buildCreatorRowPermissions(userId)
          );
        }
      }

      await syncEntityGallery('craft', craftId!, galleryItems, userId);

      await recordAuditLog({
        actorUserId: userId,
        action:
          status === 'published'
            ? 'publish'
            : status === 'archived'
            ? 'archive'
            : editingCraft
            ? 'update'
            : 'create',
        entityType: 'craft',
        entityId: craftId!,
        changes: { slug: normalizedSlug, craftType, status, mediaCount: galleryItems.length },
      });

      clearDraftFromSession(draftKey);
      setAlertMsg({
        type: 'success',
        text: `Karya '${normalizedSlug}' berhasil disimpan!`,
      });
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Craft) => {
    if (!user) return;
    if (!canDelete) {
      if (!canPublish) {
        setAlertMsg({
          type: 'error',
          text: 'Akun KKN tidak diizinkan menghapus atau mengarsipkan karya.',
        });
        return;
      }
      if (confirm(`Ubah status '${c.slug}' menjadi 'archived'?`)) {
        try {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'crafts', c.$id, {
            status: 'archived',
            reviewedById: user.$id,
          });
          await recordAuditLog({
            actorUserId: user.$id,
            action: 'archive',
            entityType: 'craft',
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
        await cascadeDeleteEntityChildren('craft', c.$id);
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'crafts', c.$id);
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'delete',
          entityType: 'craft',
          entityId: c.$id,
          changes: { slug: c.slug },
        });
        setAlertMsg({ type: 'success', text: `Karya '${c.slug}' telah dihapus.` });
        await fetchData();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
      }
    }
  };

  const filtered = crafts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idTitle = c.translations?.find((t) => t.locale === 'id')?.title?.toLowerCase() || '';
    return c.slug.toLowerCase().includes(q) || idTitle.includes(q);
  });

  const isStatusLockedForKKN =
    !canPublish &&
    Boolean(editingCraft) &&
    (editingCraft?.status === 'published' || editingCraft?.status === 'archived');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-secondary" />
            <span>Manajemen Kerajinan & Tenun</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola kain tenun tradisional, Batik Sasambo, teknik pembuatan, bahan serat lokal, dan
            galeri media.
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
                  <th className="px-6 py-3.5">Nama Karya (ID / EN)</th>
                  <th className="px-6 py-3.5">Tipe Kriya</th>
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
                        {enTitle && <div className="text-[11px] text-muted">{enTitle}</div>}
                      </td>
                      <td className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">
                        {c.craftType}
                      </td>
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
                          title="Edit Karya"
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
                      Belum ada karya kerajinan / batik yang didokumentasikan.
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
        title={editingCraft ? `Sunting: ${editingCraft.slug}` : 'Tambah Karya Kerajinan Baru'}
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
              <span>Ditemukan draf lokal karya yang belum tersimpan.</span>
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
                placeholder="misal: batik-sasambo-pringgasela"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Tipe Kriya</label>
              <select
                value={craftType}
                onChange={(e) => setCraftType(e.target.value as CraftType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="tenun_gedogan">Tenun Gedogan (Tradisional)</option>
                <option value="tenun_sesek">Tenun Sesek</option>
                <option value="batik_sasambo">Batik Sasambo</option>
                <option value="anyaman">Anyaman / Kerajinan</option>
                <option value="lainnya">Lainnya</option>
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
              <label className="block font-semibold text-text mb-1">Kategori *</label>
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
              <label className="block font-semibold text-text mb-1">Pengrajin / Maestro</label>
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="">Pilih Pengrajin</option>
                {contributors.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <EntityMediaManager
            entityType="craft"
            items={galleryItems}
            onChange={setGalleryItems}
          />

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-secondary">
              1. Konten Bahasa Indonesia (Wajib)
            </h4>
            <div>
              <label className="block font-semibold text-text mb-1">Judul Karya (ID) *</label>
              <input
                type="text"
                value={titleId}
                onChange={(e) => {
                  setTitleId(e.target.value);
                  if (!editingCraft && !slug) setSlug(slugifyInput(e.target.value));
                }}
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
                <label className="block font-semibold text-text mb-1">Teknik Pembuatan (ID)</label>
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
            <div>
              <label className="block font-semibold text-text mb-1">
                Makna Kultural & Sumber Informasi (ID)
              </label>
              <textarea
                rows={2}
                value={culturalMeaningId}
                onChange={(e) => setCulturalMeaningId(e.target.value)}
                placeholder="Nilai budaya dalam masyarakat Sasak & catatan narasumber..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
          </div>

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-primary">
              2. English Translation (Opsional)
            </h4>
            <div>
              <label className="block font-semibold text-text mb-1">Craft Title (EN)</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Short Summary (EN)</label>
              <input
                type="text"
                value={summaryEn}
                onChange={(e) => setSummaryEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Full Description (EN)</label>
              <textarea
                rows={3}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Technique (EN)</label>
                <input
                  type="text"
                  value={techniqueEn}
                  onChange={(e) => setTechniqueEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
              <div>
                <label className="block font-semibold text-text mb-1">
                  Materials & Fibers (EN)
                </label>
                <input
                  type="text"
                  value={materialsEn}
                  onChange={(e) => setMaterialsEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Cultural Significance (EN)
              </label>
              <textarea
                rows={2}
                value={culturalMeaningEn}
                onChange={(e) => setCulturalMeaningEn(e.target.value)}
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
