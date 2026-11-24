// Appwrite Models and TablesDB Schema Types for Museum Digital Pringgasela Selatan

export type Locale = 'id' | 'en';

export type PublicationStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type AdminRole = 'super_admin' | 'admin_desa' | 'admin_kkn';

export type CraftType = 'tenun' | 'batik' | 'kerajinan_tangan' | 'lainnya';

export type ContributorType = 'penenun' | 'pembatik' | 'tokoh_adat' | 'peneliti' | 'lainnya';

export type CulturePeriodicity = 'rutin_mingguan' | 'tahunan' | 'siklus_hidup' | 'insidental';

export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface BaseEntity {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
  $databaseId?: string;
  $tableId?: string;
}

export interface Category extends BaseEntity {
  slug: string;
  type: 'craft' | 'motif' | 'culture' | 'history';
  nameId: string;
  nameEn: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface Profile extends BaseEntity {
  userId: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  avatarFileId?: string | null;
  institution?: string | null;
  bio?: string | null;
}

export interface Contributor extends BaseEntity {
  slug: string;
  name: string;
  type: ContributorType;
  dusun?: string | null;
  experienceYears?: number | null;
  photoFileId?: string | null;
  bioId?: string | null;
  bioEn?: string | null;
}

export interface Craft extends BaseEntity {
  slug: string;
  categoryId: string;
  craftType: CraftType;
  status: PublicationStatus;
  isFeatured: boolean;
  createdById: string;
  contributorId?: string | null;
  reviewedById?: string | null;
  translations?: CraftTranslation[];
  contributor?: Contributor | null;
  media?: Array<{ role: string; sortOrder: number; mediaAssetId: string }>;
}

export interface CraftTranslation extends BaseEntity {
  craftId: string;
  locale: Locale;
  title: string;
  summary: string;
  technique?: string | null;
  materials?: string | null;
  description: string;
  culturalMeaning?: string | null;
}

export interface WeavingMotif extends BaseEntity {
  slug: string;
  codeName?: string | null;
  status: PublicationStatus;
  isFeatured: boolean;
  categoryId?: string | null;
  primaryCraftId?: string | null;
  contributorId?: string | null;
  createdById: string;
  reviewedById?: string | null;
  translations?: MotifTranslation[];
  contributor?: Contributor | null;
  media?: Array<{ isPatternDiagram: boolean; sortOrder: number; mediaAssetId: string }>;
}

export interface MotifTranslation extends BaseEntity {
  motifId: string;
  locale: Locale;
  name: string;
  visualDescription?: string | null;
  philosophy: string;
  technique?: string | null;
  historicalUsage?: string | null;
  originStory?: string | null;
}

export interface Culture extends BaseEntity {
  slug: string;
  categoryId: string;
  periodicity: CulturePeriodicity;
  status: PublicationStatus;
  isFeatured: boolean;
  createdById: string;
  contributorId?: string | null;
  translations?: CultureTranslation[];
  media?: Array<{ isAudioChant: boolean; sortOrder: number; mediaAssetId: string }>;
}

export interface CultureTranslation extends BaseEntity {
  cultureId: string;
  locale: Locale;
  title: string;
  summary: string;
  description: string;
  ritualProcedure?: string | null;
  spiritualValue?: string | null;
}

export interface VillageHistory extends BaseEntity {
  slug: string;
  startYear?: number | null;
  endYear?: number | null;
  sortOrder: number;
  status: 'draft' | 'published';
  createdById: string;
  translations?: HistoryTranslation[];
}

export interface HistoryTranslation extends BaseEntity {
  historyId: string;
  locale: Locale;
  eraTitle: string;
  narrative: string;
  keyFigures?: string | null;
  legacyToday?: string | null;
}

export interface MediaAsset extends BaseEntity {
  fileId: string;
  bucketId: string;
  mediaType: MediaType;
  mimeType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  altTextId?: string | null;
  altTextEn?: string | null;
  captionId?: string | null;
  captionEn?: string | null;
  photographer?: string | null;
  createdById: string;
}

export interface CraftMedia extends BaseEntity {
  craftId: string;
  mediaAssetId: string;
  role: 'primary_photo' | 'gallery' | 'process_step';
  sortOrder: number;
}

export interface MotifMedia extends BaseEntity {
  motifId: string;
  mediaAssetId: string;
  isPatternDiagram: boolean;
  sortOrder: number;
}

export interface CultureMedia extends BaseEntity {
  cultureId: string;
  mediaAssetId: string;
  isAudioChant: boolean;
  sortOrder: number;
}

export interface AuditLog extends BaseEntity {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  changesJson?: string | null;
  ipAddress?: string | null;
}

export interface MuseumSetting extends BaseEntity {
  settingKey: string;
  settingValue: string;
  description?: string | null;
  updatedById: string;
}
