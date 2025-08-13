## Period Tracker API (Frontend Integration Guide)

Base URL: `/v1/period-tracker`

Auth: All endpoints require the existing JWT auth (send `Authorization: Bearer <token>`).

### Conventions

- Dates: ISO 8601 strings (UTC) unless noted. Examples:
  - Full ISO: `2025-06-10T00:00:00Z`
  - Day route param uses `YYYY-MM-DD` (no time).
- Times: 24-hour `HH:mm` (e.g., `21:00`).
- All responses are JSON. Errors follow global shape `{ code, message }`.

---

### GET /calendar

Query:
```
month=YYYY-MM (optional) // e.g., 2025-06
```

Response:
```json
{
  "year": 2025,
  "month": 6,
  "periodRanges": [ { "start": "2025-06-08T00:00:00.000Z", "end": "2025-06-12T00:00:00.000Z" } ],
  "fertileWindow": { "start": "2025-06-23T00:00:00.000Z", "end": "2025-06-27T00:00:00.000Z" },
  "ovulationDate": "2025-06-26T00:00:00.000Z",
  "nextPeriodDate": "2025-07-08T00:00:00.000Z"
}
```

Use: draw calendar markers (period ranges, fertile window, ovulation) and show next period.

---

### GET /current

Response:
```json
{
  "cycle": { /* PeriodCycle document */ },
  "predictions": {
    "nextPeriod": "2025-07-08T00:00:00.000Z",
    "ovulation": "2025-06-26T00:00:00.000Z",
    "fertileWindow": { "start": "2025-06-23T00:00:00.000Z", "end": "2025-06-27T00:00:00.000Z" },
    "averageCycleDays": 28,
    "currentPhase": "Follicular",
    "currentCycleDay": 15
  },
  "settings": {
    "trackingReminderEnabled": true,
    "trackingReminderTime": "20:00",
    "defaultCycleLengthDays": 28,
    "lutealPhaseDays": 14
  }
}
```

Use: dashboard ring, fertile window banner, overview cards.

---

### POST /period/start

Body:
```json
{ "date": "2025-06-08T00:00:00Z" }
```

Response: `PeriodCycle` created (with `cycleStartDate` set). If a previous open cycle exists, it will be auto-closed at this date.

---

### POST /period/stop

Body:
```json
{ "date": "2025-06-12T00:00:00Z" }
```

Response: Updated `PeriodCycle` with `cycleEndDate`, `periodDurationDays`, predictions for next period, ovulation, fertile window.

---

### PUT /logs/:date

Path:
```
/logs/2025-06-10
```

Body (send only fields you want to set/update):
```json
{
  "flowIntensity": 3,
  "crampingIntensity": "Moderate",
  "painLevel": 5,
  "energyPattern": "Low-Mid",
  "restNeeded": true,
  "symptoms": ["bloating", "headache"],
  "cravings": ["salty"],
  "medicationTaken": false,
  "supplementTaken": true,
  "exercise": { "type": "walk", "minutes": 30, "intensity": "low" },
  "discharge": {
    "type": "creamy",
    "color": "white",
    "consistency": "thick",
    "amount": "mid",
    "notableChanges": ["slightly more than usual"]
  },
  "sexualActivity": { "hadSex": true, "protected": true },
  "pregnancyTest": { "taken": false, "result": "Unknown" },
  "notes": "felt better by evening"
}
```

Response: The upserted `DailyLog` for that date.

---

### GET /history

Query:
```
limit=6 (default)
```

Response:
```json
[
  {
    "id": "...",
    "month": "2025-06-08T00:00:00.000Z",
    "periodDurationDays": 5,
    "cycleLengthDays": 28,
    "delayDays": -1,
    "fertileWindow": { "start": "2025-06-23T00:00:00.000Z", "end": "2025-06-27T00:00:00.000Z" },
    "ovulationDate": "2025-06-26T00:00:00.000Z"
  }
]
```

Use: cycle history cards and mini-bars.

---

### GET /day/:date

Path:
```
/day/2025-06-10
```

Response:
```json
{
  "cycleId": "...",
  "log": { /* Daily log object if exists */ },
  "cycle": { /* parent cycle doc */ }
}
```

---

### GET /settings

Response:
```json
{
  "trackingReminderEnabled": true,
  "trackingReminderTime": "20:00",
  "defaultCycleLengthDays": 28,
  "lutealPhaseDays": 14
}
```

### PUT /settings

Body (any subset):
```json
{
  "trackingReminderEnabled": true,
  "trackingReminderTime": "20:00",
  "defaultCycleLengthDays": 28,
  "lutealPhaseDays": 14
}
```

Response: Updated settings.

---

### Birth Control

#### GET /birth-control

Response:
```json
{
  "method": "pill",
  "reminderEnabled": true,
  "nextPillTime": "21:00",
  "pillTimezone": "Asia/Kolkata",
  "pillPackStartDate": "2025-06-01T00:00:00.000Z",
  "pillPackLength": 28,
  "pillFreeDays": 7,
  "pillsTakenDates": ["2025-06-01T00:00:00.000Z"],
  "pillPackStatus": "Active",
  "lastCheckupDate": "2025-05-10T00:00:00.000Z",
  "checkupReminderEnabled": true
}
```

#### PUT /birth-control

Body (any subset):
```json
{
  "method": "pill",
  "reminderEnabled": true,
  "nextPillTime": "21:00",
  "pillTimezone": "Asia/Kolkata",
  "pillPackStartDate": "2025-06-01T00:00:00Z",
  "pillPackLength": 28,
  "pillFreeDays": 7,
  "pillsTakenDates": ["2025-06-01T00:00:00Z"],
  "pillPackStatus": "Active",
  "lastCheckupDate": "2025-05-10T00:00:00Z",
  "checkupReminderEnabled": true
}
```

Response: Updated birth control doc.

#### POST /birth-control/pill/take

Body (optional):
```json
{ "date": "2025-06-10T00:00:00Z" }
```

Response: Updated birth control doc with recorded pill for that date.

---

### Error Handling

- Errors are consistent with the app’s global handler, e.g.:
```json
{ "code": 400, "message": "Validation error details" }
```

### Tips / Gotchas

- Always send dates in UTC to avoid off-by-one issues in calendar views.
- For `/logs/:date`, the path param must be `YYYY-MM-DD`. Internally we store as a Date in UTC.
- Start/Stop period should be called once per cycle start/end. Starting a new period auto-closes any open cycle.
- If there are no completed cycles yet, predictions fall back to default cycle length from settings (28 days) and luteal phase (14 days).


