# APPWRITE COMPATIBILITY & RESOURCE BUDGET REPORT
**Project:** Museum Digital Pringgasela Selatan  
**Target Platform:** Appwrite Cloud (Database: TablesDB / Storage / Functions)  
**Region:** Singapore (`sgp`)  
**Report Version:** 2.1.0 (Phase 2.1 Free-Tier Quota & Function Budget Hardened)  
**Date:** 2026-11-24  

---

## 1. Revision History & Phase 2.1 Compatibility Corrections

> [!IMPORTANT]
> **Phase 2.1 Compatibility Corrections Summary:**
> 1. **Serverless Function Quota Alignment (Max 2 Functions):** Addressed the Appwrite Cloud Free Plan constraint allowing a maximum of **two (2) deployed Functions per project**. Designed a unified single-function gateway (`museum-public-api`) with internal path routing rather than fragmented micro-functions.
> 2. **Storage Quota Alignment (Max 1 Bucket):** Replaced multi-bucket designs with a unified `museum-media` bucket utilizing file-level permissions to satisfy the 1-bucket free tier ceiling.
> 3. **Row-Width Optimization Verified:** Prevented MariaDB 65KB table row overflows by typing all narrative texts as `mediumtext`.

---

## 2. Appwrite Cloud Free-Tier Resource Budget

A rigorous audit of the Appwrite Cloud Free Tier constraints was conducted to ensure zero runtime throttling or billing overages:

| Resource Dimension | Appwrite Free Plan Limit | Museum Digital Allocated Architecture | Margin / Compliance Status |
| :--- | :--- | :--- | :---: |
| **Databases** | Unlimited / 1 included | `1` (`museum_digital`) | **100% Compliant** |
| **Tables per Database** | Up to 100 tables | `17` TablesDB entities | **100% Compliant** (17% of quota) |
| **Storage Buckets** | **Exactly 1 Bucket** | `1` (`museum-media`) | **100% Compliant** (Max 1 used) |
| **Max File Size** | **50 MB per file** | Cap enforced at 50,000,000 bytes | **100% Compliant** |
| **Serverless Functions** | **Exactly 2 Functions** | Primary: `museum-public-api`<br/>Auxiliary: `museum-backend-utility` (optional) | **100% Compliant** (2 of 2 budgeted) |
| **Function Executions** | 750,000 / month | Public gateway with CDN caching | **Optimal Headroom** |
| **Bandwidth** | 10 GB / month | WebP/AVIF compression on previews | **Optimal Headroom** |
| **Teams & Members** | Unlimited teams | `1` Team (`museum-admins`) with 3 roles | **100% Compliant** |

---

## 3. Function Architecture: Unified Gateway (`museum-public-api`)

To strictly remain within the **2-function budget** and avoid creating separate functions for crafts, motifs, cultures, and history, the platform deploys a single consolidated API function with internal path-based routing.

### 3.1. Route Specification: `museum-public-api`
The function receives standard HTTP requests (via Appwrite Function execution URL or custom domain) and dispatches to modular controller handlers:

* `GET /crafts` — Lists published crafts with locale translations, category, and hero image.
* `GET /crafts/:slug` — Returns comprehensive craft documentation, technique, materials, and gallery.
* `GET /motifs` — Lists published weaving motifs with filtering by `category`, `contributor`, or `featured`.
* `GET /motifs/:slug` — Returns deep-dive motif encyclopedia record (geometry, philosophy, technique, photos, vector diagrams).
* `GET /cultures` — Lists published intangible traditions (Dzikir Saman, ceremonial rituals).
* `GET /cultures/:slug` — Returns complete cultural rite documentation, procedural steps, and audio chant players.
* `GET /history` — Returns chronological timeline of village history milestones.
* `GET /settings` — Returns public museum contact details, opening hours, and banner announcements.

### 3.2. Function Implementation Blueprint (Node.js 20 / Bun Runtime)
```typescript
import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }: any) => {
  // Initialize Server SDK with scoped environment variables
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!); // Internal Server Key

  const db = new Databases(client);
  const path = req.path || '/';
  const method = req.method;

  if (method !== 'GET') {
    return res.json({ error: 'Method Not Allowed' }, 405);
  }

  try {
    // ROUTE: GET /motifs
    if (path === '/motifs') {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Hard maximum 50
      const offset = (page - 1) * limit;
      const locale = req.query.locale === 'en' ? 'en' : 'id';

      // 1. Mandatory server-side status filter
      const queries = [
        Query.equal('status', 'published'),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      if (req.query.category) {
        queries.push(Query.equal('categoryId', req.query.category));
      }

      const motifs = await db.listDocuments('museum_digital', 'weaving_motifs', queries);

      // 2. Fetch and join corresponding translations & media
      const results = await Promise.all(motifs.documents.map(async (m) => {
        const trans = await db.listDocuments('museum_digital', 'motif_translations', [
          Query.equal('motifId', m.$id),
          Query.equal('locale', locale),
          Query.limit(1)
        ]);

        const media = await db.listDocuments('museum_digital', 'motif_media', [
          Query.equal('motifId', m.$id),
          Query.orderAsc('sortOrder'),
          Query.limit(5)
        ]);

        // 3. Whitelist public fields strictly
        return {
          id: m.$id,
          slug: m.slug,
          codeName: m.codeName,
          isFeatured: m.isFeatured,
          categoryId: m.categoryId,
          contributorId: m.contributorId,
          content: trans.documents[0] ? {
            name: trans.documents[0].name,
            visualDescription: trans.documents[0].visualDescription,
            philosophy: trans.documents[0].philosophy,
            technique: trans.documents[0].technique,
            historicalUsage: trans.documents[0].historicalUsage,
            originStory: trans.documents[0].originStory,
          } : null,
          mediaAssetIds: media.documents.map(med => med.mediaAssetId)
        };
      }));

      return res.json({
        total: motifs.total,
        page,
        limit,
        data: results
      }, 200, {
        'Cache-Control': 'public, max-age=300, s-maxage=600' // CDN caching
      });
    }

    return res.json({ error: 'Route not found' }, 404);
  } catch (err: any) {
    error(`Public API Error: ${err.message}`);
    return res.json({ error: 'Internal Server Error' }, 500);
  }
};
```

---

## 4. Auxiliary Function Budget: `museum-backend-utility` (Optional)

The second available function slot is reserved for administrative tasks and automated cascade cleanup:
* **Trigger:** Database Document Delete Event (`databases.museum_digital.collections.*.documents.*.delete`).
* **Responsibility:** Automatically deletes associated orphaned child records (translations and media links) when a master record is intentionally deleted by a Super Admin.
* **Status:** Optional; if not required immediately, the slot remains empty to minimize cold starts.
