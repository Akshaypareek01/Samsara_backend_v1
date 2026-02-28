# API Security Assessment – Questionnaire Answers

## 1. Number of API endpoints to be tested

**~284 endpoints** (all under base path `/v1/`).

Breakdown by area (approximate): Auth (12), Users (varies), Trackers (41), Period Tracker (20), Period Cycles (10), Memberships (10), Payments (10), Bookings (14), Trainers (10), Trainer Auth (8), Companies (9), Events, Classes, Meetings, Recorded Classes, Zoom (4), Assessments (incl. Dosha, Thyroid, PCOS, Menopause), Notifications (13), Notification Preferences (7), Data Notifications (13), Blood Reports (15), Coupons (11), Membership Plans (10), Diet Generation (5), Mood, Ratings, Teacher Ratings, User Analytics, Admin (login, trackers, period, membership), WhatsApp (5), Upload (1), Global Config, Roles, etc.

---

## 2. Functionality of APIs

| Domain | Functionality |
|--------|----------------|
| **Auth** | User/trainer/admin registration, login (password + OTP), logout, refresh tokens, forgot/reset password, email verification. |
| **Users** | Profile CRUD, user management, corporate linking. |
| **Trackers** | Weight, water, mood, temperature, fat, BMI, body status, steps, sleep – history, today, dashboard, hydration status, targets. |
| **Period Tracker / Period Cycles** | Calendar, current cycle, start/stop period, daily logs, settings, birth control, pill tracking, bulk import, analytics, insights, predictions, cycle CRUD. |
| **Memberships & Payments** | Membership plans (active, by type, stats), user memberships, active membership, cancel/refund, Razorpay create-order/verify, transactions (user + admin). |
| **Bookings** | Create, list, get, update status, cancel. |
| **Trainers** | CRUD, availability, trainer auth (register, OTP login, profile). |
| **Companies** | Company CRUD, linking, management. |
| **Events / Classes / Meetings** | Events, classes, custom sessions, live meetings (Zoom), recorded classes, teacher availability. |
| **Assessments** | Dosha, thyroid, PCOS, menopause – start, submit answers, get results. |
| **Notifications** | List, mark read, preferences (per type, global, quiet hours), data-driven notification triggers. |
| **Blood Reports** | Multiple report types (CBC, blood sugar, thyroid, lipid, liver, kidney, hormonal, etc.) – create, get, update, delete. |
| **Coupons** | Validate, list by plan, stats, admin CRUD, toggle status. |
| **Diet Generation** | Generate diets, get history/status. |
| **Ratings** | Class, event, teacher ratings. |
| **Admin** | Login, user trackers (dashboard, water), period data, membership (overview, history, assign trial/lifetime, coupon). |
| **WhatsApp** | Webhook verify/handle, send message, conversation history, list conversations. |
| **Upload** | Single file upload. |
| **Zoom Management** | Account stats, reset account(s), health check. |
| **Global Config / Roles** | App config, role/permission management. |

---

## 3. Applications used by / associated with these APIs – business criticality

- **Primary consumer:** Samsara **React Native / Expo** mobile app (~153k LOC).
- **Other possible consumers:** Admin tools, CRM integrations (see `CRM_API_*.md`), company/corporate dashboards.
- **Business criticality:** **Critical.** APIs power core product: user auth, subscriptions (memberships/payments), wellness tracking (trackers, period, diet, blood reports), live/recorded classes and meetings (Zoom), bookings, trainers, notifications, and WhatsApp engagement.

---

## 4. Type of API – SOAP, REST, or XML-RPC?

**REST (RESTful).**  
- HTTP methods: GET, POST, PUT, PATCH, DELETE.  
- JSON request/response.  
- No SOAP or XML-RPC in the codebase.

---

## 5. Authentication for accessing the web services

**Yes. Authentication is implemented and used across most APIs.**

- **Mechanism:** JWT (Bearer token) via **Passport.js** (`passport-jwt`).
- **Token extraction:** `Authorization: Bearer <token>` (from `ExtractJwt.fromAuthHeaderAsBearerToken()`).
- **Token types:** Access tokens (and refresh flow); payload includes `userType`: `user`, `admin`, `company`, `trainer`.
- **Role-based access:** `auth()` and `auth('admin')` middlewares enforce JWT and optional role/rights (admin, company, trainer, user with role-based rights).
- **Public (unauthenticated) endpoints:** e.g. auth (login, register, OTP, forgot password), some payment webhooks, WhatsApp webhook, some read-only plan/coupon endpoints.  
- **Rate limiting:** Applied on `/v1/auth` in production (e.g. 20 failed attempts per 15 minutes via `express-rate-limit`) to mitigate brute force.

---

## 6. Is a Postman collection available?

**Yes.**

- **SW.postman_collection.json** – main collection (e.g. User profile, base URL variable `{{Base_url}}`).
- **PERIOD_CYCLES_POSTMAN_COLLECTION.json** – period cycle APIs.
- **company_postman_collection.json** – company-related APIs.

Additional docs reference Postman (e.g. `HYDRATION_STATUS_API.md`, `PERIOD_TRACKER_COMPLETE_GUIDE.md`).

---

## 7. Sample request and response

**Example: User login (auth)**

- **Request**  
  `POST /v1/auth/login`  
  `Content-Type: application/json`

```json
{
  "email": "user@example.com",
  "password": "password1"
}
```

- **Response (200)**  
  `Content-Type: application/json`

```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "user@example.com",
    "role": "user",
    ...
  },
  "tokens": {
    "access": { "token": "<jwt>", "expires": "..." },
    "refresh": { "token": "<refresh-jwt>", "expires": "..." }
  }
}
```

**Example: Hydration status (authenticated)**

- **Request**  
  `GET /v1/trackers/water/hydration-status`  
  `Authorization: Bearer <jwt>`

- **Response (200)** – see `HYDRATION_STATUS_API.md`

```json
{
  "currentIntake": 250,
  "targetMl": 2000,
  "targetGlasses": 8,
  "percentage": 12.5,
  "status": "Dehydrated",
  "remainingMl": 1750,
  "remainingGlasses": 7,
  "intakeTimeline": [{ "amountMl": 250, "time": "4:54 PM" }],
  "date": "2025-07-17T00:00:00.000Z"
}
```

---

## 8. Security assessment – UAT/Testing or Production?

**Recommendation:**

- **Vulnerability/penetration testing:** Prefer **UAT/Testing** (or dedicated staging) for active scanning and exploit testing to avoid impacting live users and data.
- **Production:** Use only for read-only checks, config review, and re-verification of fixes if needed. Any intrusive testing should be agreed and scheduled.

So: **Primary environment for security assessment = UAT/Testing (or Staging); Production = limited, controlled re-checks only.**

---

## 9. Reference / detailed documentation for APIs

**Yes, multiple sources:**

- **Swagger/OpenAPI:** Available in **development** at `/v1/docs` (swagger-ui-express + swagger-jsdoc). Some routes have `@swagger` JSDoc (e.g. auth, user, notification preferences, blood report, meditation, master category).
- **Markdown docs in repo:**  
  e.g. `PERIOD_TRACKER_COMPLETE_GUIDE.md`, `PERIOD_CYCLE_API_DOCS.md`, `HYDRATION_STATUS_API.md`, `COMPANY_API_DOCUMENTATION.md`, `TRAINER_API_DOCUMENTATION.md`, `CRM_API_*.md`, `MEMBERSHIP_SYSTEM_DOCS.md`, `EXPO_API_INTEGRATION_GUIDE.md`, and others in the repo root.

---

## 10. API gateway implemented? Name and version?

**No dedicated API gateway** (e.g. Kong, Apigee, AWS API Gateway) is present in this backend repo.

- Traffic is served directly by **Express**.
- Payment integration uses a **payment gateway** (e.g. Razorpay) – that is not an API gateway for these REST APIs.

**Answer:** No; N/A.

---

## 11. API gateway–level security controls

**N/A** – no API gateway in use. Security is implemented at **application level**:

- **Helmet** – security headers (CSP, etc.).
- **CORS** – enabled (configurable).
- **Rate limiting** – on `/v1/auth` in production.
- **JWT** – authentication and role-based access.
- **express-mongo-sanitize** – NoSQL injection mitigation.
- **xss-clean** – XSS mitigation.
- **Validation** – Joi-based request validation on routes.

---

## 12. Number of iterations for retesting of fixed vulnerabilities

**Recommended: 2 iterations** (industry common practice):

1. **First retest:** After development deploys fixes to UAT/Testing – verify all reported issues are resolved and no regressions.
2. **Second retest (if needed):** If critical/high issues remain or new issues are introduced, one more round after fixes.

For **critical** findings or **compliance-driven** assessments, consider **3 iterations** (fix → retest → final sign-off). Exact number can be agreed in the SoW with the security/testing vendor.

---

*Generated from Samsara backend codebase (Express, `/v1` routes).*
