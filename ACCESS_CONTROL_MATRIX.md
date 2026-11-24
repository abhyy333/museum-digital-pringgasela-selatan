# ACCESS CONTROL MATRIX (RBAC)
**Project:** Museum Digital Pringgasela Selatan  
**Security Model:** Appwrite Role-Based Access Control (RBAC) & Document-Level Security  
**Target Architecture Version:** 1.0.0  

---

## 1. Actor Roles & Definitions

| Role | Appwrite Auth Identity | Description | Scope |
| :--- | :--- | :--- | :--- |
| **Public Visitor** | `Role.any()` / `Role.guests()` | Anonymous or registered web/mobile visitors | Read-only access to published heritage assets |
| **Admin KKN** | `Role.team("museum-admins", "kkn")` | Student researchers & university field teams | Draft & propose content, upload media, no delete rights |
| **Admin Desa** | `Role.team("museum-admins", "desa")` | Village officials & cultural board | Full editorial control: approve, publish, edit, manage |
| **Super Admin** | `Role.team("museum-admins", "owner")` | Lead technical architect & head of village | Complete authority: manage staff, system configs, delete |

---

## 2. Team Structure Implementation

A single Appwrite Team `museum-admins` manages organizational membership with three distinct role tags:

```text
Team: museum-admins (ID: museum-admins)
├── role: "owner"  --> Super Admin
├── role: "desa"   --> Admin Desa
└── role: "kkn"    --> Admin KKN
```

### Revocation Protocol for Admin KKN
> [!IMPORTANT]
> To revoke a student's administrative access, simply remove their membership from `museum-admins` or delete their Appwrite Auth account. Because database rows store their unique profile ID (`profiles.userId`) and audit records store their historical actions as plain attributes without CASCADE delete rules, **all cultural content, motifs, photos, and histories created by the KKN team remain fully preserved and attributed in perpetuity.**

---

## 3. Database Permissions Matrix

### 3.1. Public Content Tables
Applies to: `crafts`, `craft_translations`, `weaving_motifs`, `motif_translations`, `cultures`, `culture_translations`, `village_history`, `history_translations`, `categories`, `contributors`, `craft_media`, `motif_media`, `culture_media`.

| Action | Public Visitor | Admin KKN | Admin Desa | Super Admin | Enforcement Rule |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Read (Published)** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Query filter `status == 'published'` enforced via frontend / API |
| **Read (Drafts / Review)** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | Restricted to `Role.team("museum-admins")` |
| **Create (Draft)** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | Permitted for `Role.team("museum-admins")` |
| **Update / Edit** | **DENY** | **ALLOW (Own Drafts)** | **ALLOW (All)** | **ALLOW (All)** | KKN can only update rows where `createdById == user.$id` and `status == 'draft'` |
| **Publish / Archive** | **DENY** | **DENY** | **ALLOW** | **ALLOW** | Status transitions require `Role.team("museum-admins", "desa")` or `"owner"` |
| **Delete** | **DENY** | **DENY** | **DENY** | **ALLOW** | Hard delete is strictly reserved for Super Admin |

### 3.2. User Management & Profiles
Applies to: `profiles`.

| Action | Public Visitor | Admin KKN | Admin Desa | Super Admin | Enforcement Rule |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Read (Public Contributor Bio)**| **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Filtered by `isActive == true` |
| **Create Profile** | **DENY** | **ALLOW (Self)** | **ALLOW (Staff)**| **ALLOW** | Automated via Auth trigger or Super Admin |
| **Update Profile** | **DENY** | **ALLOW (Self)** | **ALLOW (Self)** | **ALLOW (All)** | Self profile edit or administrative update |
| **Delete / Deactivate** | **DENY** | **DENY** | **DENY** | **ALLOW** | Soft-deactivate via `isActive = false` |

### 3.3. System Configuration & Audit Logs
Applies to: `museum_settings`, `audit_logs`.

| Action | Public Visitor | Admin KKN | Admin Desa | Super Admin | Enforcement Rule |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Read Settings** | **ALLOW (Public Keys)**| **ALLOW** | **ALLOW** | **ALLOW** | Filtered by `settingKey` |
| **Update Settings** | **DENY** | **DENY** | **DENY** | **ALLOW** | Super Admin only |
| **Read Audit Logs** | **DENY** | **DENY** | **ALLOW** | **ALLOW** | Transparent village audit inspection |
| **Create Audit Logs** | System Service | System Service | System Service | System Service | Automatic log creation on mutation |
| **Update/Delete Audit Logs** | **DENY** | **DENY** | **DENY** | **DENY** | Strictly Immutable |

---

## 4. Appwrite Permissions Syntax Mapping

For table-level permissions configuration:

```typescript
// Publicly readable collection (e.g. crafts, translations, motifs)
[
  Permission.read(Role.any()), // Filtered at application level by status == 'published'
  Permission.create(Role.team("museum-admins")),
  Permission.update(Role.team("museum-admins", "desa")),
  Permission.update(Role.team("museum-admins", "owner")),
  Permission.delete(Role.team("museum-admins", "owner"))
]

// Internal audit logs collection
[
  Permission.read(Role.team("museum-admins", "owner")),
  Permission.read(Role.team("museum-admins", "desa")),
  Permission.create(Role.team("museum-admins"))
  // No update or delete permissions granted to anyone
]
```
