# DEPLOYED RESOURCE INVENTORY
**Project:** Museum Digital Pringgasela Selatan  
**Environment:** Appwrite Cloud (Singapore / `sgp`)  
**Project ID:** `6affdaa0003c416ecdb0`  
**Endpoint:** `https://sgp.cloud.appwrite.io/v1`  
**Generated Date:** 2026-11-24  

---

## 1. Project Overview

| Attribute | Deployed Value |
| :--- | :--- |
| **Project ID** | `6affdaa0003c416ecdb0` |
| **Project Name** | `Museum Digital Pringgasela Selatan` |
| **Organization ID** | `6affda8800246a3e03a0` (`Personal Projects`) |
| **Region** | Singapore (`sgp`) |
| **API Endpoint** | `https://sgp.cloud.appwrite.io/v1` |
| **Appwrite CLI Version** | `28.14.0` |
| **SDK Compatibility** | `node-appwrite@32.0.0` / Appwrite Cloud 2.7.2+ |

---

## 2. Database Inventory

| Attribute | Value |
| :--- | :--- |
| **Database ID** | `museum_digital` |
| **Database Name** | `Museum Digital Pringgasela Selatan` |
| **Engine Type** | Appwrite TablesDB |
| **Status** | `ready` |
| **Total Tables** | 17 |

---

## 3. TablesDB Entities (17 Tables)

All 17 tables have been provisioned with strict staff-only permissions (`team:museum-admins`), completely eliminating public read access to raw database tables.

| Table ID | Display Name | Columns | Indexes | Bytes Used | Row Security | Table Permissions (Effective ACL) |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`categories`** | Categories | 6 | 2 | 3,300 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`profiles`** | Profiles | 7 | 2 | 5,407 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins")`, `delete("team:museum-admins/owner")` |
| **`contributors`** | Contributors | 8 | 2 | 19,272 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`crafts`** | Crafts | 8 | 3 | 4,075 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`craft_translations`** | Craft Translations | 8 | 2 | 24,280 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`weaving_motifs`** | Weaving Motifs | 9 | 4 | 3,181 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`motif_translations`** | Motif Translations | 8 | 2 | 54,768 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`cultures`** | Cultures | 7 | 3 | 3,929 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`culture_translations`**| Culture Translations| 7 | 2 | 4,296 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`village_history`** | Village History | 6 | 2 | 2,642 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`history_translations`**| History Translations| 6 | 2 | 58,840 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`media_assets`** | Media Assets | 14 | 2 | 9,371 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`craft_media`** | Craft Media | 4 | 2 | 2,386 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`motif_media`** | Motif Media | 4 | 2 | 1,366 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`culture_media`** | Culture Media | 4 | 2 | 1,366 | `true` | `read("team:museum-admins")`, `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **`audit_logs`** | Audit Logs | 6 | 2 | 2,708 | `false` | `read("team:museum-admins/owner")`, `read("team:museum-admins/desa")`, `create("team:museum-admins")` |
| **`museum_settings`** | Museum Settings | 4 | 1 | 2,510 | `true` | `read("team:museum-admins")`, `create("team:museum-admins/owner")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |

---

## 4. Storage Bucket Inventory

| Parameter | Configuration Value |
| :--- | :--- |
| **Bucket ID** | `museum-media` |
| **Bucket Name** | `Museum Media & Heritage Storage` |
| **File Security** | `true` (Individual per-file ACLs required) |
| **Bucket-Level ACL** | `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` |
| **Public Read at Bucket** | `false` (No public bucket-level read) |
| **Maximum File Size** | `50,000,000 bytes` (50MB) |
| **Allowed File Extensions** | `jpg`, `jpeg`, `png`, `webp`, `svg`, `avif`, `tif`, `tiff`, `mp3`, `wav`, `aac`, `ogg`, `mp4`, `webm`, `pdf`, `zip` |
| **Compression** | `none` |
| **Encryption** | `true` |
| **Antivirus Scanner** | `true` |
| **Image Transformations** | `true` |
| **Current Objects** | 2 test verification objects (`public-motif-sample`, `private-kkn-archive`) |

---

## 5. Team & User RBAC Inventory

### 5.1. Team Definition
* **Team ID:** `museum-admins`
* **Team Name:** `Museum Administrators`
* **Total Confirmed Members:** 3

### 5.2. Active Memberships
| User ID | Full Name | Email | Assigned Team Role | System Authority |
| :--- | :--- | :--- | :---: | :--- |
| **`superadmin-desa`** | Super Admin Museum | `superadmin@pringgasela.desa.id` | `owner` | **Super Admin**: Full platform control, system settings, staff management, permanent deletion |
| **`admindesa-pringgasela`** | Pengurus Desa Pringgasela | `admindesa@pringgasela.desa.id` | `desa` | **Admin Desa**: Editorial approval, content publishing, media curation, audit inspection |
| **`adminkkn-peneliti`** | Peneliti KKN Budaya | `kkn@pringgasela.desa.id` | `kkn` | **Admin KKN**: Field documentation, draft authoring, media upload (non-destructive) |

---

## 6. Serverless Function Inventory

| Attribute | Deployment Configuration |
| :--- | :--- |
| **Function ID** | `museum-public-api` |
| **Function Name** | `Museum Public API` |
| **Runtime** | `node-22` (Node.js 22 Open Runtimes v5) |
| **Status** | `live` / `enabled` |
| **Execution Permission** | `["any"]` (Publicly invokable via API/HTTP) |
| **Execution Scopes** | `databases.read`, `tables.read`, `rows.read`, `files.read` |
| **Active Deployment ID**| `6b056e47f3bd6548b5dd` |
| **Deployment Status** | `ready` |
| **Entrypoint** | `src/main.js` |
| **Build Command** | `npm install` |
| **Timeout** | `15 seconds` |
| **Build Specification** | `s-2vcpu-2gb` |
| **Runtime Specification**| `s-0.5vcpu-512mb` |

### Function Environment Variables
| Variable Key | Assigned Value | Secret Flag |
| :--- | :--- | :---: |
| `DATABASE_ID` | `museum_digital` | Yes |
| `STORAGE_BUCKET_ID` | `museum-media` | Yes |
| `APPWRITE_PROJECT_ID` | `6affdaa0003c416ecdb0` | Yes |
| `APPWRITE_ENDPOINT` | `https://sgp.cloud.appwrite.io/v1` | Yes |

### Supported Public Endpoints
* `GET /health` — API health check and route catalog.
* `GET /crafts` — List published crafts with translations and category filters.
* `GET /crafts/:slug` — Detailed craft record with contributor attribution and media.
* `GET /motifs` — List published weaving motifs with translations.
* `GET /motifs/:slug` — Comprehensive motif encyclopedia record (philosophy, visual description, technique, origin, contributor).
* `GET /cultures` — List published cultural rituals and traditions.
* `GET /cultures/:slug` — Detailed cultural tradition record (ritual procedures, spiritual values, audio chants).
* `GET /history` — Chronological village history eras with narratives.
* `GET /categories` — Cultural taxonomy categories.
* `GET /contributors` — Master weavers, cultural elders, and informants.
* `GET /settings` — Public museum operational details and contact coordinates.
