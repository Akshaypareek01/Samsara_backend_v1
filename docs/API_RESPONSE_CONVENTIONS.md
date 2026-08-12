# API response conventions

Reference for `Samsara_backend_v1`. Addresses audit finding **M-02**.

The API currently returns **four different response shapes**. This is documented rather than refactored — changing existing shapes would break the mobile app, the CRM and the consumer web app simultaneously, for no security or stability gain.

**The rule: new endpoints use Shape A. Existing endpoints keep the shape they have.**

---

## The four shapes in use

Counts are approximate occurrences across `src/controllers/`.

### A. `{ success, data }` — ~104 uses — **use this for new endpoints**

```json
{ "success": true, "message": "Membership assigned successfully", "data": { "…": "…" } }
```

Used by: membership, payment, admin-membership, booking, tracker (newer controllers).

### B. `{ status: 'success', data }` — ~119 uses

```json
{ "status": "success", "data": { "…": "…" } }
```

Used by: zoom, whatsapp, user image endpoints. Mirrors an older house style; note `status` is a *string*, not a boolean.

### C. Bare document or array — ~242 uses

```json
{ "_id": "…", "eventName": "…" }
```

Used by: events, classes, meditations, most GET-by-id and list routes. The largest group, and the one the mobile app assumes most often.

### D. Paginated envelope — from `paginate.plugin.js`

```json
{ "results": [], "page": 1, "limit": 10, "totalPages": 4, "totalResults": 37 }
```

Returned by any route using `Model.paginate()` — user lists, transactions, notifications.

---

## Why this matters to clients

A client cannot tell which shape it will get from the URL alone, so unwrapping is per-endpoint. The app already carries a helper for exactly this:

```js
// Samsara_app_prod/utils/membershipGateUtils.js
normalizeActiveMembershipResponse(payload)  // unwraps { success, data } or a bare doc
```

**Consequence:** every new endpoint added in shape B or C forces another bespoke unwrap in three clients. That is the cost this convention is meant to stop growing.

---

## Errors — already consistent

Every error goes through `src/middlewares/error.js` and returns:

```json
{ "code": 404, "message": "User not found" }
```

`stack` is added in development only. Since the audit fix, an error keeps its real status code (previously an operator-precedence bug rewrote anything with a `statusCode` to `400`).

Notable error codes worth handling client-side:

| Status | `code` field | Meaning |
|---|---|---|
| 409 | `OVERLAPPING_SLOT` | Teacher already booked for that time |
| 409 | `CLASS_FULL` / `EVENT_FULL` | Capacity reached |
| 409 | `ALREADY_REGISTERED` / `ALREADY_ENROLLED` | Duplicate enrolment |
| 403 | — | Failed ownership check (`selfOrAdmin`) or non-admin on an admin route |
| 402/403 | — | Reserved for membership gating (see C-10, not yet implemented) |

---

## For new endpoints

1. Return shape **A**: `{ success: true, data }` — plus `message` on writes.
2. Use `Model.paginate()` for lists, which yields shape **D**. Do not hand-roll pagination.
3. Throw `ApiError(status, message)`; never build an error body by hand.
4. On a domain conflict, return 409 with a machine-readable `code` so clients can branch without string-matching a message.

## Do not

- Retrofit existing endpoints. Three clients depend on the current shapes, and several unwrap defensively.
- Add a fifth shape.
