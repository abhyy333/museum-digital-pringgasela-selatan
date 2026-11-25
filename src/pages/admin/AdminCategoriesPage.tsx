import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, FolderTree, ShieldAlert } from 'lucide-react';
import { Query, Permission, Role } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { Category } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatAppwriteError, recordAuditLog } from '../../utils/audit';

type CategoryType = Category['type'];

const TYPE_LABELS: Record<CategoryType, string> = {
  motif: 'Motif Tenun',
  craft: 'Kerajinan Tangan',
  culture: 'Budaya & Tradisi',
  history: 'Sejarah Desa',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const AdminCategoriesPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [slug, setSlug] = useState('');
  const [type, setType] = useState<CategoryType>('motif');
  const [nameId, setNameId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [sortOrder, setSortOrder] = useState('1');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'categories', [
        Query.limit(100),
        Query.orderAsc('sortOrder'),
      ]);
      setCategories(res.rows as unknown as Category[]);
    } catch (err: any) {
      setError(formatAppwriteError(err, refreshAuth));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    if (!canPublish) return;
    setEditingCat(null);
    setSlug('');
    setType('motif');
    setNameId('');
    setNameEn('');
    setSortOrder(String(categories.length + 1));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    if (!canPublish) return;
    setEditingCat(cat);
    setSlug(cat.slug);
    setType(cat.type);
    setNameId(cat.nameId);
    setNameEn(cat.nameEn);
    setSortOrder(String(cat.sortOrder ?? 1));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish || !user) return;
    setSaving(true);
    setFormError(null);

    const normalizedSlug = slug.trim() || slugify(nameId);
    if (!normalizedSlug || !nameId.trim() || !nameEn.trim()) {
      setFormError('Slug, Nama (ID), dan Nama (EN) wajib diisi.');
      setSaving(false);
      return;
    }

    const parsedOrder = Number.parseInt(sortOrder, 10);
    const payload = {
      slug: normalizedSlug,
      type,
      nameId: nameId.trim(),
      nameEn: nameEn.trim(),
      sortOrder: Number.isNaN(parsedOrder) ? 1 : parsedOrder,
    };

    try {
      if (editingCat) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'categories', editingCat.$id, payload);
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'update',
          entityType: 'category',
          entityId: editingCat.$id,
          changes: payload,
        });
      } else {
        const rowId = `cat-${normalizedSlug}`.slice(0, 36);
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'categories',
          rowId,
          payload,
          [Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId))]
        );
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'create',
          entityType: 'category',
          entityId: rowId,
          changes: payload,
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(formatAppwriteError(err, refreshAuth));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!canDelete || !user) return;
    if (
      !window.confirm(
        `Hapus kategori "${cat.nameId}"? Pastikan tidak ada koleksi aktif yang masih bergantung pada kategori ini.`
      )
    ) {
      return;
    }

    try {
      await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'categories', cat.$id);
      await recordAuditLog({
        actorUserId: user.$id,
        action: 'delete',
        entityType: 'category',
        entityId: cat.$id,
        changes: { slug: cat.slug, nameId: cat.nameId },
      });
      await fetchData();
    } catch (err: any) {
      alert(formatAppwriteError(err, refreshAuth));
    }
  };

  const filtered = categories.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.nameId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-primary" />
            Manajemen Kategori Budaya
          </h1>
          <p className="text-sm text-muted mt-1">
            Taksonomi resmi untuk Motif Tenun, Kerajinan, Tradisi Budaya, dan Era Sejarah.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        )}
      </div>

      {!canPublish && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
          <p>
            Akun Tim KKN hanya memiliki izin baca pada tabel kategori. Penambahan atau perubahan
            taksonomi kategori dilakukan oleh Admin Desa atau Super Admin.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau slug kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none"
        >
          <option value="all">Semua Tipe</option>
          <option value="motif">Motif Tenun</option>
          <option value="craft">Kerajinan Tangan</option>
          <option value="culture">Budaya & Tradisi</option>
          <option value="history">Sejarah Desa</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-surface p-12 rounded-2xl border border-border">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-sand-50/70 text-xs font-semibold text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-5">Urutan</th>
                  <th className="py-3.5 px-5">Nama (ID / EN)</th>
                  <th className="py-3.5 px-5">Slug</th>
                  <th className="py-3.5 px-5">Tipe Entitas</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted">
                      Belum ada kategori yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.$id} className="hover:bg-sand-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-muted">
                        #{cat.sortOrder ?? 0}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-text">{cat.nameId}</div>
                        <div className="text-xs text-muted">{cat.nameEn}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-muted">{cat.slug}</td>
                      <td className="py-3.5 px-5">
                        <Badge variant="secondary" size="sm">
                          {TYPE_LABELS[cat.type] || cat.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1">
                        {canPublish && (
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-2 text-muted hover:text-primary rounded-lg hover:bg-sand-100 transition-colors"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-2 text-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? 'Edit Kategori Budaya' : 'Tambah Kategori Budaya'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Tipe Entitas *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CategoryType)}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-xl text-sm"
              >
                <option value="motif">Motif Tenun</option>
                <option value="craft">Kerajinan Tangan</option>
                <option value="culture">Budaya & Tradisi</option>
                <option value="history">Sejarah Desa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Urutan Tampil</label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Nama Indonesia *
              </label>
              <input
                type="text"
                required
                value={nameId}
                onChange={(e) => {
                  setNameId(e.target.value);
                  if (!editingCat && !slug) {
                    setSlug(slugify(e.target.value));
                  }
                }}
                placeholder="Mis. Motif Geometris Kuno"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Nama Inggris *</label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Ancient Geometric Motifs"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Slug URL *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="motif-geometris-kuno"
              className="w-full px-3.5 py-2 bg-white border border-border rounded-xl text-sm font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-muted hover:text-text rounded-xl border border-border"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : editingCat ? 'Simpan Perubahan' : 'Buat Kategori'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
