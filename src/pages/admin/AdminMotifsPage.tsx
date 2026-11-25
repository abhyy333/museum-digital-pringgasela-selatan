import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import {
  WeavingMotif,
  MotifTranslation,
  Category,
  Contributor,
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

interface MotifDraftState {
  slug: string;
  codeName: string;
  status: PublicationStatus;
  isFeatured: boolean;
  categoryId: string;
  contributorId: string;
  nameId: string;
  visualDescId: string;
  philosophyId: string;
  techniqueId: string;
  historicalUsageId: string;
  originStoryId: string;
  nameEn: string;
  visualDescEn: string;
  philosophyEn: string;
  techniqueEn: string;
  historicalUsageEn: string;
  originStoryEn: string;
  galleryItems: GalleryDraftItem[];
}

export const AdminMotifsPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [mediaCounts, setMediaCounts] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotif, setEditingMotif] = useState<WeavingMotif | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDraft, setPendingDraft] = useState<MotifDraftState | null>(null);

  // Core Form State
  const [slug, setSlug] = useState('');
  const [codeName, setCodeName] = useState('');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [contributorId, setContributorId] = useState('');

  // Indonesian Translations
  const [nameId, setNameId] = useState('');
  const [visualDescId, setVisualDescId] = useState('');
  const [philosophyId, setPhilosophyId] = useState('');
  const [techniqueId, setTechniqueId] = useState('');
  const [historicalUsageId, setHistoricalUsageId] = useState('');
  const [originStoryId, setOriginStoryId] = useState('');

  // English Translations
  const [nameEn, setNameEn] = useState('');
  const [visualDescEn, setVisualDescEn] = useState('');
  const [philosophyEn, setPhilosophyEn] = useState('');
  const [techniqueEn, setTechniqueEn] = useState('');
  const [historicalUsageEn, setHistoricalUsageEn] = useState('');
  const [originStoryEn, setOriginStoryEn] = useState('');

  // Attached Media Gallery
  const [galleryItems, setGalleryItems] = useState<GalleryDraftItem[]>([]);

  const draftKey = editingMotif ? `motif_${editingMotif.$id}` : 'motif_new';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [motifsRes, catsRes, contribsRes, mediaRelRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'weaving_motifs', [
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [Query.limit(100)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(100)]),
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'motif_media', [Query.limit(200)]),
      ]);

      const rawMotifs = motifsRes.rows as unknown as WeavingMotif[];
      const counts: Record<string, number> = {};
      for (const rel of mediaRelRes.rows as any[]) {
        if (rel.motifId) counts[rel.motifId] = (counts[rel.motifId] || 0) + 1;
      }
      setMediaCounts(counts);

      const withTrans = await Promise.all(
        rawMotifs.map(async (m) => {
          try {
            const transRes = await tablesDB.listRows(
              APPWRITE_CONFIG.databaseId,
              'motif_translations',
              [Query.equal('motifId', m.$id)]
            );
            m.translations = transRes.rows as unknown as MotifTranslation[];
          } catch {
            m.translations = [];
          }
          return m;
        })
      );

      setMotifs(withTrans);
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

  // Persist open modal inputs to sessionStorage
  useEffect(() => {
    if (!modalOpen) return;
    if (!slug && !nameId && !philosophyId && galleryItems.length === 0) return;
    saveDraftToSession(draftKey, {
      slug,
      codeName,
      status,
      isFeatured,
      categoryId,
      contributorId,
      nameId,
      visualDescId,
      philosophyId,
      techniqueId,
      historicalUsageId,
      originStoryId,
      nameEn,
      visualDescEn,
      philosophyEn,
      techniqueEn,
      historicalUsageEn,
      originStoryEn,
      galleryItems,
    });
  }, [
    modalOpen,
    draftKey,
    slug,
    codeName,
    status,
    isFeatured,
    categoryId,
    contributorId,
    nameId,
    visualDescId,
    philosophyId,
    techniqueId,
    historicalUsageId,
    originStoryId,
    nameEn,
    visualDescEn,
    philosophyEn,
    techniqueEn,
    historicalUsageEn,
    originStoryEn,
    galleryItems,
  ]);

  const applyDraft = (draft: MotifDraftState) => {
    setSlug(draft.slug || '');
    setCodeName(draft.codeName || '');
    setStatus(draft.status || 'draft');
    setIsFeatured(Boolean(draft.isFeatured));
    setCategoryId(draft.categoryId || '');
    setContributorId(draft.contributorId || '');
    setNameId(draft.nameId || '');
    setVisualDescId(draft.visualDescId || '');
    setPhilosophyId(draft.philosophyId || '');
    setTechniqueId(draft.techniqueId || '');
    setHistoricalUsageId(draft.historicalUsageId || '');
    setOriginStoryId(draft.originStoryId || '');
    setNameEn(draft.nameEn || '');
    setVisualDescEn(draft.visualDescEn || '');
    setPhilosophyEn(draft.philosophyEn || '');
    setTechniqueEn(draft.techniqueEn || '');
    setHistoricalUsageEn(draft.historicalUsageEn || '');
    setOriginStoryEn(draft.originStoryEn || '');
    setGalleryItems(Array.isArray(draft.galleryItems) ? draft.galleryItems : []);
    setPendingDraft(null);
  };

  const openCreateModal = () => {
    const preferredCat =
      categories.find((c) => c.type === 'motif') || categories[0];

    setEditingMotif(null);
    setSlug('');
    setCodeName('');
    setStatus('draft');
    setIsFeatured(false);
    setCategoryId(preferredCat?.$id || '');
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

    setGalleryItems([]);
    setPendingDraft(loadDraftFromSession<MotifDraftState>('motif_new'));
    setAlertMsg(null);
    setModalOpen(true);
  };

  const openEditModal = async (m: WeavingMotif) => {
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

    setGalleryItems([]);
    setPendingDraft(loadDraftFromSession<MotifDraftState>(`motif_${m.$id}`));
    setAlertMsg(null);
    setModalOpen(true);

    try {
      const attached = await loadEntityGallery('motif', m.$id);
      setGalleryItems(attached);
    } catch {
      setGalleryItems([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = slugifyInput(slug || nameId);
    if (!normalizedSlug || !nameId.trim() || !philosophyId.trim()) {
      setAlertMsg({
        type: 'error',
        text: 'Mohon isi kolom Slug, Nama Motif (ID), dan Filosofi (ID).',
      });
      return;
    }

    if (!canPublish && (status === 'published' || status === 'archived')) {
      setAlertMsg({
        type: 'error',
        text: 'Akun KKN hanya dapat menyimpan status Draft atau In Review. Hubungi Admin Desa untuk publikasi.',
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

      const motifPayload: Record<string, any> = {
        slug: normalizedSlug,
        codeName: codeName.trim() || null,
        status,
        isFeatured,
        categoryId: categoryId || null,
        contributorId: contributorId || null,
      };

      if (canPublish && (status === 'published' || status === 'archived')) {
        motifPayload.reviewedById = userId;
      }

      let motifId = editingMotif?.$id;

      if (editingMotif) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'weaving_motifs',
          editingMotif.$id,
          motifPayload
        );
      } else {
        motifId = ID.unique();
        motifPayload.createdById = userId;
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'weaving_motifs',
          motifId,
          motifPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      // Indonesian translation (required)
      const existingIdTrans = editingMotif?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        motifId: motifId!,
        locale: 'id',
        name: nameId.trim(),
        visualDescription: visualDescId.trim() || null,
        philosophy: philosophyId.trim(),
        technique: techniqueId.trim() || null,
        historicalUsage: historicalUsageId.trim() || null,
        originStory: originStoryId.trim() || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'motif_translations',
          existingIdTrans.$id,
          idPayload
        );
      } else {
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'motif_translations',
          ID.unique(),
          idPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      // English translation (optional)
      if (
        nameEn.trim() ||
        philosophyEn.trim() ||
        visualDescEn.trim() ||
        techniqueEn.trim() ||
        historicalUsageEn.trim() ||
        originStoryEn.trim()
      ) {
        const existingEnTrans = editingMotif?.translations?.find((t) => t.locale === 'en');
        const enPayload = {
          motifId: motifId!,
          locale: 'en',
          name: nameEn.trim() || nameId.trim(),
          visualDescription: visualDescEn.trim() || null,
          philosophy: philosophyEn.trim() || philosophyId.trim(),
          technique: techniqueEn.trim() || null,
          historicalUsage: historicalUsageEn.trim() || null,
          originStory: originStoryEn.trim() || null,
        };

        if (existingEnTrans) {
          await tablesDB.updateRow(
            APPWRITE_CONFIG.databaseId,
            'motif_translations',
            existingEnTrans.$id,
            enPayload
          );
        } else {
          await tablesDB.createRow(
            APPWRITE_CONFIG.databaseId,
            'motif_translations',
            ID.unique(),
            enPayload,
            buildCreatorRowPermissions(userId)
          );
        }
      }

      // Sync ordered multi-photo gallery & pattern diagrams
      await syncEntityGallery('motif', motifId!, galleryItems, userId);

      await recordAuditLog({
        actorUserId: userId,
        action:
          status === 'published'
            ? 'publish'
            : status === 'archived'
            ? 'archive'
            : editingMotif
            ? 'update'
            : 'create',
        entityType: 'weaving_motif',
        entityId: motifId!,
        changes: { slug: normalizedSlug, status, mediaCount: galleryItems.length },
      });

      clearDraftFromSession(draftKey);
      setAlertMsg({
        type: 'success',
        text: `Motif '${normalizedSlug}' dan ${galleryItems.length} media berhasil disimpan!`,
      });
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: WeavingMotif) => {
    if (!user) return;
    if (!canDelete) {
      if (!canPublish) {
        setAlertMsg({
          type: 'error',
          text: 'Akun KKN tidak dapat menghapus atau mengarsipkan motif. Ajukan ke Admin Desa atau Super Admin.',
        });
        return;
      }
      if (
        confirm(
          `Anda tidak memiliki wewenang hard-delete (hanya Super Admin). Ubah status '${m.slug}' menjadi 'archived'?`
        )
      ) {
        try {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'weaving_motifs', m.$id, {
            status: 'archived',
            reviewedById: user.$id,
          });
          await recordAuditLog({
            actorUserId: user.$id,
            action: 'archive',
            entityType: 'weaving_motif',
            entityId: m.$id,
            changes: { slug: m.slug },
          });
          setAlertMsg({ type: 'success', text: `Motif '${m.slug}' diarsipkan.` });
          await fetchData();
        } catch (err: any) {
          setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
        }
      }
      return;
    }

    if (
      confirm(
        `YAKIN menghapus permanen motif '${m.slug}' beserta seluruh terjemahan dan relasi medianya? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      try {
        await cascadeDeleteEntityChildren('motif', m.$id);
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'weaving_motifs', m.$id);
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'delete',
          entityType: 'weaving_motif',
          entityId: m.$id,
          changes: { slug: m.slug },
        });
        setAlertMsg({ type: 'success', text: `Motif '${m.slug}' telah dihapus permanen.` });
        await fetchData();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
      }
    }
  };

  const filtered = motifs.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idName = m.translations?.find((t) => t.locale === 'id')?.name?.toLowerCase() || '';
    return (
      m.slug.toLowerCase().includes(q) ||
      m.codeName?.toLowerCase().includes(q) ||
      idName.includes(q)
    );
  });

  const isStatusLockedForKKN =
    !canPublish &&
    Boolean(editingMotif) &&
    (editingMotif?.status === 'published' || editingMotif?.status === 'archived');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Manajemen Ensiklopedia Motif</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola dokumentasi motif tenun, galeri foto multi-sudut, diagram pola, filosofi bilingual,
            dan atribusi penenun.
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
          placeholder="Cari slug motif, nama, atau kode..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil daftar motif tenun..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Kode</th>
                  <th className="px-6 py-3.5">Nama Motif (ID / EN)</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Media</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Unggulan</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((m) => {
                  const idName = m.translations?.find((t) => t.locale === 'id')?.name || '-';
                  const enName = m.translations?.find((t) => t.locale === 'en')?.name;
                  const count = mediaCounts[m.$id] || 0;
                  return (
                    <tr key={m.$id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-text">
                        {m.codeName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-serif font-bold text-text text-sm">{idName}</div>
                        {enName ? (
                          <div className="text-[11px] text-muted">{enName}</div>
                        ) : (
                          <div className="text-[10px] text-amber-700">Belum ada terjemahan EN</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted font-mono">{m.slug}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-mono text-muted">
                          <ImageIcon className="w-3.5 h-3.5" /> {count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            m.status === 'published'
                              ? 'success'
                              : m.status === 'in_review'
                              ? 'warning'
                              : 'neutral'
                          }
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
                        {(canDelete || canPublish) && (
                          <button
                            onClick={() => handleDelete(m)}
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors"
                            title={canDelete ? 'Hapus Permanen' : 'Arsipkan Motif'}
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
                    <td colSpan={7} className="px-6 py-8 text-center text-muted">
                      Tidak ada data motif tenun yang ditemukan.
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
          editingMotif
            ? `Sunting Motif: ${editingMotif.slug}`
            : 'Dokumentasikan Motif Tenun Baru'
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {alertMsg && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 ${
                alertMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
          )}

          {pendingDraft && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-amber-900">
              <span>Ditemukan draf lokal yang belum tersimpan ke server.</span>
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

          {/* Row 1: Core Identifier & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                placeholder="misal: motif-subahnale"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-mono"
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
                disabled={isStatusLockedForKKN}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-medium disabled:opacity-60"
              >
                <option value="draft">Draft (Draf Peneliti)</option>
                <option value="in_review">In Review (Ajukan Verifikasi)</option>
                <option value="published" disabled={!canPublish}>
                  Published (Terbit Publik{!canPublish ? ' — Admin Desa' : ''})
                </option>
                <option value="archived" disabled={!canPublish}>
                  Archived (Arsip{!canPublish ? ' — Admin Desa' : ''})
                </option>
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
                    {c.nameId} ({c.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Atribusi Pengrajin / Tetua Adat
              </label>
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

          {/* Gallery & Diagram Attachments */}
          <EntityMediaManager
            entityType="motif"
            items={galleryItems}
            onChange={setGalleryItems}
          />

          {/* BILINGUAL CONTENT */}
          <div className="border-t border-border pt-4 space-y-6">
            <div className="bg-sand-50 p-5 rounded-2xl border border-border space-y-4">
              <h4 className="font-serif text-sm font-bold text-primary uppercase tracking-wider">
                1. Konten Bahasa Indonesia (Wajib)
              </h4>

              <div>
                <label className="block font-semibold text-text mb-1">Nama Motif (ID) *</label>
                <input
                  type="text"
                  value={nameId}
                  onChange={(e) => {
                    setNameId(e.target.value);
                    if (!editingMotif && !slug) setSlug(slugifyInput(e.target.value));
                  }}
                  placeholder="misal: Motif Subahnale"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden font-serif font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">
                  Filosofi & Makna Spiritual (ID) *
                </label>
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
                  <label className="block font-semibold text-text mb-1">
                    Morfologi & Deskripsi Visual (ID)
                  </label>
                  <textarea
                    rows={2}
                    value={visualDescId}
                    onChange={(e) => setVisualDescId(e.target.value)}
                    placeholder="Pola belah ketupat bertingkat, garis melintang..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Teknik & Mekanika Tenun (ID)
                  </label>
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
                  <label className="block font-semibold text-text mb-1">
                    Penggunaan Adat & Ritual (ID)
                  </label>
                  <input
                    type="text"
                    value={historicalUsageId}
                    onChange={(e) => setHistoricalUsageId(e.target.value)}
                    placeholder="Upacara daur hidup, pernikahan..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Asal-Usul & Sumber Lisan (ID)
                  </label>
                  <input
                    type="text"
                    value={originStoryId}
                    onChange={(e) => setOriginStoryId(e.target.value)}
                    placeholder="Riwayat leluhur & nama narasumber..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="bg-sand-50 p-5 rounded-2xl border border-border space-y-4">
              <h4 className="font-serif text-sm font-bold text-secondary uppercase tracking-wider">
                2. English Translation (Opsional — Wajib Lengkap Sebelum Terbit Internasional)
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
                <label className="block font-semibold text-text mb-1">
                  Philosophy & Spiritual Meaning (EN)
                </label>
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
                  <label className="block font-semibold text-text mb-1">
                    Visual Morphology (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={visualDescEn}
                    onChange={(e) => setVisualDescEn(e.target.value)}
                    placeholder="Stepped rhombus pattern, symmetric layout..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Weaving Technique (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={techniqueEn}
                    onChange={(e) => setTechniqueEn(e.target.value)}
                    placeholder="Handwoven on backstrap loom, natural dye..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Historical & Ritual Usage (EN)
                  </label>
                  <input
                    type="text"
                    value={historicalUsageEn}
                    onChange={(e) => setHistoricalUsageEn(e.target.value)}
                    placeholder="Sasak wedding ceremonies, royal receptions..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Origin Story & Oral Attribution (EN)
                  </label>
                  <input
                    type="text"
                    value={originStoryEn}
                    onChange={(e) => setOriginStoryEn(e.target.value)}
                    placeholder="Inherited since Selaparang era..."
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
