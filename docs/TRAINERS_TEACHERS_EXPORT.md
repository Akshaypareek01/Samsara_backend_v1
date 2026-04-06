# Trainers & teachers — fields for client / export

Two different MongoDB collections feed “trainer-like” people:

| Source | Collection / model | How to identify |
|--------|----------------------|-----------------|
| **Trainer** | `Trainer` (`trainer.model.js`) | All documents in this collection |
| **Teacher** | `Users` (`user.model.js`) | `role === 'teacher'` |

## Trainer (`Trainer`)

These fields exist on the schema. **There is no `age` or `gender` on trainers** — export leaves those columns empty for trainer rows.

| Field | Schema name | Notes |
|-------|----------------|-------|
| Name | `name` | |
| Email | `email` | |
| Phone | `mobile` | 10-digit string in schema |
| Title | `title` | |
| Bio | `bio` | Long text |
| Specialties | `specialistIn` | Array (enum) |
| Training types | `typeOfTraining` | Array (long enum) |
| Active flag | `status` | Boolean |
| Profile image URL/path | `profilePhoto.path` | Optional |

## Teacher (`Users` with `role: 'teacher'`)

| Field | Schema name | Notes |
|-------|----------------|-------|
| Name | `name` | |
| Email | `email` | |
| Phone | `mobile` | Optional in schema |
| Emergency phone | `emergencyMobile` | Optional |
| Age | `age` | String in schema |
| Gender | `gender` | String |
| DOB | `dob` | String in schema |
| Category | `teacherCategory` | e.g. Yoga Trainer, Fitness Coach |
| Experience | `teachingExperience` | |
| Expertise | `expertise` | Array of strings |
| Qualifications | `qualification` | Array of objects |
| City / country | `city`, `country` | |
| About | `AboutMe`, `description` | |
| Flags | `status`, `active` | |

## Generate CSV (opens in Excel)

Requires `.env` with `MONGODB_URL`, `NODE_ENV`, `JWT_SECRET`, and other vars your `config.js` expects (same as running the app).

```bash
cd /path/to/Samsara_backend_v1
cross-env NODE_ENV=development node src/scripts/export-trainers-teachers.js
```

Or use the npm script:

```bash
npm run export:trainers-teachers
```

Outputs under `exports/`:

- `trainers_<timestamp>.csv` — Trainer collection only  
- `teachers_<timestamp>.csv` — Users with `role: teacher`  
- `trainers_and_teachers_combined_<timestamp>.csv` — both, with `recordType` = `Trainer` | `Teacher`

Arrays are joined with `; ` inside a single cell. Passwords and sensitive tokens are not exported.
