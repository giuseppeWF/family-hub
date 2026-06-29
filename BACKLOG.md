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

### S3-009 · Onboarding Flow — Fixes & Polish
**Status:** TODO
**Priority:** Critical
**Category:** Bug / UX

**Description:**
The onboarding flow built in S3-006 has several issues that must be fixed before family members use it. Fix all of the following in one pass.

**Bug fixes:**

1. **Username disappears when colour changes** — the name input is losing its value on re-render when a colour swatch is tapped. Fix: store name in a JS variable on every `oninput` event and restore it after any re-render. Do not re-render the entire form when a colour is selected — only update the colour preview.

2. **Pre-populate existing members** — if `fh_members` already exists in localStorage, skip the "add members" step entirely and go straight to the hub. Only show onboarding if it is a genuine first run (no members AND no `fh_onboarded` flag). Add a "Edit family" option in Settings instead for returning users.

3. **Colour picker order** — name should be entered first, colour chosen second. Reorder the fields so name input appears above colour selection in the add-member form.

5. **Free colour picker** — alongside any preset colour swatches, add an `<input type="color">` so users can pick any colour they want, not just presets. The selected colour should update the chip preview in real time.

6. **Share link at end of onboarding** — on the final "You're all set" screen, add a share button that calls `navigator.share()` with the hub URL (`https://giuseppewf.github.io/family-hub/`) and message "Join our Family Hub — tap this link to get started". On browsers that don't support `navigator.share()`, fall back to showing a copyable URL input field. Label: "Invite your family".

**Implementation notes:**
- The share button should also be available in Settings (not just onboarding) so the admin can share the link at any time
- `navigator.share()` works on iOS Safari and Android Chrome natively — triggers the system share sheet (WhatsApp, email, Messages etc.)
- Test: complete onboarding on a fresh private/incognito window to verify it works end to end
- Test: reload on a device that already has `fh_members` set — should go straight to hub, no onboarding

**Acceptance criteria:**
- [ ] Entering a name and then tapping a colour does not clear the name
- [ ] Returning users (fh_members exists) go straight to hub — no onboarding shown
- [ ] Name field appears before colour picker in add-member form
- [ ] Free colour picker (`<input type="color">`) available alongside any presets
- [ ] Share button on final onboarding screen using navigator.share()
- [ ] Share button also available in Settings panel
- [ ] Share falls back to copyable URL if navigator.share() not supported
- [ ] Audit passes with zero issues


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

---

## 🔐 SPRINT 5 — Security & Multi-tenancy

### S5-003 · Google Sign-In + Multi-tenant Firestore
**Status:** TODO
**Priority:** Critical
**Category:** Infrastructure / Security

**Description:**
Add Google Sign-In so family members authenticate before accessing the hub. Implement multi-tenant Firestore architecture so each family's data is completely isolated from other families. This is the foundational change required before the app can be shared with anyone outside the immediate family.

**Implementation notes:**
- Add Firebase Authentication with Google provider
- On first sign-in: check if user belongs to an existing family (via `families` collection)
- If no family: show "Create a family" or "Join with invite code" screen
- If family exists: load their data scoped to their `familyId`
- All Firestore reads/writes must include `familyId` in the document
- Migrate existing data: add `familyId` field to all existing documents
- Replace Phase 1 Firestore security rules with Phase 2 rules (already written in `firestore.rules`)
- Family invite flow: admin generates a 6-digit invite code stored in Firestore with a `createdAt` timestamp and `used: false` flag
- Invite codes expire after 24 hours (check `createdAt` on redemption)
- Invite codes are single-use — set `used: true` immediately on redemption, reject if already used
- Expired/used codes are deleted from Firestore by a cleanup function that runs on app load
- Admin can generate a new code at any time — old codes are invalidated when a new one is generated
- Show code expiry time to admin: "Code expires in 23h 45m"
- Store family config in `/families/{familyId}` with adminUid, name, members sub-collection

**Acceptance criteria:**
- [ ] Sign in with Google button on first load (if not authenticated)
- [ ] New family creation flow (name your hub, invite family members)
- [ ] Invite code generation and acceptance
- [ ] All Firestore data scoped to familyId
- [ ] Phase 2 security rules active — users can only see their own family's data
- [ ] Existing family data migrated with familyId
- [ ] Sign out option in Settings
- [ ] Audit passes with zero issues
- [ ] Invite codes are single-use and expire after 24 hours
- [ ] Admin can regenerate a new invite code at any time from Settings
- [ ] Expired or used codes are deleted from Firestore automatically
- [ ] [RESOLVED] Account recovery: self-service via short-lived invite code (24hr expiry, single-use). Admin generates new code if needed. This balances speed vs security — a permanent code would be a hijack risk.

---

### S5-004 · Firestore Security Rules — Phase 1 Deployment
**Status:** TODO
**Priority:** Critical
**Category:** Security

**Description:**
Deploy the Phase 1 Firestore security rules to replace the current test mode (which allows anyone to read/write). Phase 1 rules require authentication but don't yet enforce per-family isolation (that comes with S5-003). This is the immediate security fix.

**Implementation notes:**
- Rules file is already written at `firestore.rules` in the repo
- Deploy via Firebase Console: Firestore → Rules → paste and publish
- OR install Firebase CLI and run: `firebase deploy --only firestore:rules`
- Test rules in Firebase Console rules simulator before deploying
- Verify existing app still works after deployment (requires sign-in, which we don't have yet — may need to temporarily allow authenticated OR unauthenticated reads until S5-003 is done)
- Interim approach: keep read open but restrict write to prevent data tampering

**Acceptance criteria:**
- [ ] Firestore no longer in test mode
- [ ] Rules deployed and active
- [ ] App still functions correctly
- [ ] Firebase Console shows rules version history
- [ ] [DECISION NEEDED] Coordinate timing with S5-003 — deploying auth rules before auth is built will break the app

---

### S5-005 · Privacy Policy & Data Deletion
**Status:** TODO
**Priority:** High
**Category:** Compliance / GDPR

**Description:**
Write and publish a privacy policy covering what data Family Hub collects, why, how long it is kept, and how to request deletion. Add a "Delete all my family's data" option in Settings. Required before any public release or beta testing outside the immediate family.

**Implementation notes:**
- Privacy policy to be hosted at GitHub Pages: `/family-hub/privacy`
- Create a simple `privacy.html` page in the repo
- Cover: data collected, purpose, legal basis, retention, third parties (Firebase/Google), user rights, contact
- In Settings panel: add "Delete family data" button (admin only in Phase 2, anyone in Phase 1)
- Delete function: loop through all collections and delete all documents for this familyId
- Show confirmation dialog with "This cannot be undone" warning
- After deletion: clear localStorage, sign out, show "Data deleted" screen

**Acceptance criteria:**
- [ ] Privacy policy page live at /family-hub/privacy
- [ ] Policy covers all GDPR obligations (see compliance register)
- [ ] "Delete all data" button in Settings with confirmation
- [ ] Deletion removes all Firestore documents for the family
- [ ] Deletion clears localStorage
- [ ] Link to privacy policy shown on sign-in screen
- [ ] Audit passes

---

### S5-006 · Firebase API Key Restriction
**Status:** TODO
**Priority:** High
**Category:** Security

**Description:**
Restrict the Firebase API key so it can only be used from the Family Hub domain. Currently the key is unrestricted — anyone who reads the source code could use it. This is a quick Google Cloud Console change, not a code change.

**Implementation notes:**
- Go to Google Cloud Console → APIs & Services → Credentials
- Find the Browser key for the Family Hub Firebase project
- Under "Application restrictions" → select "HTTP referrers (web sites)"
- Add: `https://giuseppewf.github.io/*` and `http://localhost/*` (for local dev)
- Save and test that the app still works
- Note: this does not prevent determined attackers but raises the bar significantly
- Document the restriction in the compliance register

**Acceptance criteria:**
- [ ] API key restricted to family-hub domain in Google Cloud Console
- [ ] App still functions correctly from GitHub Pages URL
- [ ] App still functions from local dev (localhost)
- [ ] Compliance register updated
- [ ] [DECISION NEEDED] Add the SyncGo's local IP? Or rely on domain restriction only?

---

## 📋 COMPLIANCE TRACK

### C-001 · ICO Registration
**Status:** TODO
**Priority:** High
**Category:** Compliance / Legal

**Description:**
Register with the Information Commissioner's Office (ICO) as a data controller. Required under UK GDPR before any commercial activity involving personal data processing. Annual fee: £40 for small organisations (turnover under £632k, fewer than 10 staff).

**Steps:**
1. Go to ico.org.uk/registration
2. Complete the self-assessment to confirm registration is required
3. Pay £40 annual fee
4. Keep registration number on file — include in privacy policy

**Acceptance criteria:**
- [ ] ICO registration completed
- [ ] Registration number documented
- [ ] Privacy policy updated with ICO registration number
- [ ] Annual renewal reminder set

---

### C-002 · Cyber Essentials Certification
**Status:** TODO
**Priority:** Medium
**Category:** Compliance / Certification

**Description:**
Achieve Cyber Essentials certification — the UK government-backed baseline security standard. Covers five key controls: firewalls, secure configuration, access control, malware protection, and patch management. ~£300-500, takes 2-4 weeks. Strong trust signal for UK buyers.

**Prerequisites:** S5-003 (auth), S5-004 (security rules), S5-006 (API key restriction) should all be complete first.

**Steps:**
1. Choose a certification body (e.g. IASME, Cyber Essentials company list on NCSC website)
2. Complete self-assessment questionnaire covering the five controls
3. Submit for independent review
4. Receive certificate (valid 12 months)

**Acceptance criteria:**
- [ ] All five Cyber Essentials controls verified as implemented
- [ ] Self-assessment questionnaire completed
- [ ] Certificate received and stored
- [ ] Certificate number added to compliance register
- [ ] Certificate renewal reminder set (annual)

---

### C-003 · Data Processing Agreement with Google/Firebase
**Status:** TODO
**Priority:** Medium
**Category:** Compliance / GDPR

**Description:**
Sign Google's Data Processing Agreement (DPA) to formalise Firebase's role as a data processor. Required under GDPR when using a third-party processor. Google offers a standard DPA through the Google Cloud Console.

**Steps:**
1. Go to Google Cloud Console → IAM & Admin → Data Processing Amendment
2. Review and accept Google's standard DPA
3. Download and store a copy
4. Reference in privacy policy ("We have a DPA in place with Google LLC")

**Acceptance criteria:**
- [ ] Google DPA reviewed and accepted
- [ ] Copy downloaded and stored securely
- [ ] Privacy policy updated to reference DPA
- [ ] Compliance register updated

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

---

### S3-007 · Edit Modal — Multi-person Who Chip Selector
**Status:** TODO
**Priority:** High
**Category:** Bug / Consistency

**Description:**
The edit modals (`openEditItem`) still use plain dropdown selects for the "who" field on all item types. This is inconsistent with the add modals which use the chip selector. All edit modals must use the same chip interaction as the add modals.

**Implementation notes:**
- Add a new helper function `renderWhoChipsWithValue(containerId, hiddenId, preSelected)` that accepts a pre-selected value (may be comma-separated e.g. "Giuseppe, Ross") and renders the chips with those already highlighted
- Replace the who `<select>` in the innerHTML of each `openEditItem` case with a chips container div + hidden input
- Call `renderWhoChipsWithValue` after setting innerHTML for: todo, event, shop, meal, household edit cases
- On save, read value via `getWhoValue(hiddenId)` — already used in saveEditItem for some fields
- Test: open an item assigned to multiple people → edit → chips should reflect current assignment → change → save → verify update

**Acceptance criteria:**
- [ ] Edit modal for todos shows chip selector, not dropdown
- [ ] Edit modal for events shows chip selector, not dropdown
- [ ] Edit modal for shopping items shows chip selector, not dropdown
- [ ] Edit modal for meals shows chip selector, not dropdown
- [ ] Edit modal for household tasks shows chip selector, not dropdown
- [ ] Current assignee(s) pre-selected when edit modal opens
- [ ] Multi-person values (comma-separated) correctly pre-select multiple chips
- [ ] Value saved correctly after editing
- [ ] Audit passes with zero issues

---

### S3-008 · Checked Items — Move to Done Section on Completion
**Status:** TODO
**Priority:** High
**Category:** UX

**Description:**
When an item is ticked/completed, it should move out of the active list rather than staying in place. The behaviour should be consistent but contextually appropriate per tab:

- **To-dos & Chores:** Completed items animate down into the existing "Done" section at the bottom. Done section is visible but visually muted. Items can be un-ticked from there.
- **Shopping:** Ticked items stay visible but move to the bottom of their category group (useful while shopping to see what's in the trolley). Shown with strikethrough.
- **Household Tasks:** Completed tasks move to the existing "Completed" section at the bottom, same as todos.
- **Meals:** No concept of done — no change needed.
- **Calendar:** No concept of done — no change needed.

**Implementation notes:**
- For todos/household: the Done section already exists — ensure ticking an item triggers a re-render that moves it. The Firestore listener already calls `renderAll()` after any update so this may be mostly working — check if the issue is the render not being called promptly enough, or items not being sorted correctly in the render function
- For shopping: sort items within each category so `done: false` items appear first, `done: true` items appear at bottom with strikethrough
- Add a smooth CSS transition: `transition: opacity 0.3s, transform 0.3s` on list items so the movement feels satisfying rather than jarring
- "Clear completed" button should appear in shopping when any items are ticked (to bulk-delete done items after a shop)
- Consider: show count of done items in the Done section header e.g. "Done (3)"

**Acceptance criteria:**
- [ ] Ticking a todo moves it to Done section (not stays in place)
- [ ] Ticking a household task moves it to Completed section
- [ ] Ticking a shopping item moves it to bottom of its category
- [ ] "Clear completed" button appears in shopping when items are ticked
- [ ] Done section header shows count e.g. "Done (3)"
- [ ] Items can be un-ticked from Done section
- [ ] Smooth visual transition when item moves
- [ ] Audit passes with zero issues

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
