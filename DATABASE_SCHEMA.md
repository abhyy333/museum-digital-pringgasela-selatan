# DATABASE SCHEMA SPECIFICATION
**Project:** Museum Digital Pringgasela Selatan  
**Database ID:** `museum_digital`  
**Engine:** Appwrite TablesDB  
**Tables Count:** 17  

---

## 1. Table: `profiles`
User profiles extending Appwrite Authentication users.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | string | 36 | Yes | - | Appwrite Auth user `$id` (Unique) |
| `fullName` | string | 128 | Yes | - | Full legal or display name |
| `role` | enum | `super_admin`, `admin_desa`, `admin_kkn` | Yes | `admin_kkn` | Administrative role |
| `avatarFileId` | string | 36 | No | null | File ID in `museum-public` bucket |
| `institution` | string | 128 | No | null | E.g., Universitas Mataram KKN, Pemerintah Desa |
| `bio` | string | 500 | No | null | Brief profile description |
| `isActive` | boolean | - | Yes | true | Account activity switch |

* **Indexes:**
  * `idx_profiles_userId`: Unique (`userId`)
  * `idx_profiles_role`: Key (`role`)

---

## 2. Table: `categories`
Hierarchical taxonomy for cultural assets.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | string | 64 | Yes | - | URL-safe identifier (Unique) |
| `nameId` | string | 100 | Yes | - | Category title in Indonesian |
| `nameEn` | string | 100 | Yes | - | Category title in English |
| `type` | enum | `craft`, `motif`, `culture`, `history` | Yes | `craft` | Category domain |
| `parentId` | string | 36 | No | null | Parent category ID for nesting |
| `sortOrder` | integer | - | Yes | 0 | Display priority |

* **Indexes:**
  * `idx_categories_slug`: Unique (`slug`)
  * `idx_categories_type`: Key (`type`, `sortOrder`)

---

## 3. Table: `contributors`
Masters, artisans, elders, and cultural custodians.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | string | 64 | Yes | - | URL-safe identifier (Unique) |
| `name` | string | 128 | Yes | - | Full name of artisan / elder / contributor |
| `type` | enum | `penenun`, `pembatik`, `tokoh_adat`, `peneliti`, `lainnya` | Yes | `penenun` | Contributor classification |
| `dusun` | string | 64 | No | null | Hamlet in Pringgasela Selatan |
| `experienceYears`| integer | - | No | null | Years practicing craft / tradition |
| `photoFileId` | string | 36 | No | null | Photo file ID in `museum-public` |
| `bioId` | string | 2000 | No | null | Biography in Indonesian |
| `bioEn` | string | 2000 | No | null | Biography in English |

* **Indexes:**
  * `idx_contributors_slug`: Unique (`slug`)
  * `idx_contributors_type`: Key (`type`)

---

## 4. Table: `crafts`
Traditional craft master records (Tenun Pringgasela, Batik Sasambo, etc.).

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | string | 96 | Yes | - | Canonical URL slug (Unique) |
| `categoryId` | string | 36 | Yes | - | Foreign key to `categories.$id` |
| `contributorId`| string | 36 | No | null | Foreign key to `contributors.$id` |
| `craftType` | enum | `tenun_gedogan`, `tenun_sesek`, `batik_sasambo`, `anyaman`, `lainnya` | Yes | `tenun_gedogan` | Technical category |
| `status` | enum | `draft`, `in_review`, `published`, `archived` | Yes | `draft` | Publication status |
| `isFeatured` | boolean | - | Yes | false | Display on home showcase |
| `createdById` | string | 36 | Yes | - | Foreign key to `profiles.userId` |
| `reviewedById`| string | 36 | No | null | Foreign key to `profiles.userId` |

* **Indexes:**
  * `idx_crafts_slug`: Unique (`slug`)
  * `idx_crafts_status_created`: Key (`status`, `$createdAt`)
  * `idx_crafts_category`: Key (`categoryId`)

---

## 5. Table: `craft_translations`
Localized text for crafts.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `craftId` | string | 36 | Yes | - | Foreign key to `crafts.$id` |
| `locale` | enum | `id`, `en` | Yes | `id` | Language code |
| `title` | string | 150 | Yes | - | Craft piece name / title |
| `summary` | string | 350 | Yes | - | Short introductory summary |
| `description` | string | 10000 | Yes | - | Comprehensive article / documentation |
| `technique` | string | 3000 | No | null | Weaving/dyeing technique description |
| `materials` | string | 2000 | No | null | Natural dyes, cotton threads, tools |
| `culturalMeaning`| string| 3000 | No | null | Cultural and philosophical significance |

* **Indexes:**
  * `idx_craft_trans_unique`: Unique (`craftId`, `locale`)

---

## 6. Table: `weaving_motifs`
Granular catalog of traditional weaving patterns.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | string | 96 | Yes | - | Unique pattern slug |
| `codeName` | string | 32 | No | null | Traditional catalog code |
| `status` | enum | `draft`, `in_review`, `published`, `archived` | Yes | `draft` | Content status |
| `isFeatured` | boolean | - | Yes | false | Display on home motifs wall |
| `primaryCraftId`| string | 36 | No | null | Optional link to representative craft |
| `createdById` | string | 36 | Yes | - | Foreign key to `profiles.userId` |

* **Indexes:**
  * `idx_motifs_slug`: Unique (`slug`)
  * `idx_motifs_status`: Key (`status`)

---

## 7. Table: `motif_translations`
Localized content for motifs.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `motifId` | string | 36 | Yes | - | Foreign key to `weaving_motifs.$id` |
| `locale` | enum | `id`, `en` | Yes | `id` | Language code |
| `name` | string | 120 | Yes | - | Motif name (e.g. Sari Menanti, Bayan Duri) |
| `philosophy` | string | 5000 | Yes | - | Philosophical and moral values encoded |
| `historicalUsage`| string| 3000 | No | null | Ceremonial / royal / customary usage |
| `originStory` | string | 5000 | No | null | Legend or history of motif creation |

* **Indexes:**
  * `idx_motif_trans_unique`: Unique (`motifId`, `locale`)

---

## 8. Table: `cultures`
Intangible heritage (Dzikir Saman, traditions, rituals).

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | string | 96 | Yes | - | Canonical URL slug (Unique) |
| `categoryId` | string | 36 | Yes | - | Foreign key to `categories.$id` |
| `periodicity` | enum | `rutin_mingguan`, `tahunan`, `siklus_hidup`, `insidental` | Yes | `tahunan` | Occurrence schedule |
| `status` | enum | `draft`, `in_review`, `published`, `archived` | Yes | `draft` | Publication status |
| `isFeatured` | boolean | - | Yes | false | Showcase on portal |
| `createdById` | string | 36 | Yes | - | Foreign key to `profiles.userId` |

* **Indexes:**
  * `idx_cultures_slug`: Unique (`slug`)
  * `idx_cultures_status`: Key (`status`)

---

## 9. Table: `culture_translations`
Localized content for cultural traditions and Dzikir Saman.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cultureId` | string | 36 | Yes | - | Foreign key to `cultures.$id` |
| `locale` | enum | `id`, `en` | Yes | `id` | Language code |
| `title` | string | 150 | Yes | - | Tradition title (e.g. Dzikir Saman) |
| `summary` | string | 350 | Yes | - | Summary description |
| `description` | string | 10000 | Yes | - | Complete historical & cultural writeup |
| `ritualProcedure`| string| 5000 | No | null | Step-by-step custom / performance flow |
| `spiritualValue`| string | 3000 | No | null | Spiritual and religious synergy |

* **Indexes:**
  * `idx_culture_trans_unique`: Unique (`cultureId`, `locale`)

---

## 10. Table: `village_history`
Chronological eras, historical milestones, and narratives.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | string | 96 | Yes | - | Unique era slug |
| `startYear` | integer | - | No | null | Approximate start year / century |
| `endYear` | integer | - | No | null | Approximate end year (or null if ongoing) |
| `sortOrder` | integer | - | Yes | 0 | Chronological order |
| `status` | enum | `draft`, `in_review`, `published`, `archived` | Yes | `draft` | Status |
| `createdById` | string | 36 | Yes | - | Author profile ID |

* **Indexes:**
  * `idx_history_slug`: Unique (`slug`)
  * `idx_history_sort`: Key (`sortOrder`, `status`)

---

## 11. Table: `history_translations`
Localized content for village historical milestones.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `historyId` | string | 36 | Yes | - | Foreign key to `village_history.$id` |
| `locale` | enum | `id`, `en` | Yes | `id` | Language code |
| `eraTitle` | string | 150 | Yes | - | Era or event title |
| `narrative` | string | 10000 | Yes | - | Historical narrative and documentation |
| `keyFigures` | string | 2000 | No | null | Prominent figures / leaders during this era |
| `legacyToday` | string | 2000 | No | null | Influence on modern Pringgasela Selatan |

* **Indexes:**
  * `idx_hist_trans_unique`: Unique (`historyId`, `locale`)

---

## 12. Table: `media_assets`
Centralized repository for digital museum assets.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fileId` | string | 36 | Yes | - | Appwrite Storage file `$id` |
| `bucketId` | enum | `museum-public`, `museum-private` | Yes | `museum-public`| Storage bucket |
| `mediaType` | enum | `image`, `video`, `audio`, `document` | Yes | `image` | Asset format |
| `mimeType` | string | 64 | Yes | - | MIME string (e.g. image/webp) |
| `fileSizeBytes`| integer | - | Yes | - | Exact file size in bytes |
| `width` | integer | - | No | null | Image/video pixel width |
| `height` | integer | - | No | null | Image/video pixel height |
| `durationSeconds`| integer| - | No | null | Audio/video duration |
| `altTextId` | string | 255 | No | null | Accessibility alt text (Indonesian) |
| `altTextEn` | string | 255 | No | null | Accessibility alt text (English) |
| `captionId` | string | 500 | No | null | Caption in Indonesian |
| `captionEn` | string | 500 | No | null | Caption in English |
| `photographer` | string | 128 | No | null | Photo / media creator credit |
| `createdById` | string | 36 | Yes | - | Author profile ID |

* **Indexes:**
  * `idx_media_fileId`: Unique (`fileId`)
  * `idx_media_type`: Key (`mediaType`, `bucketId`)

---

## 13. Table: `craft_media`
Junction table linking crafts with media assets.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `craftId` | string | 36 | Yes | - | Foreign key to `crafts.$id` |
| `mediaAssetId` | string | 36 | Yes | - | Foreign key to `media_assets.$id` |
| `role` | enum | `cover`, `gallery`, `process`, `close_up` | Yes | `gallery` | Media usage role |
| `sortOrder` | integer | - | Yes | 0 | Ordering sequence |

* **Indexes:**
  * `idx_craft_media_unique`: Unique (`craftId`, `mediaAssetId`)

---

## 14. Table: `motif_media`
Junction table linking weaving motifs with diagrams and photos.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `motifId` | string | 36 | Yes | - | Foreign key to `weaving_motifs.$id` |
| `mediaAssetId` | string | 36 | Yes | - | Foreign key to `media_assets.$id` |
| `isPatternDiagram`| boolean | - | Yes | false | True if vector/diagram of motif structure |
| `sortOrder` | integer | - | Yes | 0 | Ordering sequence |

* **Indexes:**
  * `idx_motif_media_unique`: Unique (`motifId`, `mediaAssetId`)

---

## 15. Table: `culture_media`
Junction table linking cultures with photos, audio, and video recordings.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cultureId` | string | 36 | Yes | - | Foreign key to `cultures.$id` |
| `mediaAssetId` | string | 36 | Yes | - | Foreign key to `media_assets.$id` |
| `isAudioChant` | boolean | - | Yes | false | True if Saman vocal chant audio recording |
| `sortOrder` | integer | - | Yes | 0 | Ordering sequence |

* **Indexes:**
  * `idx_culture_media_unique`: Unique (`cultureId`, `mediaAssetId`)

---

## 16. Table: `audit_logs`
Immutable administrative activity ledger.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `actorUserId` | string | 36 | Yes | - | Performing user ID |
| `action` | enum | `create`, `update`, `publish`, `unpublish`, `archive`, `delete` | Yes | - | Action type |
| `entityType` | string | 32 | Yes | - | Table affected (e.g. crafts, motifs) |
| `entityId` | string | 36 | Yes | - | Affected row ID |
| `changesJson` | string | 15000 | No | null | JSON diff of modified attributes |
| `ipAddress` | string | 45 | No | null | Request client IP |

* **Indexes:**
  * `idx_audit_actor`: Key (`actorUserId`, `$createdAt`)
  * `idx_audit_entity`: Key (`entityType`, `entityId`)

---

## 17. Table: `museum_settings`
Global village & digital museum metadata singleton.

| Column | Type | Size / Values | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settingKey` | string | 64 | Yes | - | Unique configuration key |
| `settingValue` | string | 10000 | Yes | - | String or serialized JSON value |
| `description` | string | 255 | No | null | Explanation of setting purpose |
| `updatedById` | string | 36 | Yes | - | Last modifying user profile ID |

* **Indexes:**
  * `idx_settings_key`: Unique (`settingKey`)
