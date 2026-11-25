import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, Users, MapPin, Upload, X, Lock, Globe } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { Contributor, ContributorType } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { MediaUploader } from '../../components/admin/MediaUploader';
import { AuthorizedMediaPreview } from '../../components/common/AuthorizedMediaPreview';
import { getFallbackImage } from '../../utils/media';
import { buildCreatorRowPermissions, formatAppwriteError, recordAuditLog } from '../../utils/audit';
import { fetchBucketFileAccessMap, setMediaFilePublicAccess, StorageAccessInfo } from '../../utils/mediaAccess';
import { slugifyInput } from '../../utils/cmsHelpers';

export const AdminContributorsPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContrib, setEditingContrib] = useState<Contributor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [accessMap, setAccessMap] = useState<Map<string, StorageAccessInfo>>(new Map());
  const [togglingPhoto, setTogglingPhoto] = useState(false);

  // Form
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ContributorType>('penenun');
  const [dusun, setDusun] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [photoFileId, setPhotoFileId] = useState('');
  const [bioId, setBioId] = useState('');
  const [bioEn, setBioEn] = useState('');

  const fetchContributors = async () => {
    try {
      setLoading(true);
      const [res, bucketAccess] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [
          Query.limit(100),
          Query.orderAsc('name'),
        ]),
        fetchBucketFileAccessMap(),
      ]);
      setContributors(res.rows as unknown as Contributor[]);
      setAccessMap(bucketAccess.byId);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  const openCreateModal = () => {
    setEditingContrib(null);
    setSlug('');
    setName('');
    setType('penenun');
    setDusun('');
    setExperienceYears('');
    setPhotoFileId('');
    setBioId('');
    setBioEn('');
    setShowPhotoUpload(false);
    setAlertMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (c: Contributor) => {
    setEditingContrib(c);
    setSlug(c.slug);
    setName(c.name);
    setType(c.type);
    setDusun(c.dusun || '');
    setExperienceYears(c.experienceYears ?? '');
    setPhotoFileId(c.photoFileId || '');
    setBioId(c.bioId || '');
    setBioEn(c.bioEn || '');
    setShowPhotoUpload(false);
    setAlertMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = slugifyInput(slug || name);
    if (!normalizedSlug || !name.trim()) {
      setAlertMsg({ type: 'error', text: 'Mohon isi kolom Slug dan Nama Tokoh.' });
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

      const payload = {
        slug: normalizedSlug,
        name: name.trim(),
        type,
        dusun: dusun.trim() || null,
        experienceYears: experienceYears !== '' ? Number(experienceYears) : null,
        photoFileId: photoFileId.trim() || null,
        bioId: bioId.trim() || null,
        bioEn: bioEn.trim() || null,
      };

      if (editingContrib) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'contributors',
          editingContrib.$id,
          payload
        );
        await recordAuditLog({
          actorUserId: userId,
          action: 'update',
          entityType: 'contributor',
          entityId: editingContrib.$id,
          changes: { slug: normalizedSlug, name: payload.name },
        });
      } else {
        const newId = ID.unique();
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'contributors',
          newId,
          payload,
          buildCreatorRowPermissions(userId)
        );
        await recordAuditLog({
          actorUserId: userId,
          action: 'create',
          entityType: 'contributor',
          entityId: newId,
          changes: { slug: normalizedSlug, name: payload.name },
        });
      }

      setAlertMsg({ type: 'success', text: `Data tokoh '${name}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchContributors();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Contributor) => {
    if (!user) return;
    if (!canDelete) {
      setAlertMsg({
        type: 'error',
        text: 'Hanya Super Admin yang diizinkan menghapus data tokoh adat / pengrajin.',
      });
      return;
    }
    if (confirm(`Yakin menghapus data '${c.name}'?`)) {
      try {
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'contributors', c.$id);
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'delete',
          entityType: 'contributor',
          entityId: c.$id,
          changes: { slug: c.slug, name: c.name },
        });
        setAlertMsg({ type: 'success', text: `Data '${c.name}' telah dihapus.` });
        await fetchContributors();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
      }
    }
  };

  const filtered = contributors.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.dusun?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Manajemen Tokoh Adat & Pengrajin Tenun</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola profil maestro penenun, tetua adat, pembatik Sasambo, dan informan budaya desa.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tokoh Baru</span>
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
          placeholder="Cari nama tokoh atau dusun..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil profil narasumber..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Tokoh</th>
                  <th className="px-6 py-3.5">Peran / Bidang</th>
                  <th className="px-6 py-3.5">Dusun</th>
                  <th className="px-6 py-3.5">Pengalaman</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((c) => {
                  const canEditRow =
                    canPublish ||
                    Boolean(user?.$id && c.$permissions?.some((p) => p.includes(user.$id)));
                  return (
                    <tr key={c.$id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-border shrink-0 bg-sand-100">
                            {c.photoFileId ? (
                              <AuthorizedMediaPreview
                                fileId={c.photoFileId}
                                mediaType="image"
                                isPublic={Boolean(accessMap.get(c.photoFileId)?.isPublic)}
                                alt={c.name}
                                width={80}
                                height={80}
                                controls={false}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={getFallbackImage('profile')}
                                alt={c.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-serif font-bold text-text text-sm">{c.name}</div>
                            <div className="font-mono text-[11px] text-muted">{c.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="primary" size="sm">
                          {c.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {c.dusun || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {c.experienceYears ? `${c.experienceYears} Tahun` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {canEditRow && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                            title="Edit Tokoh"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50"
                            title="Hapus Tokoh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingContrib
            ? `Sunting: ${editingContrib.name}`
            : 'Tambah Tokoh Adat / Pengrajin Baru'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {alertMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* Photo Portrait & Consent Notice */}
          <div className="p-4 rounded-xl bg-sand-50 border border-border space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-border bg-white shrink-0">
                  {photoFileId ? (
                    <AuthorizedMediaPreview
                      fileId={photoFileId}
                      mediaType="image"
                      isPublic={Boolean(accessMap.get(photoFileId)?.isPublic)}
                      alt={name || 'Profil Tokoh'}
                      width={120}
                      height={120}
                      controls={false}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={getFallbackImage('profile')}
                      alt={name || 'Profil Tokoh'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text">Foto Potret Narasumber (Opsional)</p>
                    {photoFileId && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          accessMap.get(photoFileId)?.isPublic
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {accessMap.get(photoFileId)?.isPublic ? (
                          <>
                            <Globe className="w-2.5 h-2.5" /> Foto Publik
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" /> Foto Privat (Belum Terbit)
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    Unggahan default berstatus Privat. Pastikan narasumber menyetujui sebelum foto
                    dipublikasikan ke website umum.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {photoFileId && canPublish && accessMap.get(photoFileId)?.exists && (
                  <button
                    type="button"
                    disabled={togglingPhoto}
                    onClick={async () => {
                      if (!user) return;
                      const nextPub = !accessMap.get(photoFileId)?.isPublic;
                      if (
                        !window.confirm(
                          nextPub
                            ? `Publikasikan foto potret '${name || 'tokoh'}'? Pastikan narasumber memberi persetujuan.`
                            : `Cabut akses publik foto potret '${name || 'tokoh'}' menjadi Privat?`
                        )
                      ) {
                        return;
                      }
                      try {
                        setTogglingPhoto(true);
                        const updated = await setMediaFilePublicAccess({
                          fileId: photoFileId,
                          makePublic: nextPub,
                          actorUserId: user.$id,
                          canPublish,
                          refreshAuth,
                        });
                        setAccessMap((prev) => new Map(prev).set(photoFileId, updated));
                      } catch (err: any) {
                        setAlertMsg({ type: 'error', text: err.message || 'Gagal memperbarui permission foto.' });
                      } finally {
                        setTogglingPhoto(false);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                      accessMap.get(photoFileId)?.isPublic
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    {togglingPhoto
                      ? '...'
                      : accessMap.get(photoFileId)?.isPublic
                      ? 'Privatkan'
                      : 'Publikasikan'}
                  </button>
                )}
                {photoFileId && (
                  <button
                    type="button"
                    onClick={() => setPhotoFileId('')}
                    className="p-1.5 rounded-lg border border-border text-rose-700 hover:bg-rose-50"
                    title="Lepas Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPhotoUpload((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary bg-white font-semibold hover:bg-primary/5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {showPhotoUpload ? 'Tutup Upload' : 'Unggah Foto'}
                </button>
              </div>
            </div>

            {showPhotoUpload && (
              <div className="pt-2 border-t border-border/60">
                <MediaUploader
                  allowedTypes="images"
                  defaultPublic={false}
                  onSuccess={async (asset) => {
                    setPhotoFileId(asset.fileId);
                    const fresh = await fetchBucketFileAccessMap();
                    setAccessMap(fresh.byId);
                    setShowPhotoUpload(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingContrib && !slug) setSlug(slugifyInput(e.target.value));
                }}
                placeholder="misal: Ibu Mariam"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                placeholder="misal: ibu-mariam"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Tipe Tokoh</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContributorType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="penenun">Penenun Tradisional</option>
                <option value="pembatik">Pembatik Sasambo</option>
                <option value="tokoh_adat">Tokoh Adat</option>
                <option value="peneliti">Peneliti Budaya</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Dusun Asal</label>
              <input
                type="text"
                value={dusun}
                onChange={(e) => setDusun(e.target.value)}
                placeholder="misal: Dusun Gubuk Timuk"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Lama Pengalaman (Thn)
              </label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) =>
                  setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="35"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Biografi Singkat (ID)</label>
            <textarea
              rows={3}
              value={bioId}
              onChange={(e) => setBioId(e.target.value)}
              placeholder="Riwayat keahlian menenun, dedikasi pelestarian motif kuno..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Short Biography (EN)</label>
            <textarea
              rows={2}
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
              placeholder="Master traditional weaver, preserver of ancestral motifs..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
            />
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
              className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Profil Tokoh'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
