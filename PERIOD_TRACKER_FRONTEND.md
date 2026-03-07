# Period Tracker — Frontend Guide

> **Goal:** So simple a 16-year-old opens it and instantly knows what to do. No confusion, no clutter.
>
> **Base URL:** `/api/v1/period-tracker`
> All endpoints need `Authorization: Bearer <token>`.
> All dates: `"YYYY-MM-DD"` or ISO 8601.

---

## Table of Contents

1. [User Scenarios — Who Lands Where](#user-scenarios--who-lands-where)
2. [Onboarding Flow (First-Time User)](#onboarding-flow-first-time-user)
3. [Main Screen — Calendar](#main-screen--calendar)
4. [Daily Log — Bottom Sheet](#daily-log--bottom-sheet)
5. [Analytics Screen](#analytics-screen)
6. [Settings Screen](#settings-screen)
7. [Calendar Color Guide](#calendar-color-guide)
8. [Full API Reference](#full-api-reference)
9. [Data Types & Enums](#data-types--enums)
10. [Error Handling](#error-handling)

---

## User Scenarios — Who Lands Where

When user opens Period Tracker, FIRST call:

```
GET /api/v1/period-tracker/settings
```

Then decide:

```
if (settings.isOnboarded === false || settings does not exist)
  → Show ONBOARDING FLOW (Section 2)

else
  → Show MAIN CALENDAR SCREEN (Section 3)
```

That's it. Two paths. No other entry point.

---

## Onboarding Flow (First-Time User)

> **Design:** Full-screen pages. Big text, minimal inputs. Soft pastel background.
> ONE question per screen. Progress dots at top. "Next" button at bottom.
> Total: 3 pages. Done in under 20 seconds.

### Page 1 — Welcome + When did your last period start?

```
┌────────────────────────────────────┐
│                                    │
│     🌸  Welcome to Period Tracker  │
│                                    │
│     Let's get you set up.          │
│     Just one question:             │
│                                    │
│  When did your last period start?  │
│                                    │
│  ┌──────────────────────────┐      │
│  │   📅  Pick a date        │      │
│  │   (calendar date picker) │      │
│  └──────────────────────────┘      │
│                                    │
│  □ I don't remember                │
│                                    │
│         [ Next → ]                 │
│                                    │
└────────────────────────────────────┘
```

Store the selected date in local state. No API call yet.

If "I don't remember" → skip straight to Page 3.

---

### Page 2 — "Is your period happening right now?"

Only shown if user entered a date on Page 1.

```
┌────────────────────────────────────┐
│  ● ● ○                            │
│                                    │
│  Is your period happening          │
│  right now?                        │
│                                    │
│  ┌────────────┐  ┌────────────┐   │
│  │   Yes 🔴   │  │    No ⚪   │   │
│  └────────────┘  └────────────┘   │
│                                    │
│         [ Next → ]                 │
│                                    │
└────────────────────────────────────┘
```

No date picker needed. If "Yes" → we'll use today as the current period start date.

---

### Page 3 — "You're all set!"

```
┌────────────────────────────────────┐
│  ● ● ●                            │
│                                    │
│  🎉  You're all set!              │
│                                    │
│  We'll predict your next period    │
│  and show it on your calendar.     │
│                                    │
│  The more you log, the smarter     │
│  your predictions get.             │
│                                    │
│       [ Open My Calendar → ]       │
│                                    │
└────────────────────────────────────┘
```

**On "Open My Calendar" tap — fire API calls:**

```javascript
const today = new Date().toISOString().split('T')[0];  // "YYYY-MM-DD"

if (isPeriodActiveNow) {
  // Period is happening now — just start it as Active (don't bulk-import same date)
  await POST /api/v1/period-tracker/period/start
  Body: { "date": today }

  // If the last period date was DIFFERENT from today, also import it as historical
  if (lastPeriodDate && lastPeriodDate !== today) {
    await POST /api/v1/period-tracker/bulk-import
    Body: {
      "cycles": [{
        "cycleStartDate": lastPeriodDate,
        "cycleEndDate": addDays(lastPeriodDate, 5)   // auto +5 days
      }]
    }
  }

} else if (lastPeriodDate) {
  // Period is NOT happening now — import the past period as completed
  await POST /api/v1/period-tracker/bulk-import
  Body: {
    "cycles": [{
      "cycleStartDate": lastPeriodDate,
      "cycleEndDate": addDays(lastPeriodDate, 5)
    }]
  }
}

// Always mark onboarded last
await PUT /api/v1/period-tracker/settings
Body: { "isOnboarded": true }

// Navigate to Calendar screen
```

> **Why this order matters:** If the user's last period date IS today and they say "Yes, happening now", we must call `period/start` (creates Active cycle) instead of `bulk-import` (creates Completed cycle). If we bulk-import first, the cycle gets locked as Completed and `period/start` can't reopen it.

**If user checked "I don't remember":**
- Skip bulk-import entirely
- Just mark `isOnboarded: true`
- Calendar shows empty + a gentle nudge: "Tap 'Period Started' when your next period begins"

> **Why only 1 past period during onboarding?** Asking for 3-6 past periods is overwhelming for a first-time user. One is enough to start making predictions. Users can add more past periods later by tapping dates on the calendar (see Section 3). Predictions improve automatically as more data is entered over time.

---

## Main Screen — Calendar

> **Design philosophy:** Calendar IS the entire screen. Nothing else competing for attention.
> Clean, spacious, no tabs on this screen. Two floating elements on top of the calendar.

### Layout

```
┌──────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐ │
│ │ 🔴 Day 3 of your period             │ │
│ │    Next period: ~July 6              │ │
│ └──────────────────────────────────────┘ │
│                                    [📊]  │ ← Analytics icon (top right)
│                                          │
│  ◄  June 2025  ►                         │ ← swipe or arrows to change month
│                                          │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat       │
│  ┌────┬────┬────┬────┬────┬────┬────┐    │
│  │    │    │    │    │    │  1 │  2 │    │
│  ├────┼────┼────┼────┼────┼────┼────┤    │
│  │  3 │  4 │  5 │  6 │  7 │ 🔴8│ 🔴9│    │ ← red = period
│  ├────┼────┼────┼────┼────┼────┼────┤    │
│  │🔴10│🔴11│🔴12│ 13 │ 14 │ 15 │ 16 │    │
│  ├────┼────┼────┼────┼────┼────┼────┤    │
│  │ 17 │ 18 │🟢19│🟢20│🟢21│🟢22│🟢23│    │ ← green = fertile
│  ├────┼────┼────┼────┼────┼────┼────┤    │
│  │⭐24│🟢25│ 26 │ 27 │ 28 │ 29 │ 30 │    │ ← star = ovulation
│  └────┴────┴────┴────┴────┴────┴────┘    │
│                                          │
│  ┌──────────────────────────────────────┐ │
│  │  🔴 Period Started  │  ⬜ Period Ended│ │ ← bottom buttons
│  └──────────────────────────────────────┘ │
│                                          │
│  ⚙️ Settings                             │ ← small gear icon, bottom-left
└──────────────────────────────────────────┘
```

### On Screen Load — 2 parallel API calls:

```
GET /api/v1/period-tracker/current-enhanced
GET /api/v1/period-tracker/calendar?month=2025-06
```

### Status Card (top)

Use data from `/current-enhanced`:

| Condition | What to show |
|-----------|-------------|
| Period is active (`cycle.cycleStatus === 'Active'` AND `cycle.periodEndDate === null`) | "🔴 Day X of your period" |
| Period ended but cycle is active (`periodEndDate` exists) | "Day X of your cycle • Follicular phase" |
| No active cycle | "No period tracked yet" |
| Pregnancy mode | "🤰 Week X of pregnancy" |

Below that, always show: **"Next period: ~[date]"** (from `predictions.nextPeriod`)

If `pmsWindow` is active (today is in PMS range): show a subtle yellow banner — "PMS window — your period may start in X days"

### Bottom Buttons

Show **one** of these at a time:

| Condition | Button shown |
|-----------|-------------|
| No cycle exists OR latest cycle is `Completed` | **"🔴 Period Started"** (prominent, red) |
| Cycle is `Active` AND `periodEndDate` is null | **"⬜ Period Ended"** (secondary, outlined) |
| Cycle is `Active` AND `periodEndDate` exists (period stopped, waiting for next) | **"🔴 Period Started"** (prominent, red) — for the NEXT period. Backend auto-closes the current cycle. |

### What happens when user taps a button:

**"Period Started" tapped:**

```
┌────────────────────────────────────┐
│  When did it start?                │
│                                    │
│  [ Today - June 8 ]   ← default   │
│                                    │
│  Or pick a different date:         │
│  📅 ___________                    │
│                                    │
│  [ Confirm ]  [ Cancel ]           │
└────────────────────────────────────┘
```

API:

```
POST /api/v1/period-tracker/period/start
Body: { "date": "2025-06-08" }
```

Then refresh calendar + status card.

**"Period Ended" tapped:**

Same popup, but asks "When did it end?" defaulting to today.

API:

```
POST /api/v1/period-tracker/period/stop
Body: { "date": "2025-06-12" }
```

Then refresh calendar + status card.

### What happens when user TAPS A DATE on the calendar:

This is the core daily interaction. THREE cases:

**Case 1 — Date is in the FUTURE**
→ Do nothing. Maybe show a tooltip: "You can't log future dates"

**Case 2 — Date is TODAY or in the CURRENT MONTH (past days this month)**
→ Open Daily Log bottom sheet (Section 4)

**Case 3 — Date is in a PAST MONTH**
→ Show ONE simple yes/no popup:

```
┌────────────────────────────────────┐
│                                    │
│  Did your period start on          │
│  March 15?                         │
│                                    │
│  ┌──────────┐   ┌──────────┐      │
│  │   Yes    │   │    No    │      │
│  └──────────┘   └──────────┘      │
│                                    │
└────────────────────────────────────┘
```

If **"No"** → dismiss. Done.

If **"Yes"** → show a quick follow-up:

```
┌────────────────────────────────────┐
│                                    │
│  Got it! When did it end?          │
│                                    │
│  📅  March 20  (default +5 days)  │
│                                    │
│  [ Save ]  [ Cancel ]              │
│                                    │
└────────────────────────────────────┘
```

API:

```
POST /api/v1/period-tracker/period/start
Body: {
  "date": "2025-03-15",
  "cycleEndDate": "2025-03-20",
  "cycleStatus": "Completed"
}
```

Calendar refreshes. That past month now shows red period days. Predictions recalculate with the new data.

### Changing months (swipe left/right):

```
GET /api/v1/period-tracker/calendar?month=2025-05
```

Calendar re-renders. Past months show historical period data. Future months show predictions (lighter colors).

---

## Daily Log — Bottom Sheet

> **Design:** Slides up from bottom. Covers ~75% of screen. User scrolls down for more fields.
> **Rule:** Show only the ESSENTIAL fields at the top. Advanced fields are hidden in a collapsible "More" section.
> **Rule:** User should be able to log in under 10 seconds if they want — just tap flow + mood + save.

### Load existing data:

```
GET /api/v1/period-tracker/day/2025-06-10
```

Response has `log` (null if nothing logged yet) and `cycle`.

### Layout

```
┌──────────────────────────────────────┐
│  ─────  (drag handle)                │
│                                      │
│  📅 Tuesday, June 10                 │
│                                      │
│  ── FLOW ──────────────────────────  │
│  💧💧💧💧💧                           │
│  None  Light  Medium  Heavy  V.Heavy │
│  (tap one droplet to select)         │
│                                      │
│  ── MOOD ──────────────────────────  │
│  😊  😌  😢  😰  😤  ⚡  😴  😟     │
│  (tap one emoji to select)           │
│                                      │
│  ── SYMPTOMS ──────────────────────  │
│  [Cramps] [Bloating] [Headache]      │
│  [Backache] [Fatigue] [Nausea]       │
│  [Breast Tenderness] [Mood Swings]   │
│  (tap to toggle, multi-select)       │
│                                      │
│  ── PAIN ──────────────────────────  │
│  ○───────────●────────○  (slider)    │
│  0          5          10            │
│                                      │
│  ── NOTES ─────────────────────────  │
│  ┌────────────────────────────────┐  │
│  │ Type anything...               │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▼ More details (tap to expand)      │
│  ─────────────────────────────────── │
│  (hidden by default — see below)     │
│                                      │
│  ┌──────────┐  ┌──────────────────┐  │
│  │  💾 Save  │  │  🗑 Delete Log   │  │
│  └──────────┘  └──────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### "More details" — expanded section (collapsed by default)

Only shown when user taps "More details":

```
│  ▲ More details (tap to collapse)    │
│                                      │
│  ── ENERGY ────────────────────────  │
│  Low | Low-Mid | Moderate | High     │
│                                      │
│  ── SLEEP ─────────────────────────  │
│  Hours: [7]  Quality: Good ▼        │
│                                      │
│  ── SKIN ──────────────────────────  │
│  Clear | Mild Acne | Oily | Dry     │
│                                      │
│  ── CRAVINGS ──────────────────────  │
│  [Chocolate] [Salty] [Sweet] [Carbs] │
│                                      │
│  ── EXERCISE ──────────────────────  │
│  Type: [Yoga ▼]  Minutes: [30]      │
│                                      │
│  ── DISCHARGE ─────────────────────  │
│  Type: [Normal ▼] Color: [Clear ▼]  │
│  Amount: Light | Moderate | Heavy    │
│                                      │
│  ── SEXUAL ACTIVITY ───────────────  │
│  Had sex: [○ Yes  ● No]             │
│  Protected: [● Yes  ○ No] (if yes)  │
│                                      │
│  ── TEMPERATURE (BBT) ─────────────  │
│  [36.8] °C                           │
│                                      │
│  ── PREGNANCY TEST ────────────────  │
│  Taken: [○ Yes  ● No]               │
│  Result: [Positive | Negative]       │
│                                      │
│  ── MEDICATION ────────────────────  │
│  Medication taken: [toggle]          │
│  Supplement taken: [toggle]          │
│  Rest needed: [toggle]              │
```

### Save log:

```
PUT /api/v1/period-tracker/logs/2025-06-10
Body: {
  "flowIntensity": 3,
  "mood": "Tired",
  "symptoms": ["Cramps", "Bloating"],
  "painLevel": 5,
  "notes": "Felt rough"
}
```

Only send fields the user actually filled in. All optional.

### Delete log (only shown if log exists):

```
DELETE /api/v1/period-tracker/logs/2025-06-10
```

### After save/delete → refresh calendar (to update the log-dot on that date).

---

## Analytics Screen

> **Design:** Full screen. Back arrow to return to calendar.
> Clean cards layout. No tabs — just a scrollable page with clear sections.

### Open when user taps the 📊 icon on the calendar screen.

### On load — 4 API calls in parallel:

```
GET /api/v1/period-tracker/analytics
GET /api/v1/period-tracker/insights
GET /api/v1/period-tracker/stats
GET /api/v1/period-tracker/history?limit=12
```

### Layout

```
┌──────────────────────────────────────┐
│  ← Back                             │
│                                      │
│  📊 Your Cycle Summary               │
│                                      │
│  ┌─────────────┐ ┌─────────────────┐ │
│  │ Avg Cycle   │ │ Avg Period      │ │
│  │   28 days   │ │   5 days        │ │
│  └─────────────┘ └─────────────────┘ │
│  ┌─────────────┐ ┌─────────────────┐ │
│  │ Cycles      │ │ Regularity      │ │
│  │   8 tracked │ │  ✅ Regular     │ │
│  └─────────────┘ └─────────────────┘ │
│                                      │
│  ── Predictions ───────────────────  │
│  ┌──────────────────────────────────┐│
│  │ Next period: July 6 (in 8 days) ││
│  │ Ovulation:   June 24            ││
│  │ Fertile:     June 19–28         ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Cycle Length Trend ────────────  │
│  ┌──────────────────────────────────┐│
│  │  📈 (simple bar chart)          ││
│  │  |  █                           ││
│  │  |  █  █     █                  ││
│  │  |  █  █  █  █  █  █  █  █     ││
│  │  └──1──2──3──4──5──6──7──8──   ││
│  │     Cycle #                     ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Top Symptoms ──────────────────  │
│  ┌──────────────────────────────────┐│
│  │ 1. Bloating .............. 12x  ││
│  │ 2. Headache .............. 8x   ││
│  │ 3. Fatigue ............... 6x   ││
│  │ 4. Cramps ............... 5x    ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Tips For You ──────────────────  │
│  ┌──────────────────────────────────┐│
│  │ "You may experience PMS         ││
│  │  symptoms. Period predicted      ││
│  │  in 8 days."                     ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Past Cycles ───────────────────  │
│  ┌──────────────────────────────────┐│
│  │ Jun 2025  │ 28 days │ Period: 5 ││
│  │ May 2025  │ 27 days │ Period: 5 ││
│  │ Apr 2025  │ 29 days │ Period: 4 ││
│  │ Mar 2025  │ 28 days │ Period: 5 ││
│  └──────────────────────────────────┘│
│                                      │
└──────────────────────────────────────┘
```

**Data mapping:**

| Card | Source API | Fields |
|------|-----------|--------|
| Avg Cycle | `/stats` | `averageCycleLength` |
| Avg Period | `/stats` | `averagePeriodDuration` |
| Cycles tracked | `/stats` | `totalCycles` |
| Regularity | `/analytics` | `regularity` (show ✅ Regular or ⚠️ Irregular) |
| Predictions | `/insights` | `predictions.nextPeriodDate`, `daysUntilNextPeriod` |
| Cycle chart | `/analytics` | `cycleTrend` array → bar chart |
| Top symptoms | `/analytics` | `topSymptoms` array |
| Tips | `/insights` | `recommendations` array |
| Past cycles | `/history` | list of `{ month, cycleLengthDays, periodDurationDays }` |

If user has < 1 completed cycle → show: "Log your first period to see predictions and analytics here"

---

## Settings Screen

> **Design:** Standard settings list. Accessible from gear icon ⚙️ on calendar screen.
> Keep it simple — most users will never open this.

### On load:

```
GET /api/v1/period-tracker/settings
GET /api/v1/period-tracker/birth-control
```

### Layout

```
┌──────────────────────────────────────┐
│  ← Back                             │
│                                      │
│  ⚙️ Period Tracker Settings          │
│                                      │
│  ── Cycle Defaults ────────────────  │
│  Cycle length        [ 28 days ▼ ]   │
│  Luteal phase        [ 14 days ▼ ]   │
│  Calendar starts on  [Sun ▼ / Mon ▼] │
│                                      │
│  ── Reminders ─────────────────────  │
│  Daily log reminder  [ 🔵 ON  ]      │
│  Reminder time       [ 20:00 ]       │
│                                      │
│  ── PMS ───────────────────────────  │
│  Show PMS prediction [ 🔵 ON  ]      │
│  Days before period  [ 5 ▼ ]         │
│                                      │
│  ── Birth Control ─────────────────  │
│  Method              [ Pill ▼ ]      │
│  (if Pill):                          │
│    Pack start date   [ Jun 1 ]       │
│    Pack length       [ 28 ]          │
│    Pill-free days    [ 7 ]           │
│    Pill reminder     [ 🔵 ON ]       │
│    [ 💊 Mark Today's Pill Taken ]    │
│                                      │
│  ── Pregnancy Mode ────────────────  │
│  Enable pregnancy mode [ ⚪ OFF ]    │
│  (turns off period predictions,      │
│   shows pregnancy week instead)      │
│                                      │
└──────────────────────────────────────┘
```

### Save settings (on each change):

```
PUT /api/v1/period-tracker/settings
Body: { "defaultCycleLengthDays": 28 }
```

### Birth control:

```
PUT /api/v1/period-tracker/birth-control
Body: { "method": "pill", "pillPackStartDate": "2025-06-01" }
```

### Mark pill taken:

```
POST /api/v1/period-tracker/birth-control/pill/take
Body: { "date": "2025-06-10" }  // optional, defaults to today
```

---

## Calendar Color Guide

> **Rule: Only 3 colors on the calendar.** Fewer colors = less confusion.
> PMS and predicted-next-period are shown as TEXT in the status card, NOT as calendar colors.

### Logic for each day cell:

```javascript
const { periodRanges, fertileWindow, ovulationDate, logDates } = calendarData;

for (each day cell) {
  const date = cellDate; // UTC date

  const isPeriod    = periodRanges.some(r => date >= r.start && date <= r.end);
  const isFertile   = fertileWindow && date >= fertileWindow.start && date <= fertileWindow.end;
  const isOvulation  = ovulationDate && sameDay(date, ovulationDate);
  const hasLog      = logDates.includes(formatAsYYYYMMDD(date));
  const isToday     = sameDay(date, today);
}
```

### Colors (pick ONE background per day — highest priority wins):

| Priority | Condition | Color | Visual |
|----------|-----------|-------|--------|
| 1 (highest) | `isPeriod` | `#E53E3E` (red) with white text | Solid red circle |
| 2 | `isOvulation` | `#2F855A` (dark green) | Green circle with ⭐ |
| 3 | `isFertile` | `#C6F6D5` (light green bg) | Light green fill |
| 4 (lowest) | None of above | White / default | Plain number |

### Overlays (can combine with any background):

| Condition | Overlay |
|-----------|---------|
| `isToday` | Bold circle outline around the number |
| `hasLog` | Small dot below the date number |

### Legend (small, below calendar):

```
🔴 Period   🟢 Fertile   ⭐ Ovulation   • Logged
```

### Where PMS and next-period info goes instead:

- **PMS window** → shown as text in the status card: "PMS window — period may start in X days"
- **Predicted next period** → shown as text in the status card: "Next period: ~July 6"

This keeps the calendar clean and instantly readable — red = bleeding, green = fertile, that's it.

---

## Full API Reference

> All paths relative to `/api/v1/period-tracker`

### Period Actions

| Method | Path | Body | When to call |
|--------|------|------|-------------|
| `POST` | `/period/start` | `{ date?, cycleEndDate?, cycleStatus? }` | User marks period start |
| `POST` | `/period/stop` | `{ date }` | User marks bleeding ended |

### Daily Logs

| Method | Path | Body | When to call |
|--------|------|------|-------------|
| `PUT` | `/logs/:date` | `{ flowIntensity?, mood?, symptoms?, ... }` | Save/update a daily log |
| `DELETE` | `/logs/:date` | — | Delete a log |
| `GET` | `/day/:date` | — | Load log for date (when opening bottom sheet) |

`:date` format: `YYYY-MM-DD`

### Calendar & Status

| Method | Path | When to call |
|--------|------|-------------|
| `GET` | `/calendar?month=YYYY-MM` | Calendar screen load + month change |
| `GET` | `/current-enhanced` | Calendar screen load (status card) |

### Analytics

| Method | Path | When to call |
|--------|------|-------------|
| `GET` | `/analytics` | Analytics screen open |
| `GET` | `/insights` | Analytics screen open |
| `GET` | `/stats` | Analytics screen open |
| `GET` | `/history?limit=12` | Analytics screen open |

Call all 4 in parallel when analytics screen opens.

### Settings

| Method | Path | When to call |
|--------|------|-------------|
| `GET` | `/settings` | App launch (onboarding check) + settings screen |
| `PUT` | `/settings` | User changes a setting |
| `GET` | `/birth-control` | Settings screen |
| `PUT` | `/birth-control` | User changes birth control |
| `POST` | `/birth-control/pill/take` | User taps "mark pill taken" |

### Cycle Management

| Method | Path | When to call |
|--------|------|-------------|
| `POST` | `/bulk-import` | Onboarding (importing past periods) |
| `PUT` | `/cycle/:cycleId` | Edit a past cycle (admin-level, optional) |
| `DELETE` | `/cycle/:cycleId` | Delete a cycle (settings → danger zone) |

---

## Data Types & Enums

### Daily Log Fields — Quick Reference

**Essential (show always):**

| Field | Type | Options | UI |
|-------|------|---------|----|
| `flowIntensity` | number | 0=None, 1=Spotting, 2=Light, 3=Medium, 4=Heavy, 5=V.Heavy | Droplet icons |
| `mood` | string | Happy, Calm, Sad, Anxious, Irritable, Energetic, Tired, Sensitive, PMS | Emoji row |
| `symptoms` | string[] | Cramps, Bloating, Headache, Backache, Fatigue, Nausea, Breast Tenderness, Mood Swings | Tappable chips |
| `painLevel` | number | 0–10 | Slider |
| `notes` | string | max 1000 chars | Text input |

**"More details" (collapsed by default):**

| Field | Type | Options | UI |
|-------|------|---------|----|
| `energyPattern` | string | Low, Low-Mid, Moderate, Mid-High, High | Segmented |
| `sleepHours` | number | 0–24 | Number picker |
| `sleepQuality` | string | Poor, Fair, Good, Excellent | Segmented |
| `skinCondition` | string | Clear, Mild Acne, Moderate Acne, Oily, Dry | Dropdown |
| `cravings` | string[] | Chocolate, Salty, Sweet, Carbs, Coffee | Chips |
| `exercise.type` | string | Yoga, Walking, Running, Gym... | Dropdown |
| `exercise.minutes` | number | 0+ | Input |
| `discharge.type` | string | Normal, Creamy, Watery, Egg White, Sticky | Dropdown |
| `discharge.color` | string | Clear, White, Yellow, Brown, Pink, Red | Dropdown |
| `discharge.amount` | string | Light, Moderate, Heavy | Segmented |
| `sexualActivity.hadSex` | boolean | — | Toggle |
| `sexualActivity.protected` | boolean | — | Toggle (shown if hadSex) |
| `basalBodyTemperature` | number | 35.0–42.0°C | Decimal input |
| `pregnancyTest.taken` | boolean | — | Toggle |
| `pregnancyTest.result` | string | Positive, Negative, Unknown | Radio (shown if taken) |
| `medicationTaken` | boolean | — | Toggle |
| `supplementTaken` | boolean | — | Toggle |
| `restNeeded` | boolean | — | Toggle |
| `crampingIntensity` | string | None, Mild, Moderate, Strong, Severe | Segmented |

### Cycle Phases

```
Menstruation (days 1–5)  →  Follicular (days 6–13)  →  Ovulation (day ~14)  →  Luteal (days 15–28)
```

---

## Error Handling

All errors return: `{ "code": 400, "message": "..." }`

### UI error handling:

| Error message | What to do in UI |
|---------------|-----------------|
| `"No cycle found. Please start a period first."` | Show the "Period Started" button prominently |
| `"Cannot stop period: cycle has already ended."` | Refresh state, hide "Period Ended" button |
| `"Period end date cannot be before cycle start date."` | Show date validation error inline |
| `"cycleEndDate cannot be before cycleStartDate"` | Validate dates before sending |
| `401` | Redirect to login |

### Offline handling:

Cache the last `/calendar` and `/current-enhanced` response locally. If offline, show cached data with a "Last updated X min ago" banner.

---

## Edge Cases & Gotchas

> Things that WILL happen in production. Handle all of these.

### Date Picker Restrictions

- **All date pickers must have `maxDate = today`**. No future dates allowed for period start, period end, or daily log.
- Onboarding Page 1: restrict to last 90 days (user shouldn't pick a date from 2 years ago).
- "When did it end?" picker: restrict to `startDate` through `startDate + 14 days` (no one has a 3-month period).

### GET /day/:date Returns 404 — No Cycle Found

This happens for new users who tap a date before tracking any period.

```javascript
try {
  const { data } = await GET /api/v1/period-tracker/day/2025-06-10
  // Show log data
} catch (err) {
  if (err.status === 404) {
    // No cycle for this date — show EMPTY log form
    // When user saves, PUT /logs/:date auto-creates a cycle
  }
}
```

Don't show a scary error. Just show an empty form.

### Undo / Delete a Period

If user accidentally taps "Period Started" or marks a wrong past date:

- **Current period (active):** Call `DELETE /api/v1/period-tracker/cycle/:cycleId` — gets the cycleId from the `/current-enhanced` response (`cycle._id`)
- **Past period:** Swipe to that month → the red dates are visible → there's no direct "undo" button. User should go to Settings → (future: add a "Manage Cycles" section listing past cycles with delete option)

For MVP: just add a "Delete current cycle" option in Settings as a safety valve.

### Future Months — Predicted vs Historical

When the user swipes to a **future** month, the calendar API still returns `periodRanges` (empty for future), `fertileWindow`, and `ovulationDate` (predicted). To differentiate:

```javascript
const today = new Date();
for (each day cell) {
  const isFutureDate = date > today;

  // Historical data → solid colors
  // Predicted data → same colors but with DASHED border or 50% opacity
  if (isFutureDate && isPeriod)  → skip (no predicted period shown, just text in status card)
  if (isFutureDate && isFertile) → show with dashed border or lighter opacity
  if (isFutureDate && isOvulation) → show with dashed border or lighter opacity
}
```

### Onboarding API Failure Recovery

If any API call fails during onboarding "Open My Calendar" step:

```javascript
try {
  if (isPeriodActiveNow) {
    await periodStart(...)
  }
  if (lastPeriodDate && lastPeriodDate !== today) {
    await bulkImport(...)
  }
  await updateSettings({ isOnboarded: true })
  navigateToCalendar()
} catch (err) {
  // Show: "Something went wrong. Let's try again."
  // DO NOT mark isOnboarded = true if period/start or bulk-import failed
  // Let user retry by tapping "Open My Calendar" again
}
```

Key rule: **`isOnboarded: true` must be the LAST call**, never before the data calls.

### User Forgets to Stop Period (Day 10+)

If the status card shows "Day X of your period" and X > 10, consider showing a gentle nudge:

```
"Still on your period? (Day 12)"
[ Period Ended ]   [ Still going ]
```

Backend handles this automatically at 60 days (`autoCompleteOldCycles`), but the nudge helps get accurate data sooner.

### Double-Tap / Race Conditions

Backend `startPeriod` is **idempotent** — if a cycle already exists for the same start date, it returns the existing one without creating a duplicate. So double-taps are safe. Frontend should still disable the button after first tap to prevent flicker.

### Overlapping Past Periods

If user marks a past period that overlaps with an existing one (e.g., March 10-15 already exists, user marks March 13 as a new period start):
- Backend creates a new cycle at March 13, renumbers all cycles
- The calendar will show overlapping red ranges
- This is a rare edge case — acceptable for MVP. Future: detect overlap and warn "You already have a period tracked for this date range."

---

## Complete User Journey — Summary

```
FIRST TIME USER
│
├── 1. Opens app → GET /settings → isOnboarded: false
├── 2. Onboarding (3 screens): "When did last period start?" → "Is period happening now?" → "Done!"
├── 3. POST /bulk-import (if date given) + POST /period/start (if active) + PUT /settings {isOnboarded: true}
└── 4. → Calendar screen

RETURNING USER
│
├── 1. Opens app → GET /settings → isOnboarded: true
├── 2. GET /current-enhanced + GET /calendar
├── 3. Sees calendar (🔴 red = period, 🟢 green = fertile) + status card at top
│
├── DAILY: Taps today → logs flow + mood + symptoms → PUT /logs/YYYY-MM-DD → done (10 sec)
│
├── PERIOD STARTS: Taps "Period Started" → picks date → POST /period/start (auto-closes previous cycle)
├── PERIOD ENDS: Taps "Period Ended" → picks date → POST /period/stop → "Period Started" btn reappears for next period
│
├── PAST DATA: Swipes to past month → taps a date → "Did period start here? Yes/No" → POST /period/start
│
├── ANALYTICS: Taps 📊 → predictions, charts, symptoms, history
│
└── SETTINGS: Taps ⚙️ → cycle length, reminders, birth control
```

---

## Backend Service Map (for reference only)

```
src/
├── routes/v1/periodTracker.router.js
├── controllers/period-tracker.controller.js
├── services/period/
│   ├── periodTracker.service.js      ← start/stop, logs, CRUD
│   ├── cycleDashboard.service.js     ← getCurrent, getCalendar
│   ├── cycleImport.service.js        ← bulkImport, autoComplete
│   ├── analytics.service.js          ← analytics, insights, stats
│   ├── birthControl.service.js       ← birth control
│   └── prediction.service.js         ← math (no DB)
├── models/
│   ├── period-cycle.model.js
│   ├── period-settings.model.js
│   └── birth-control.model.js
└── validations/periodTracker.validation.js
```

> **Do NOT use** the legacy `/api/v1/period-cycles` router. Use `/api/v1/period-tracker` for everything.
