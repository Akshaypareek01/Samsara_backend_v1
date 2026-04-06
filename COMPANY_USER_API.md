# Company User API

Documentation for **CompanyUser** resources: company-linked users with level (`beginner` | `intermediate` | `advanced`), email, and status. Use this for CRM-style “company employees” or portal users tied to a `Company` document.

## Base URL

```
/v1/company-users
```

Full example (local):

```
http://localhost:<PORT>/v1/company-users
```

The router is mounted at `path: '/company-users'` under the main `/v1` API.

## Authentication

All endpoints require a JWT:

```
Authorization: Bearer <access_token>
```

Same auth as other protected `/v1` routes (e.g. admin or user tokens, depending on your deployment).

---

## Data model (summary)

| Field       | Type   | Notes |
|------------|--------|--------|
| `companyId` | ObjectId | Ref to `Company` (Mongo `_id` of the company document). |
| `fullName`  | string | Required on create. |
| `email`     | string | Lowercased; **unique per company** (compound unique index with `companyId`). |
| `level`     | string | `beginner` \| `intermediate` \| `advanced` |
| `status`    | boolean | Default `true`. |

Timestamps: `createdAt`, `updatedAt` (Mongoose `timestamps`).

---

## Endpoints

### 1. Create company user

**`POST /v1/company-users`**

**Body:**

```json
{
  "companyId": "507f1f77bcf86cd799439011",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "level": "intermediate",
  "status": true
}
```

- `companyId` must be the **Mongo `_id`** of an existing `Company`.
- `status` is optional (defaults to `true` in the DB).

**Success:** `201 Created` — returns the created document (JSON).

**Errors:**

- `404` — Company not found for `companyId`.
- `409` — Email already exists for that company (duplicate key).

---

### 2. List / search / filter (paginated)

**`GET /v1/company-users`**

**Query parameters:**

| Param        | Description |
|-------------|-------------|
| `companyId` | Filter by company: Mongo `_id` of `Company` (24-char hex). |
| `companyKey` | Filter by company: **business** `companyId` string on `Company` (e.g. `AB12CD34`). Use only if you do not have Mongo `_id`. |
| `level`     | `beginner` \| `intermediate` \| `advanced` |
| `status`    | `true` or `false` |
| `search`    | Case-insensitive substring match on **`fullName`** and **`email`**. |
| `sortBy`    | e.g. `createdAt:desc`, `fullName:asc` (comma-separated for multiple fields). |
| `limit`     | Page size (default 10 in paginate plugin). |
| `page`      | Page number (default 1). |
| `populate`  | e.g. `companyId` to populate the company reference. |

**Example:**

```http
GET /v1/company-users?companyKey=AB12CD34&level=beginner&search=jane&page=1&limit=10&populate=companyId
```

**Success:** `200 OK`

```json
{
  "results": [],
  "page": 1,
  "limit": 10,
  "totalPages": 0,
  "totalResults": 0
}
```

If `companyId` / `companyKey` does not resolve to a company, the list is **empty** (no error).

---

### 3. Users by company (dedicated route)

**`GET /v1/company-users/by-company/:companyId`**

Same pagination and filters as the list endpoint, but **`companyId` in the path** is the company:

- **24-character hex** → treated as Mongo `_id` of `Company` (if document exists), otherwise still used as ObjectId for matching stored users.
- **Any other string** → resolved via `Company.findOne({ companyId: <string> })` (business id).

**Query:** `level`, `status`, `search`, `sortBy`, `limit`, `page`, `populate` (same as above; no `companyId` / `companyKey` in query needed for the company filter).

**Example:**

```http
GET /v1/company-users/by-company/507f1f77bcf86cd799439011?search=test&status=true
```

**Success:** `200 OK` — paginated shape as in section 2.

**Errors:**

- `404` — Company could not be resolved (Mongo id not found and not a valid business `companyId`).

---

### 4. Get one by id

**`GET /v1/company-users/:id`**

**`id`** — Mongo `_id` of the `CompanyUser` document.

**Success:** `200 OK` — document.

**Errors:**

- `404` — Not found.

---

### 5. Update

**`PATCH /v1/company-users/:id`**

**Body** (at least one field):

```json
{
  "fullName": "Jane D.",
  "email": "jane.d@example.com",
  "level": "advanced",
  "status": false,
  "companyId": "507f1f77bcf86cd799439011"
}
```

All fields optional; only send what changes. If `companyId` is sent, the target company must exist.

**Success:** `200 OK` — updated document.

**Errors:**

- `404` — Company user or new company not found.
- `409` — Duplicate email for that company.

---

### 6. Delete

**`DELETE /v1/company-users/:id`**

**Success:** `204 No Content`

**Errors:**

- `404` — Company user not found.

---

## Validation errors

Invalid input returns **`400 Bad Request`** with a Joi message string (same pattern as other `/v1` routes).

---

## Frontend notes

1. **Company reference:** On create, pass **`Company`’s Mongo `_id`** as `companyId`. If the UI only has the short **business** `companyId`, resolve the company first (e.g. existing company check / company-by-id APIs) or use **`GET /v1/company-users?companyKey=...`** for listing.
2. **Search** is substring regex on name and email; not full-text search.
3. **Populate** `companyId` when you need company name/logo in the same response.

---

## Related code

| Area | Path |
|------|------|
| Model | `src/models/company-user.model.js` |
| Service | `src/services/company-user.service.js` |
| Controller | `src/controllers/company-user.controller.js` |
| Validation | `src/validations/company-user.validation.js` |
| Routes | `src/routes/v1/company-user.router.js` |
