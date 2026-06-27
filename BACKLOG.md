# Family Hub — Product Backlog

Last updated: June 2026
Format: Each item has a status, priority, description, and acceptance criteria.

Status values: TODO | IN PROGRESS | DONE | BLOCKED | DECISION NEEDED

---

## 🚀 SPRINT 3 — Quality of Life

### S3-001 · Weather Widget
**Status:** TODO
**Priority:** Medium
**Category:** Feature — Dashboard

**Description:**
Add a weather widget to the dashboard overview that shows current conditions for Manchester (Bury area). Should be glanceable — temperature, conditions icon, high/low for the day.

**Implementation notes:**
- Use Open-Meteo API (free, no API key needed): `https://api.open-meteo.com/v1/forecast?latitude=53.59&longitude=-2.30&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FLondon`
- Weather codes → emoji mapping (0=☀️, 1-3=⛅, 45-48=🌫️, 51-67=🌧️, 71-77=❄️, 80-82=🌦️, 95=⛈️)
- Show as a small card alongside the existing dashboard cards
- Temperature in Celsius
- Refresh every 30 minutes (use setInterval)
- Add `data-card="weather"` so it can be shown/hidden via Arrange
- Hidden by default — user enables via Arrange

**Acceptance criteria:**
- [ ] Weather card appears in Arrange tray (hidden by default)
- [ ] Shows current temp, condition emoji, high/low
- [ ] Refreshes every 30 mins
- [ ] Handles API failure gracefully (show "Weather unavailable")
- [ ] Consistent with other dashboard card styles
- [ ] Audit passes

---

### S3-002 · Recurring Events — Auto-generate next occurrence
**Status:** TODO
**Priority:** High
**Category:** Feature — Calendar

**Description:**
When a recurring event date passes, automatically generate the next occurrence in Firestore. Currently recurring is flagged but the next event isn't created.

**Implementation notes:**
- On app load, check all events with `recur` set
- For each, check if `date` is in the past
- If so, generate next occurrence using `nextOccurrence(date, recur)` and save to Firestore
- Mark the old event as `pastRecurring: true` so it doesn't get processed again
- Cap at 4 weeks ahead to avoid runaway generation
- Do this check inside the `fb-data` event handler, throttled to once per session

**Acceptance criteria:**
- [ ] Dog walk events reappear weekly automatically
- [ ] Old occurrences marked, not duplicated
- [ ] Works for daily, weekly, fortnightly, monthly
- [ ] Audit passes

---

### S3-003 · Offline Mode / Service Worker
**Status:** TODO
**Priority:** Medium
**Category:** Infrastructure

**Description:**
Add a service worker so the app loads from cache when WiFi drops on the SyncGo. The SyncGo is WiFi-only so this is important for reliability.

**Implementation notes:**
- Add a `<script>` block that registers a service worker
- Service worker caches: the HTML file, Google Fonts, Firebase SDK
- Cache-first strategy for assets, network-first for Firestore data
- Show "Offline — showing last known data" banner when offline
- Service worker file needs to be at root — but we're single file. Use inline service worker via Blob URL trick:
```js
const sw = `self.addEventListener('install', e => e.waitUntil(
  caches.open('fh-v1').then(c => c.addAll(['/family-hub/', 'https://fonts.googleapis.com/...']))
)); ...`;
const blob = new Blob([sw], {type:'application/javascript'});
navigator.serviceWorker.register(URL.createObjectURL(blob));
```

**Acceptance criteria:**
- [ ] App loads when WiFi is disconnected (from cache)
- [ ] "Offline" indicator shown when no connection
- [ ] Data updates when connection restored
- [ ] Audit passes

---

### S3-004 · Edit Modal — Who Chip Selector
**Status:** TODO  
**Priority:** High
**Category:** Bug / Consistency

**Description:**
The edit modals (openEditItem) still use plain text dropdowns for the "who" field. They should use the same chip selector as the add modals for consistency.

**Implementation notes:**
- In `openEditItem`, after building the fields innerHTML, call `renderWhoChipsWithValue(chipsId, hiddenId, currentValue)`
- Need a new helper `renderWhoChipsWithValue(containerId, hiddenId, preSelected)` that pre-selects the right chips based on existing value (may be comma-separated)
- Apply to: todo edit, household edit, event edit, shop edit, meal edit

**Acceptance criteria:**
- [ ] Edit modal who field shows chips, not dropdown
- [ ] Current assigned person(s) pre-selected when edit opens
- [ ] Multi-person values preserved on save
- [ ] Audit passes

---

### S3-005 · Dog Walk Rota (Paloma & Otis)
**Status:** TODO
**Priority:** Low
**Category:** Feature — Dashboard

**Description:**
A simple rotating dog walk rota. Shows who walks Paloma & Otis this morning and this evening. Rotates through family members on a configurable schedule.

**Implementation notes:**
- Store rota config in Firestore: `dogwalks` collection
- Each doc: `{ date, morning: 'Giuseppe', evening: 'Ross' }`
- On app load, if today's doc doesn't exist, auto-generate by rotating through active family members
- Show as a small banner at top of dashboard, not a full card
- Tap to mark as done (for both morning and evening)

**Acceptance criteria:**
- [ ] Today's walkers shown on dashboard
- [ ] Tap to mark morning/evening walk done
- [ ] Auto-rotates through family members
- [ ] Paloma 🐾 and Otis 🐾 shown by name
- [ ] Audit passes

---

### S3-006 · Onboarding / First Run Setup
**Status:** TODO
**Priority:** Medium
**Category:** UX

**Description:**
When the app loads for the first time (no data in Firestore), show a friendly setup screen rather than jumping straight to seeded sample data. Lets the family customise from the start.

**Implementation notes:**
- Detect first run: check if `fh_onboarded` exists in localStorage
- If not, show a full-screen overlay before the main app
- Steps: (1) Name your hub, (2) Add family members (name + colour), (3) Connect Google Calendar (optional — show "Skip for now"), (4) Done
- On completion: save members, hub name, set `fh_onboarded = true`, seed minimal data, close overlay
- Keep it under 3 steps — families won't complete long setups

**Acceptance criteria:**
- [ ] First-time visitors see setup flow, not sample data
- [ ] Hub name customisable in step 1
- [ ] At least 1 family member required before proceeding
- [ ] Skip option on Google Calendar step
- [ ] Returning visitors see normal app
- [ ] Audit passes

---

## 🎮 SPRINT 4 — Delight Layer

### S4-001 · Chore Rewards / Gamification
**Status:** TODO
**Priority:** Low
**Category:** Feature — Engagement

**Description:**
Points system for Malachi and Mack. Completing chores earns points. Weekly leaderboard shown on dashboard. Parents can assign point values to tasks.

**Implementation notes:**
- Add `points` field to todo items (default 10 for chores, 0 for todos)
- Store scores in Firestore: `scores` collection, doc per family member per week
- When toggleTodo marks a chore done, add points to that person's weekly score
- Dashboard widget: small leaderboard card (hidden by default, add via Arrange)
- Weekly reset: scores auto-reset on Monday
- [DECISION NEEDED] Should parents be able to manually award bonus points?

**Acceptance criteria:**
- [ ] Points assigned to chores
- [ ] Score updates when chore marked done
- [ ] Weekly leaderboard on dashboard (optional widget)
- [ ] Weekly auto-reset
- [ ] Audit passes

---

### S4-002 · Photo Screensaver Mode
**Status:** TODO
**Priority:** Low
**Category:** Feature — SyncGo

**Description:**
When the app has been idle for 5 minutes, switch to a full-screen photo slideshow — like the original SyncGo functionality but inside our app. Tap to return to hub.

**Implementation notes:**
- Photos stored in Firebase Storage (free tier) — upload via Settings
- Fallback: use family emoji / placeholder if no photos uploaded
- Idle detection: `document.addEventListener('touchstart/click', resetIdleTimer)`
- After 5 mins idle: fade to black, then show photos full-screen with cross-fade every 30s
- Tap anywhere to return to hub
- [DECISION NEEDED] Firebase Storage needs enabling in the Firebase console

**Acceptance criteria:**
- [ ] Screensaver activates after 5 mins idle
- [ ] Photos cross-fade
- [ ] Tap returns to hub instantly
- [ ] Settings option to upload photos
- [ ] Audit passes

---

### S4-003 · Better Empty States (Polish Pass)
**Status:** TODO
**Priority:** Low
**Category:** UX Polish

**Description:**
Review all empty states across all tabs. Make sure they're friendly, have an emoji, explain what the section is for, and have a clear call to action.

**Tabs to review:** calendar week view, calendar month view, todos pending, todos done, shopping (each category), meals, household, household filtered by room.

**Acceptance criteria:**
- [ ] All empty states have emoji + title + subtitle + action hint
- [ ] Consistent visual style across all tabs
- [ ] Month view empty day has "Tap + to add an event" hint
- [ ] Audit passes

---

## 🔌 SPRINT 5 — Integrations

### S5-001 · Google Calendar Sync (Read)
**Status:** TODO
**Priority:** High
**Category:** Integration

**Description:**
Pull real calendar events from Google Calendar into the hub. Read-only first — events from Google appear in the calendar tab alongside manually added ones.

**Implementation notes:**
- Requires Google OAuth — user signs in with Google
- Use Google Calendar API v3
- Scope: `https://www.googleapis.com/auth/calendar.readonly`
- Pull events for current week + 2 weeks ahead
- Store in separate Firestore collection `gcal_events` to avoid mixing with manual events
- Show with a small Google icon indicator
- [DECISION NEEDED] Need to create OAuth credentials in Google Cloud Console — Giuseppe to set up

**Acceptance criteria:**
- [ ] Sign in with Google button in Settings
- [ ] Google Calendar events appear in calendar tab
- [ ] Visually distinct from manually added events
- [ ] Refreshes every 15 minutes
- [ ] Works across all family devices (shared OAuth token stored in Firestore)
- [ ] Audit passes

---

### S5-002 · Forward to Add (Email → Hub)
**Status:** TODO
**Priority:** High  
**Category:** Integration

**Description:**
Forward an email to a shared family address and it automatically creates an event, task, or shopping item in the hub. The killer feature that Skylight charges $79/year for.

**Implementation notes:**
- Use Gmail + Google Apps Script
- Create a shared `familyhub@gmail.com` (or use lucarellifamily@gmail.com with a filter)
- Apps Script runs on a trigger every 5 minutes
- Parses subject line: "shopping: milk, bread, eggs" → adds to shopping
- Parses subject line: "task: hoover lounge - Malachi" → adds todo
- Parses subject line: "event: dentist Tuesday 10am - Luca" → adds calendar event
- Writes directly to Firestore via REST API
- [DECISION NEEDED] Giuseppe to create Apps Script and share credentials

**Acceptance criteria:**
- [ ] Forward email with "shopping:" prefix → items added to shopping list
- [ ] Forward email with "task:" prefix → todo created
- [ ] Forward email with "event:" prefix → calendar event created
- [ ] Items appear within 5 minutes
- [ ] Audit passes

---

## 💡 FUTURE / COMMERCIAL

### F-001 · Multi-household Support
**Status:** TODO
**Priority:** Low
**Category:** Commercial

**Description:** Each family gets their own Firestore project/namespace. Required before any commercial release.
**[DECISION NEEDED]** Architecture decision — separate Firebase projects vs Firestore namespacing?

---

### F-002 · Connector-agnostic Data Layer
**Status:** TODO
**Priority:** Medium
**Category:** Commercial

**Description:** Abstract the Google dependency. Pluggable connectors for Apple Calendar, Outlook, Google, or standalone.
**[DECISION NEEDED]** Define connector interface before implementing.

---

### F-003 · Mobile Companion App
**Status:** TODO
**Priority:** Medium
**Category:** Commercial

**Description:** Lightweight PWA optimised for phone use — faster to add items than opening the full hub URL.

---

## ✅ COMPLETED

| ID | Feature | Sprint | Completed |
|----|---------|--------|-----------|
| – | Core dashboard (4 widgets) | 1 | Jun 2026 |
| – | Firebase Firestore real-time sync | 1 | Jun 2026 |
| – | Family colour coding | 1 | Jun 2026 |
| – | Data persistence | 1 | Jun 2026 |
| – | Portrait layout / mobile optimisation | 1 | Jun 2026 |
| – | Drag & drop widget rearrange | 1 | Jun 2026 |
| – | Tap item → detail modal | 1 | Jun 2026 |
| – | Edit & delete all items | 1 | Jun 2026 |
| – | Due dates on tasks | 1 | Jun 2026 |
| – | GitHub Pages hosting | 1 | Jun 2026 |
| – | ADB unlock SyncGo + Firefox install | 1 | Jun 2026 |
| – | Household Tasks tab | 2 | Jun 2026 |
| – | Rachel added to family | 2 | Jun 2026 |
| – | Settings panel (add/remove members, hub name) | 2 | Jun 2026 |
| – | Calendar month view | 2 | Jun 2026 |
| – | Shopping favourites + autocomplete | 2 | Jun 2026 |
| – | Meal favourites + categories | 2 | Jun 2026 |
| – | Recurring tasks (auto-regenerate on done) | 2 | Jun 2026 |
| – | Recurring events (flag) | 2 | Jun 2026 |
| – | Copy task to another day/week | 2 | Jun 2026 |
| – | Multi-person assignment (all tabs) | 2 | Jun 2026 |
| – | Consistent detail modal (Close/Delete/Edit/Action) | 2 | Jun 2026 |
| – | Top add button all tabs | 2 | Jun 2026 |
| – | Summary banner under header | 2 | Jun 2026 |
| – | Built-in QA audit tool | 2 | Jun 2026 |
