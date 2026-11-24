# SCHEMA REVIEW REPORT
**Project:** Museum Digital Pringgasela Selatan  
**Database System:** Appwrite TablesDB  
**Database ID:** `museum_digital`  
**Review Version:** 2.1.0 (Phase 2.1 Security & Motif Encyclopedia Finalized)  
**Date:** 2026-11-24  

---

## 1. Revision History & Phase 2.1 Schema Corrections

> [!IMPORTANT]
> **Phase 2.1 Schema Corrections Summary:**
> 1. **Private TablesDB Permission Reclassification:** Transitioned all content collections from public table-level `read("any")` to internal-only permissions (`read("team:museum-admins")`). Public data consumption is decoupled from the raw database schema and delegated to the `museum-public-api` gateway.
> 2. **Complete Weaving Motif Encyclopedia Schema:** Fully integrated all 10 required motif dimensions into `weaving_motifs` (`categoryId`, `contributorId`, `reviewedById`) and `motif_translations` (`visualDescription`, `technique`).
> 3. **Row Storage Optimization:** Verified that all descriptive, philosophical, and procedural text fields use `mediumtext` to prevent InnoDB 65,535-byte row overflows.
> 4. **Translation-to-Identity Invariance:** Enforced that translation records strictly anchor to a single parent master ID via foreign keys (`craftId`, `motifId`, `cultureId`, `historyId`) and compound unique index `(parentId, locale)`.

---

## 2. Definitive Weaving Motif Encyclopedia Specification

The weaving motif encyclopedia documents ancestral textile patterns of Pringgasela (e.g. *Sari Menanti*, *Bayan Duri*, *Reragigan*, *Pucuk Rebung*, *Cempaka*).

### 2.1. Parent Entity: `weaving_motifs`
Stores language-agnostic metadata, taxonomies, attribution, and editorial state:

| Column | Type | Size / Values | Required | Default | Purpose / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `slug` | `string` | 96 | Yes | - | Canonical URL slug (Unique Index) |
| `codeName` | `string` | 32 | No | null | Traditional artisan pattern code (e.g. `PRG-SM-01`) |
| `categoryId` | `string` | 36 | Yes | - | Foreign key to `categories.$id` (e.g. Geometric, Floral) |
| `contributorId`| `string` | 36 | No | null | Foreign key to `contributors.$id` (Master weaver who holds pattern) |
| `status` | `enum` | `draft`, `in_review`, `published`, `archived` | Yes | `draft` | Content publication lifecycle state |
| `isFeatured` | `boolean` | - | Yes | false | Flag for home showcase motifs wall |
| `primaryCraftId`| `string` | 36 | No | null | Optional link to physical textile specimen in `crafts` |
| `createdById` | `string` | 36 | Yes | - | Author profile ID (Admin KKN / Admin Desa) |
| `reviewedById`| `string` | 36 | No | null | Verification Sign-Off: Profile ID of approving village elder |

* **Indexes:**
  * `idx_motifs_slug`: Unique (`slug`)
  * `idx_motifs_status`: Key (`status`)
  * `idx_motifs_category`: Key (`categoryId`)
  * `idx_motifs_contributor`: Key (`contributorId`)

---

### 2.2. Translation Entity: `motif_translations`
Stores rich multilingual cultural narratives in Indonesian (`id`) and English (`en`):

| Column | Type | Size / Values | Required | Default | Purpose / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `motifId` | `string` | 36 | Yes | - | Foreign key to parent `weaving_motifs.$id` |
| `locale` | `enum` | `id`, `en` | Yes | `id` | Language code (Compound Unique Index with `motifId`) |
| `name` | `string` | 120 | Yes | - | Motif title (e.g. *Motif Bayan Duri*) |
| `visualDescription`| `mediumtext`| - | Yes | - | Detailed breakdown of visual geometry, band counts, color stripes |
| `philosophy` | `mediumtext`| - | Yes | - | Philosophical meaning, moral teachings, and spiritual symbolism |
| `technique` | `mediumtext`| - | No | null | Weaving execution: supplementary weft (sungkit), thread counts, dye |
| `historicalUsage` | `mediumtext`| - | No | null | Customary ceremonial usage, royal vs commoner contexts |
| `originStory` | `mediumtext`| - | No | null | Oral legend or historical origins of the motif's creation |

* **Indexes:**
  * `idx_motif_trans_unique`: Unique (`motifId`, `locale`) — Enforces exactly 1 translation per language per motif.
  * `idx_motif_trans_motif`: Key (`motifId`)
  * `idx_motif_trans_locale`: Key (`locale`)

---

### 2.3. Visual Documentation: `motif_media` & `media_assets`
A single motif supports an unlimited number of photographs and diagrams:
* **`motif_media` Junction Table:**
  * `motifId` (`string`, 36, required)
  * `mediaAssetId` (`string`, 36, required)
  * `isPatternDiagram` (`boolean`, required) — Differentiates between actual textile photography and technical vector/grid charts.
  * `sortOrder` (`integer`, required, default 0) — Curates display sequence.
* **`media_assets` Metadata:**
  * High-resolution files stored in `museum-media` bucket.
  * Captures photographer credits, bilingual captions (`captionId`, `captionEn`), and accessibility alt text (`altTextId`, `altTextEn`).

---

## 3. Review of All 17 TablesDB Entities

| No | Table Name | Tier | Primary Key / Unique | Key Relationships | Table ACL Mode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **`profiles`** | Identity | `$id` = Auth `userId` | Links to Auth, audit logs | Staff Only (`team:museum-admins`) |
| 2 | **`categories`** | Taxonomy | `slug` (Unique) | Parent-child self-reference | Staff Only (`team:museum-admins`) |
| 3 | **`contributors`** | Provenance | `slug` (Unique) | Referenced by crafts, motifs, cultures | Staff Only (`team:museum-admins`) |
| 4 | **`crafts`** | Master Craft | `slug` (Unique) | Category, Contributor, Author, Reviewer | Staff Only (`team:museum-admins`) |
| 5 | **`craft_translations`** | i18n Craft | `(craftId, locale)` | Crafts parent ($1:N$, max 2) | Staff Only (`team:museum-admins`) |
| 6 | **`weaving_motifs`** | Master Motif | `slug` (Unique) | Category, Contributor, Reviewer, Craft | Staff Only (`team:museum-admins`) |
| 7 | **`motif_translations`** | i18n Motif | `(motifId, locale)` | Motifs parent ($1:N$, max 2) | Staff Only (`team:museum-admins`) |
| 8 | **`cultures`** | Master Culture | `slug` (Unique) | Category, Contributor, Author | Staff Only (`team:museum-admins`) |
| 9 | **`culture_translations`**| i18n Culture | `(cultureId, locale)`| Cultures parent ($1:N$, max 2) | Staff Only (`team:museum-admins`) |
| 10 | **`village_history`** | Master History | `slug` (Unique) | Author Profile | Staff Only (`team:museum-admins`) |
| 11 | **`history_translations`**| i18n History | `(historyId, locale)`| History parent ($1:N$, max 2) | Staff Only (`team:museum-admins`) |
| 12 | **`media_assets`** | DAM | `fileId` (Unique) | Storage bucket file `$id` | Staff Only (`team:museum-admins`) |
| 13 | **`craft_media`** | Junction | `(craftId, mediaAssetId)`| Crafts $\leftrightarrow$ Media Assets | Staff Only (`team:museum-admins`) |
| 14 | **`motif_media`** | Junction | `(motifId, mediaAssetId)`| Motifs $\leftrightarrow$ Media Assets | Staff Only (`team:museum-admins`) |
| 15 | **`culture_media`** | Junction | `(cultureId, mediaAssetId)`| Cultures $\leftrightarrow$ Media Assets | Staff Only (`team:museum-admins`) |
| 16 | **`audit_logs`** | Security | `$id` (UUID) | Actor User ID | Staff Only (`owner`, `desa` read) |
| 17 | **`museum_settings`** | Config | `settingKey` (Unique) | Updating User ID | Staff Only (`owner` write) |

---

## 4. Public API Field Whitelisting Matrix

The `museum-public-api` gateway transforms raw database rows into clean public JSON structures:

```typescript
// Example Public API response for GET /motifs/sari-menanti?locale=id
{
  "id": "6aff...",
  "slug": "sari-menanti",
  "codeName": "PRG-SM-01",
  "isFeatured": true,
  "category": {
    "slug": "geometris",
    "name": "Motif Geometris Tradisional"
  },
  "contributor": {
    "name": "Inaq Sari",
    "dusun": "Dusun Gubuk Bagek",
    "type": "penenun"
  },
  "content": {
    "locale": "id",
    "name": "Motif Sari Menanti",
    "visualDescription": "Pola lajur simetris dengan paduan garis sejajar...",
    "philosophy": "Melambangkan kesabaran dan harapan luhur...",
    "technique": "Tenun sesek gedogan benang katun pewarna alami kulit mahoni...",
    "historicalUsage": "Dikenakan pada upacara begawe adat...",
    "originStory": "Diturunkan secara lisan sejak abad ke-18..."
  },
  "media": [
    {
      "url": "https://sgp.cloud.appwrite.io/v1/storage/buckets/museum-media/files/abc123/view",
      "previewUrl": "https://sgp.cloud.appwrite.io/v1/storage/buckets/museum-media/files/abc123/preview?width=800&output=webp",
      "caption": "Detail kerapatan tenunan motif Sari Menanti",
      "photographer": "Tim Peneliti KKN",
      "isPatternDiagram": false
    }
  ]
}
```
*Note:* Internal system fields (`createdById`, `reviewedById`, `status`, `$permissions`, `$databaseId`, `$tableId`) are strictly withheld from the payload.
