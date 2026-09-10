# Home Banners CMS

CMS for the consumer app Home screen: **hero carousel** (`home_hero`) and **Updates** strip (`home_updates`). Banner docs live in Mongo (`homebanners`); images are HTTPS URLs on Cloudflare R2. Admins manage content in **sm_crm**; the mobile app fetches active banners at runtime.

## Placements

| Value | UI |
|-------|-----|
| `home_hero` | Swiper carousel on Home |
| `home_updates` | Horizontal Updates cards |

## API (`/v1/home-banners`)

| Method | Path | Auth | Permission | Notes |
|--------|------|------|------------|-------|
| GET | `/home-banners?placement=` | JWT (any user) | — | Active only; `placement` required |
| GET | `/home-banners/admin` | JWT (admin) | `homeBanners` read | Optional `?placement=`; includes inactive |
| GET | `/home-banners/:bannerId` | JWT (admin) | `homeBanners` read | |
| POST | `/home-banners` | JWT (admin) | `homeBanners` create | Body: see model below |
| PATCH | `/home-banners/:bannerId` | JWT (admin) | `homeBanners` update | Partial body |
| DELETE | `/home-banners/:bannerId` | JWT (admin) | `homeBanners` delete | |

**Banner fields:** `placement`, `imageUrl` (https), `title`, `subtitle`, `ctaText`, `targetScreen` (allowlist or `null`), `order`, `isActive`.

**Response shape:** `{ success, message, data }` — list endpoints return `data` as an array sorted by `order`.

## App fetch

```js
GET /home-banners?placement=home_hero   // or home_updates
```

Consumer client: `Samsara_app_prod/services/homeBannerService.js` — returns `[]` on error.

## CRM

- **Path:** `/apps/crm/app-banners`
- **Sidebar:** App Banners
- **RBAC leaf:** `homeBanners` (`create` / `read` / `update` / `delete`)
- **Service:** `sm_crm/services/homeBannerService.ts`

## Screen allowlist (`targetScreen`)

Must match a registered stack screen. Defined in `src/constants/homeBannerScreens.js` (keep in sync with `Samsara_app_prod/constants/homeBannerScreens.js`):

`GroupClassesAll`, `Guidevideo`, `Events`, `Meditate`, `Menopause`, `PCOSScreen`, `Throid`, `MembershipPlans`, `TeacherDashboard`, `BodyStatus`, `MoodTracker`, `Pakriti`, `Community`, `ReferralProgram`

## Super Admin

- `checkPermission` (`src/middlewares/checkPermission.js`): `role.name === 'Super Admin'` (and legacy `admin`) bypasses all module checks.
- Seed script also `$set`s `permissions.homeBanners` on the Super Admin role document.

## Seed

From `Samsara_backend_v1`:

```bash
npm run seed:home-banners
```

| Env | Purpose |
|-----|---------|
| Mongo (via app config) | Target DB for `HomeBanner` docs |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Upload PNGs to R2 |
| `APP_ASSETS_ROOT` | Optional; defaults to sibling `../Samsara_app_prod` |

Uploads five PNGs from app assets (`bannerapp1–3.png`, `bubble1.png`, `HomeUpdates.png`), inserts matching banner docs, patches Super Admin permission.

- Skips insert if collection non-empty.
- **`FORCE_SEED_HOME_BANNERS=1`** — delete all banners and re-seed.

## Production

After backend deploy, run the seed **once** against **prod Mongo + prod R2** (same env as the running API). Do not force-reseed in prod unless intentionally replacing all banners.
