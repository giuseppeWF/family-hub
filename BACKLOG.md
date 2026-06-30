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

### S5-001 · Google Calendar Sync (Read) — DEPRIORITISED
**Status:** BLOCKED
**Priority:** Low
**Category:** Integration

**Description:**
Automatic Google Calendar sync has been deprioritised in favour of the deliberate "Forward to Family Hub" approach (S5-002). 

**Reasoning:**
Most families don't cleanly separate work and personal calendars. Automatic sync would import noise (standups, pipeline reviews, internal meetings) alongside genuinely family-relevant events. There is no reliable automated filter that works for everyone — calendar-level filtering assumes multiple calendars, visibility filtering assumes consistent tagging, keyword filtering assumes new habits.

The forward/share approach is more deliberate, lower noise, and works regardless of how someone manages their existing calendar. We will revisit automatic sync only if family testing reveals strong demand for it.

**If we do revisit this, the agreed approach will be:**
- User explicitly selects which Google Calendar(s) to sync (not all)
- Private/personal visibility events only (not work meetings)
- Option to sync back hub events to Google Calendar (bi-directional)
- Setup wizard asks: "sync a calendar" or "forward individual events" — but only once both options are built

**Acceptance criteria (future):**
- [ ] Per-calendar selection during setup
- [ ] Private events only filter
- [ ] Bi-directional sync option
- [ ] [DECISION NEEDED] Revisit after S5-002 is live and family feedback gathered

---

### S5-002 · Forward to Family Hub
**Status:** TODO
**Priority:** High
**Category:** Integration

**Description:**
The primary calendar integration approach. Family members forward or share any item — from any app, any calendar, any platform — to a shared Family Hub inbox. A parser detects the type and creates the right item on the hub automatically. Works for events, tasks, shopping, out of office, and working location. No OAuth required, no calendar lock-in, no noise.

This is the feature Skylight charges $79/year for. We build it free.

**Supported forward types:**

| Type | Prefix / Detection | Hub Action |
|------|--------------------|------------|
| Event | `event:` or calendar invite | Creates calendar event |
| To Do / Task | `task:` or `todo:` | Creates to-do item |
| Shopping | `shopping:` or `shop:` | Adds to shopping list |
| Out of Office | `ooo:` or detected OOO pattern | Shows OOO banner on dashboard next to person's name |
| Working location | `location:` or `wfh:` / `wfo:` | Shows location indicator on dashboard (e.g. "Giuseppe — London 📍") |
| Meal | `meal:` | Adds to meal planner for specified day |

**Implementation notes:**
- Use Gmail + Google Apps Script (lucarellifamily@gmail.com or dedicated familyhub@ address)
- Apps Script trigger: runs every 5 minutes, checks for unread emails in a "Family Hub" label
- Parser reads subject line for prefix, falls back to body parsing
- Type auto-detection: OOO events contain "Out of office" / "OOO" patterns; working location contains "Working from [place]" / "WFH" / "WFO"
- Writes directly to Firestore via REST API using Firebase Admin credentials stored in Apps Script properties
- For OOO and working location: store in new Firestore collection `presence` with fields: `who`, `type` (ooo/location), `value` (location string or "OOO"), `from`, `to`
- Dashboard shows presence indicators next to family member names in the header or summary banner
- Items appear within 5 minutes of forwarding
- Mark processed emails as read and archive them
- [DECISION NEEDED] Giuseppe to set up Apps Script and share service account credentials

**Forward examples:**
```
Subject: event: Dentist - Malachi - Tuesday 10am-10:30am
Subject: task: Hoover lounge - Mack
Subject: shopping: Milk x2, bread, eggs, dog food
Subject: ooo: Giuseppe - Mon 30 Jun to Wed 2 Jul
Subject: location: Giuseppe - London - Tuesday
Subject: meal: Pasta arrabbiata - Thursday
```

**Bi-directional sync (future):**
When events are added directly on the Family Hub, show a prompt: "3 events were added to the hub — sync to your Google Calendar?" User taps yes, events are pushed back to their personal Google Calendar. This requires OAuth (S5-001 scope) and is a future enhancement once S5-002 is live and validated.

**Acceptance criteria:**
- [ ] Forward email with "event:" → calendar event created within 5 mins
- [ ] Forward email with "task:" or "todo:" → to-do created
- [ ] Forward email with "shopping:" → items added to shopping list
- [ ] Forward email with "ooo:" → OOO indicator shown on dashboard for that person
- [ ] Forward email with "location:" → working location shown on dashboard
- [ ] Forward email with "meal:" → meal added to planner
- [ ] Auto-detection works for standard OOO calendar events forwarded as email
- [ ] Processed emails archived automatically
- [ ] Items appear within 5 minutes
- [ ] [DECISION NEEDED] Giuseppe to set up Apps Script

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
---

### S3-010 · Shopping List — Who Added + Store + Better Categories
**Status:** TODO
**Priority:** High
**Category:** Feature / UX

**Description:**
Three related improvements to the shopping list that make it significantly more useful for a family where different people shop at different stores.

**1. Show who added each item**
On the dashboard shopping widget and the full shopping tab, show the name of whoever added the item next to it. Useful context — "Malachi added dog food" tells Ross it's important, not optional.

- Already stored as `who` field on shopping items (added in earlier sprint)
- Just needs to be displayed in the shopping list render
- Show as small coloured name tag using existing `who-tag-{name}` CSS classes
- On dashboard widget: show as a small dot in the person's colour (space is limited)
- On full shopping tab: show name tag inline with the item

**2. Optional store field**
When adding a shopping item, an optional "Store" field lets you specify where to buy it. Particularly useful for items that only come from specific shops (Home Bargains, Lidl, Aldi, Costco, Amazon etc.).

- Add optional `store` field to shopping items in Firestore
- Add "Store (optional)" input to the add shopping modal — free text input
- Add "Store" field to the edit shopping modal
- On the full shopping tab: group items by store if stores are specified, otherwise group by category as now
- Show store as a small grey label on each item
- On dashboard widget: show store name in muted text if specified

**3. Replace fixed categories with Apple-standard categories**
Current categories (Fridge & Fresh, Store Cupboard, Freezer, Household) are too limited. Replace with Apple Shopping List standard categories which users will already recognise:

New categories:
- Produce
- Dairy & Eggs
- Meat
- Seafood
- Bakery
- Frozen Foods
- Canned Goods
- Dry Goods & Pasta
- Snacks & Sweets
- Beverages
- Alcohol
- Condiments & Sauces
- Household
- Personal Care
- Baby
- Pet Supplies
- Other

Also add ability to create a custom category — free text input that appears as an option alongside the standard ones, saved to localStorage as `fh_custom_categories`.

**Implementation notes:**
- Update `new-shop-cat` select options in add modal
- Update `edit-shop-cat` select options in edit modal
- Update renderShopping() to use new category list for grouping
- Migrate display only — existing items keep their old category value, just display under "Other" if not in new list
- Store grouping: if any item has a `store` field set, show a "By Store" toggle at top of shopping tab. Default view remains "By Category"
- Add `store` to required_fields in audit.py? No — it's optional, so don't add to audit

**Acceptance criteria:**
- [ ] Who added shown on full shopping tab (name tag in their colour)
- [ ] Who added shown as colour dot on dashboard widget
- [ ] Store field available in add modal (optional)
- [ ] Store field available in edit modal
- [ ] Store shown on item in shopping list
- [ ] "By Store" grouping toggle appears when any item has a store set
- [ ] Apple-standard categories in add and edit modals
- [ ] Custom category option available
- [ ] Existing items with old categories display under "Other" gracefully
- [ ] Audit passes

---

### S3-011 · "What's New" Feature Announcement System
**Status:** TODO
**Priority:** Medium
**Category:** UX / Engagement

**Description:**
Every time a significant new feature is deployed, show a "What's New" popup to family members on their next visit. Keeps the family informed about new capabilities without them having to check release notes.

**Implementation notes:**
- Store current app version in a JS constant at top of index.html: `const APP_VERSION = '2.1';`
- On app load, compare `APP_VERSION` with `localStorage.getItem('fh_seen_version')`
- If different (or not set), show the What's New modal after a 1-second delay
- Modal shows: title "🎉 What's New", version number, list of new features with emoji icons
- Each feature entry: icon + feature name + one-line description
- "Got it" button sets `fh_seen_version = APP_VERSION` in localStorage and closes modal
- Keep announcements for last 2 versions only (don't show old news)
- Hardcode announcements in JS as an array — no backend needed

**Feature announcement format:**
```javascript
const WHATS_NEW = {
  version: '2.1',
  features: [
    { icon: '📋', name: 'Forward to Family Hub', desc: 'Email or share any event, task or shopping item directly to the hub' },
    { icon: '🏪', name: 'Store labels on shopping', desc: 'Tag items with the store — Lidl, Home Bargains, Amazon etc.' },
    { icon: '👥', name: 'See who added what', desc: 'Shopping items now show who added them' },
  ]
};
```

**On the video idea:**
Add an optional `videoUrl` field to each feature announcement. If present, show a small play button next to the feature. Tapping opens the video in a modal (YouTube embed or direct MP4). For now the field can be null — the infrastructure is there when videos are ready.

```javascript
{ icon: '📋', name: 'Forward to Family Hub', desc: '...', videoUrl: null }
```

**Acceptance criteria:**
- [ ] What's New modal appears on first load after version change
- [ ] Does not appear again once dismissed
- [ ] Shows feature list with icons and descriptions
- [ ] "Got it" button dismisses and remembers
- [ ] Video URL field supported in data structure (even if null for now)
- [ ] Modal is dismissible by tapping outside
- [ ] Consistent styling with other modals
- [ ] APP_VERSION constant at top of file — easy for agent to find and update
- [ ] Audit passes

---

### S3-012 · User Documentation & Feature Guide
**Status:** TODO
**Priority:** Medium
**Category:** Documentation

**Description:**
Create simple, friendly user documentation that any family member can follow. Not a technical manual — a guide written for people who just want to know how to use the app.

**Approach:**
A `guide.html` page hosted alongside the app on GitHub Pages at `https://giuseppewf.github.io/family-hub/guide`. Linked from the Settings panel ("Help & Guide" button). Matches the app's visual style.

**Content to cover:**
- Getting started (onboarding, sharing with family)
- Dashboard overview — what each widget shows
- Calendar — adding events, recurring events, month view
- To-dos & Chores — adding tasks, assigning to people, recurring tasks, due dates
- Shopping list — adding items, categories, stores, ticking off while shopping
- Meals — planning the week, favourites, picking from the meal bank
- Household Tasks — projects, rooms, priorities
- Forward to Family Hub — how to forward events, tasks, shopping items
- Settings — adding/removing family members, renaming the hub, sharing the link
- FAQ — why is my data not showing? How do I get it on my phone? Can I use it on multiple devices?

**Format:**
- Single HTML file, same dark teal styling as the app
- Each section has a clear heading, 2-3 sentences of explanation, and a concrete example
- Screenshots or simple diagrams where helpful (can be added later)
- Mobile-friendly — someone will read this on their phone

**Acceptance criteria:**
- [ ] guide.html created and pushed to repo
- [ ] Accessible at /family-hub/guide URL
- [ ] All major features documented
- [ ] Linked from Settings panel ("Help & Guide" button)
- [ ] Mobile-friendly layout
- [ ] Consistent visual style with the app
- [ ] Short and friendly — not a wall of text


---

### S3-013 · Mobile Layout Polish Pass
**Status:** TODO
**Priority:** High
**Category:** Design / UX

**Description:**
A focused mobile layout fix based on real device testing (iPhone, portrait ~390px wide). The app renders but several areas look unbalanced or broken on mobile. Fix all of the following in one pass.

**Reference screenshot:** Family_Hub.png (attached in repo — add it to /docs/ folder for reference)

**Issues to fix:**

**1. Header — hub name wrapping and layout balance**
- Hub name ("THE LUCARELLI HUB") is wrapping to two lines on mobile, pushing the house emojis to stack vertically
- Fix: on screens under 768px, reduce hub name font size to 13px and remove one house emoji (keep left one only, or show just 🏠 without text on very narrow screens)
- Header should be a clean single row: [clock + date] | [hub name] | [live dot + settings cog]
- Max height: 60px on mobile
- If hub name still wraps below 380px: hide it entirely and show only the 🏠 emoji

**2. Nav tabs — badge positioning and label wrapping**
- Badges (numbers showing count) are dropping below the tab label inconsistently
- "To-dos & Chores" wraps to two lines, making that tab taller than others
- Fix: on mobile, show icon only in nav tabs — hide text labels entirely below 600px. Badges should appear as superscript on the icon, not below the label
- Badge styling: small circle, top-right of icon, absolute positioned
- This is already partially done for very narrow screens — extend the breakpoint to 768px

```css
@media (max-width: 768px) {
  .nav-tab span:not(.tab-icon):not(.badge) { display: none; }
  .nav-tab { position: relative; padding: 12px 0; }
  .badge { 
    position: absolute;
    top: 6px;
    right: calc(50% - 18px);
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
  }
}
```

**3. Overview widgets — enable vertical scrolling**
- Dashboard cards on mobile are clipping — content below the fold is not reachable
- Fix: `#view-dashboard.active` on mobile should be `overflow-y: auto` with `-webkit-overflow-scrolling: touch`
- Cards should stack in a single column (already done) but the container must scroll
- Each card should have a `max-height` of ~200px on mobile with internal scroll if content overflows
- Remove any `overflow: hidden` on the dashboard container that prevents scrolling

**4. "Arrange" button positioning on mobile**
- Currently floating bottom-right but overlapping content on mobile
- Fix: on mobile, move Arrange button to be inline in the Overview header area rather than floating
- Or: show it only when in Overview tab, positioned above the nav bar (not over content)

**5. Minimum font size compliance**
- Enforce 12px minimum across all text on mobile
- Check: event-time, event-who, task-tag, shop-item-qty, meal-day, badge text, summary text
- Any text currently below 12px should be raised to 12px
- Exception: badge numbers inside nav tabs can be 10px as they are supplementary indicators

**6. Summary banner on mobile**
- "TODAY | 4 tasks to do · 8 items to get" — this is working well, keep it
- But ensure it doesn't wrap to two lines on very narrow screens
- Fix: truncate with ellipsis if needed, or reduce to just counts: "4 tasks · 8 items"

**Implementation notes:**
- Test at 390px width (iPhone 14 standard) and 375px (iPhone SE)
- All fixes should be in `@media (max-width: 768px)` blocks
- Do not change desktop layout — only mobile breakpoints
- The `@media (max-width: 620px)` block for SyncGo portrait should also be reviewed
- After implementing, check that the QA audit still passes (it checks for class names, not layout)

**Acceptance criteria:**
- [ ] Header fits on one line at 390px width
- [ ] Hub name does not wrap to two lines on mobile
- [ ] Nav tabs show icon only on mobile (no wrapping text)
- [ ] Badges appear as superscript on icons, not below labels
- [ ] All tabs same height in nav bar
- [ ] Overview cards scroll vertically on mobile
- [ ] No content clipped below the fold on overview tab
- [ ] Arrange button does not overlap content on mobile
- [ ] All text is minimum 12px (10px allowed for badge numbers only)
- [ ] Summary banner fits on one line at 390px
- [ ] SyncGo portrait layout (620px) still renders correctly
- [ ] Desktop layout (1024px+) unchanged
- [ ] Audit passes with zero issues


---

### S3-014 · Header Redesign + Tab Icon Fixes + Settings Sync
**Status:** TODO
**Priority:** High
**Category:** Design / UX / Infrastructure

**Description:**
A consolidated fix for several issues identified during mobile testing on 30 June 2026. Covers header layout, tab badge logic, and settings synchronisation across devices.

**Reference screenshot:** Screenshot_2026-06-30_at_00_58_13.png

---

**1. Header redesign — two-row layout (all devices)**

Current single-row header is cramped on mobile and doesn't scale well. Replace with a clean two-row layout across ALL devices:

Row 1 (top): Hub name centred, full width, slightly larger
Row 2 (bottom): Clock left | date centre | Live dot + settings cog right

```
┌─────────────────────────────────────┐
│         🏠 THE LUCARELLI HUB        │  ← Row 1: hub name, teal, bold
│  00:58  │  Tuesday 30 June  │ ● Live ⚙️ │  ← Row 2: clock, date, status
└─────────────────────────────────────┘
```

- Row 1: background slightly darker than row 2 to create visual separation
- Row 1 height: 36px. Row 2 height: 44px. Total header: 80px
- Hub name: Nunito, font-weight 800, teal colour, centered, truncate with ellipsis if too long
- Remove the Today/summary banner entirely — this information is now redundant with the tab badges
- Apply this layout to ALL screen sizes, not just mobile

**2. Remove summary banner**

The "TODAY | 4 tasks to do · 8 items to get" banner under the header is redundant now that the nav tabs show counts. Remove it entirely. This reclaims vertical space and reduces visual noise.

- Remove `id="summary-banner"` element from HTML
- Remove `updateSummary()` calls that update summary text
- Keep `updateSummary()` function but only update badge counts, not the banner
- Note: audit.py does NOT check for summary-banner so no audit changes needed

**3. Tab icons — fix meals icon and calendar badge logic**

Issues identified:
- Meals tab has no icon — should show 🍽 (it may have been lost in a previous update)
- Calendar badge shows blank when 0 — should show nothing (empty string) when 0, same as other tabs
- Meals tab should show count of meals planned this week (0-7)
- All badges: show number when > 0, show nothing when 0. Never show "0" or a blank badge circle

Updated badge logic:
```javascript
// Calendar: count of today's events
badge-cal:   todayEvents.length > 0 ? todayEvents.length : ''
// Todos: count of pending (not done) tasks  
badge-todo:  pending.length > 0 ? pending.length : ''
// Shopping: count of items not yet got
badge-shop:  notGot.length > 0 ? notGot.length : ''
// Meals: count of meals planned this week (any day with a meal)
badge-meals: mealsThisWeek.length > 0 ? mealsThisWeek.length : ''
// House: count of high priority incomplete tasks
badge-house: highPriority.length > 0 ? highPriority.length : ''
```

**4. Overview widgets — scrolling fix**

Widgets on the overview page clip content and cannot scroll. Two fixes needed:

a) The dashboard container (`#view-dashboard`) must scroll vertically on ALL screen sizes:
```css
#view-dashboard.active {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: 100%;
}
```

b) Individual cards should NOT have internal scroll — they should show all their content and let the page scroll. Remove any `max-height` or `overflow: hidden` from `.dash-card` that prevents content showing. Cards can be as tall as their content needs.

c) On desktop (landscape), keep the 2x2 grid but allow the grid itself to scroll if content overflows.

**5. Hub name sync across all devices — move to Firestore**

Hub name is currently saved in localStorage only, so it doesn't sync across devices. This must move to Firestore so all family members see the same hub name.

- Create a Firestore collection `settings` with a single document `hub` containing `{ name: 'The Family Hub', updatedAt: timestamp }`
- Add a Firestore listener for `settings/hub` — on change, update the hub name in the header
- When admin saves hub name in Settings, write to Firestore `settings/hub` instead of localStorage
- On first load, read from Firestore. Fall back to localStorage if Firestore not yet loaded
- Seed `settings/hub` with current localStorage value if Firestore doc doesn't exist yet
- Add `listenCol` equivalent for single document: use `onSnapshot(doc(db, 'settings', 'hub'), ...)` 
- Add `settings` to the Firestore listener setup
- Update audit.py: add check for `listenCol` or `onSnapshot` for settings

**6. Family members sync across all devices — move to Firestore**

Same problem as hub name — family members are in localStorage only. Move to Firestore.

- Store family members in Firestore `settings/members` as `{ members: [...] }`
- Listener updates `window.fbMembers` and calls `injectMemberStyles()` and `refreshAllDropdowns()`
- On Settings save (addFamilyMember, removeFamilyMember), write to Firestore not just localStorage
- Keep localStorage as a fast-load cache — write to both, Firestore is source of truth
- Seed Firestore `settings/members` from localStorage on first run if not yet in Firestore

**Implementation notes:**
- The `settings` collection needs to be added to Firestore rules (both Phase 1 and Phase 2)
- Add `settings` listener to the DOMContentLoaded block alongside events, todos etc.
- The admin PIN / settings lock is a separate backlog item (S3-015) — do NOT implement auth here
- After implementing, verify on two different browsers that hub name change propagates within 2 seconds

**Acceptance criteria:**
- [ ] Header is two rows on all screen sizes
- [ ] Row 1: hub name centred
- [ ] Row 2: clock left, date centre, live dot + settings right
- [ ] Summary banner removed
- [ ] Meals tab has 🍽 icon
- [ ] Meals tab shows count of meals planned this week
- [ ] Calendar badge empty (not "0") when no events today
- [ ] All badges: number when > 0, nothing when 0
- [ ] Overview page scrolls vertically on mobile
- [ ] Cards show full content without internal clipping
- [ ] Hub name change in Settings propagates to all devices within 2 seconds
- [ ] Family member changes in Settings propagate to all devices within 2 seconds
- [ ] Settings collection added to Firestore listeners
- [ ] Firestore rules updated to include settings collection
- [ ] Audit passes with zero issues

---

### S3-015 · Settings PIN Lock (Soft Admin Protection)
**Status:** TODO
**Priority:** Medium
**Category:** Security / UX

**Description:**
Until proper Google Sign-In authentication (S5-003) is built, protect Settings with a simple 4-digit PIN set by the hub owner. This prevents family members (particularly teenagers) from accidentally or deliberately changing hub settings.

**Note:** This is a soft lock — not real security. It prevents casual access but a determined person could clear localStorage. Real admin protection comes in S5-003 with Google authentication. This is explicitly a stop-gap.

**Ownership model — Phase 1 (PIN):**
- First person to set the PIN becomes the hub owner
- Stored in Firestore `settings/pin` as `{ hash: '...', setBy: 'Giuseppe', setAt: timestamp }`
- `setBy` is a free-text name (not a Google account — we don't have auth yet)
- Only one owner in Phase 1 — multiple admins come in Phase 2
- The `setBy` name carries forward to S5-003 where it is matched to a Google account and promoted to super admin automatically

**Ownership model — Phase 2 (S5-003 Google auth):**
- Original owner becomes "super admin" — cannot be demoted
- Super admin can promote any family member to "admin"
- Multiple admins supported — each authenticates with their own Google account
- Admins can add/remove other admins (but not the super admin)
- Super admin is the only one who can delete the hub entirely
- Store admin roles in Firestore `settings/admins` as array of Google UIDs

**Implementation notes:**
- On first Settings open: if no PIN set in Firestore, show "Protect your hub settings" screen
- User enters their name and chooses a 4-digit PIN → they become the owner
- PIN hashed with SHA-256 via Web Crypto API (built into browser, no libraries)
- Hash stored in Firestore `settings/pin.hash`, name in `settings/pin.setBy`
- On subsequent Settings opens: show PIN entry keypad first
- Correct PIN → open Settings. Wrong PIN → "Incorrect PIN", shake animation, try again
- After 5 wrong attempts: 30-second lockout (store attempt count in Firestore)
- "Forgot PIN" option: admin must confirm their name matches `setBy` + answer "What is the hub name?" — if correct, PIN is reset and they set a new one
- PIN entry UI: large digit buttons (min 56px touch target), clean dark teal style, hub name shown above
- Show "⚙️ Settings are protected — ask [setBy name] for access" to non-admins
- Add "Change PIN" and "Transfer ownership" options inside Settings once unlocked
- PIN syncs across devices via Firestore listener on `settings/pin`

**What PIN protects:**
- Adding/removing family members
- Changing hub name
- Changing hub colour theme (future)
- Clearing all completed items
- Resetting the hub
- Future S5-003: managing admin roles

**What PIN does NOT protect:**
- Adding events, tasks, shopping items, meals (all family members can do this)
- Ticking off tasks and shopping items
- Viewing any data
- Onboarding (first-time setup before PIN is set)

**Acceptance criteria:**
- [ ] First Settings open shows "Protect your hub" screen — enter name + 4-digit PIN
- [ ] First setter stored as owner in Firestore settings/pin.setBy
- [ ] Subsequent Settings opens show PIN keypad — correct PIN opens Settings
- [ ] Wrong PIN shows error with shake animation
- [ ] After 5 wrong attempts: 30-second lockout
- [ ] Forgot PIN flow: confirm name + hub name → reset PIN
- [ ] PIN stored as SHA-256 hash in Firestore settings/pin.hash
- [ ] PIN and owner name sync to all devices via Firestore listener
- [ ] Non-admin devices show "Settings protected by [name]" message
- [ ] Change PIN option inside Settings (requires current PIN)
- [ ] Transfer ownership option inside Settings
- [ ] PIN entry has large touch targets (min 56px buttons)
- [ ] Firestore rules updated to protect settings/pin (read: authenticated, write: authenticated)
- [ ] Audit passes with zero issues
- [ ] [FUTURE S5-003] Multiple admins — owner can promote family members to admin role
- [ ] [FUTURE S5-003] Admin roles stored in Firestore settings/admins as array of Google UIDs
- [ ] [FUTURE S5-003] Super admin (original owner) cannot be demoted


---

### S4-004 · Data Protection — Soft Delete, Undo, and Activity Log
**Status:** TODO
**Priority:** Medium
**Category:** Security / UX / Trust

**Description:**
Protect family data from accidental or deliberate deletion by teenagers (or anyone). The solution is not to lock down delete — that creates friction for legitimate use. The solution is to make deletion reversible and visible.

**The threat model (yes, this is real):**
- A 16-year-old deletes a chore they don't want to do
- Someone accidentally deletes the whole meal plan
- A shopping list gets cleared right before a big shop
- A calendar event gets deleted and nobody can remember the details
- General "rage baiting" — deleting things to wind up parents

**The solution — three layers:**

**Layer 1: Soft delete (never truly delete immediately)**
Instead of removing documents from Firestore, mark them as deleted:
```javascript
// Instead of: await fbDelete('todos', id)
// Do: await fbUpdate('todos', id, { deleted: true, deletedAt: serverTimestamp(), deletedBy: currentUserName })
```
- All read queries filter out `deleted: true` documents
- Firestore keeps the data — it just doesn't show in the UI
- After 30 days, a cleanup function permanently removes soft-deleted items
- This also protects against accidental Firebase Console deletions

**Layer 2: Undo toast notification**
After any deletion, show a 5-second "Undo" toast at the bottom of the screen:
```
🗑 "Hoover downstairs" deleted  [Undo]
```
- Tapping Undo immediately restores the item (`deleted: false`)
- Toast is visible to everyone on all devices simultaneously (via Firestore listener)
- After 5 seconds: toast disappears, item remains soft-deleted (still recoverable by admin for 30 days)
- Toast shows on ALL connected devices — so if Mack deletes a chore, Giuseppe sees it on the SyncGo

**Layer 3: Activity log (admin only, behind PIN)**
A simple log of recent changes accessible in Settings → "Recent Activity":
- Shows last 50 actions: who added/edited/deleted what, and when
- Stored in Firestore `activityLog` collection, capped at 100 documents
- Each entry: `{ action: 'deleted', item: 'Hoover downstairs', collection: 'todos', who: 'Mack', at: timestamp }`
- Admin can restore any deleted item from the log with one tap
- Log is read-only — cannot be edited or deleted (even by admin)
- Retention: 30 days

**What triggers an activity log entry:**
- Any item created (add event, task, shopping item, meal, household task)
- Any item edited
- Any item deleted
- Any item marked done/undone
- Settings changes (hub name, members added/removed)
- PIN set or changed

**Implementation notes:**
- Add `deleted`, `deletedAt`, `deletedBy` fields to all Firestore documents
- Update all `renderX()` functions to filter: `.filter(item => !item.deleted)`
- Update `deleteItem()` function to soft-delete instead of hard-delete
- Add `logActivity(action, collection, itemName, who)` helper function called on every mutation
- Toast component: fixed position bottom of screen, slides up, auto-dismisses, has Undo button
- Toast must be visible above the nav bar — z-index above everything except modals
- Firestore rules: `activityLog` is read-only for all authenticated users, write only via app (not console)
- Add `activityLog` to Firestore listeners so admin log updates in real time
- Cleanup function: on app load, check for soft-deleted items older than 30 days and hard-delete them
- [DECISION NEEDED] Should non-admins be able to see the activity log, or only admins?

**What this does NOT do:**
- Does not prevent deletion (that would be too restrictive)
- Does not require admin approval to delete (too much friction)
- Does not lock items (future feature if needed)
- Does not send push notifications (future — S4-005)

**Future enhancement — item locking (S4-005):**
Admin can "lock" specific items so they cannot be deleted or edited without PIN. Useful for recurring chores that keep mysteriously disappearing. A small 🔒 icon on locked items. Only admin can lock/unlock.

**Acceptance criteria:**
- [ ] Deleting any item soft-deletes (sets deleted: true) instead of removing from Firestore
- [ ] Soft-deleted items do not appear in any list or dashboard view
- [ ] Undo toast appears for 5 seconds after any deletion on all connected devices
- [ ] Tapping Undo within 5 seconds restores the item immediately
- [ ] Activity log records all create/edit/delete/done actions with who and when
- [ ] Activity log accessible in Settings → Recent Activity (behind PIN)
- [ ] Admin can restore any deleted item from activity log
- [ ] Activity log is read-only — no edit or delete
- [ ] Soft-deleted items older than 30 days are cleaned up on app load
- [ ] Toast does not obscure nav bar or action buttons
- [ ] Audit passes with zero issues
- [ ] [DECISION NEEDED] Activity log visibility: admins only, or all family members?

---

### S4-005 · Item Locking (Admin Only)
**Status:** TODO
**Priority:** Low
**Category:** Feature / Security

**Description:**
Allow admins to lock specific items so they cannot be deleted or edited without the Settings PIN. The nuclear option for chores that keep mysteriously disappearing.

**Implementation notes:**
- Add `locked: true/false` field to any Firestore document
- Locked items show a small 🔒 icon
- Attempting to delete or edit a locked item: show "This item is locked by [admin name]. Ask them to unlock it."
- Only admin (PIN verified) can lock or unlock items
- Long-press on any item → context menu: Lock / Unlock (admin only, PIN required)
- Locked items cannot be soft-deleted either — they are fully protected

**Acceptance criteria:**
- [ ] Admin can lock any item (requires PIN)
- [ ] Locked items show 🔒 indicator
- [ ] Non-admins cannot delete or edit locked items
- [ ] Non-admins see clear message explaining why
- [ ] Admin can unlock items (requires PIN)
- [ ] Audit passes


---

### S3-016 · Shopping — Auto-assign "Added By" + Smart Category Guessing
**Status:** TODO
**Priority:** High
**Category:** Feature / UX

**Description:**
Two related improvements to reduce friction and improve accountability when adding shopping items.

**1. Auto-assign "Added By" to the current device's user**

Currently the "Added by" field defaults to "Everyone" and must be manually selected. This means parents can't reliably see who actually added an item. Fix: each device remembers "who is using this phone" and auto-fills it.

**This requires a lightweight "whose device is this" concept** — not full authentication, just a per-device preference:

- On first use of the app on any device, show a one-time prompt: "Who's using this device?" with chips for each family member (reuses existing `renderWhoChips` pattern, single-select only)
- Store the answer in localStorage as `fh_this_device_user` (e.g. "Mack")
- This is NOT a security feature — anyone can change it. It is a convenience default, similar to how Netflix remembers "who's watching"
- Add "Switch user" option in Settings (no PIN required — this is not security-sensitive) so if Ross picks up Mack's old phone, he can correct it
- When adding ANY item (shopping, todo, event, meal, household task) — pre-select the current device's user in the who-chips selector
- For shopping specifically: make "Added by" a required field (cannot save without at least one person selected) — remove "Everyone" as a default option for shopping specifically, since parents want to know exactly who added it
- Show "Added by" prominently — not just a small tag, make it clearly visible on each shopping item

**2. Smart category guessing from item name**

When typing a shopping item name, suggest the most likely category automatically based on common keywords. Kids (or anyone) shouldn't need to know which of 17 categories "broccoli" belongs to.

- Build a static keyword-to-category lookup table covering common UK grocery items
- On `oninput` of the item name field, check against the lookup table and auto-select the matching category
- User can still override the suggested category — this is a smart default, not a lock
- Show a small "✨ Suggested" label next to the category dropdown briefly when auto-filled
- Lookup should be case-insensitive and match partial words (e.g. "chicken breast" matches "chicken")

**Example lookup table (agent should expand this list significantly — this is a starting point):**
```javascript
const CATEGORY_GUESS = {
  // Produce
  'apple':'Produce', 'banana':'Produce', 'broccoli':'Produce', 'carrot':'Produce',
  'lettuce':'Produce', 'tomato':'Produce', 'onion':'Produce', 'potato':'Produce',
  'cucumber':'Produce', 'pepper':'Produce', 'spinach':'Produce', 'avocado':'Produce',
  // Dairy & Eggs
  'milk':'Dairy & Eggs', 'cheese':'Dairy & Eggs', 'butter':'Dairy & Eggs',
  'yogurt':'Dairy & Eggs', 'yoghurt':'Dairy & Eggs', 'eggs':'Dairy & Eggs', 'cream':'Dairy & Eggs',
  // Meat
  'chicken':'Meat', 'beef':'Meat', 'pork':'Meat', 'bacon':'Meat', 'sausage':'Meat',
  'mince':'Meat', 'lamb':'Meat', 'ham':'Meat',
  // Seafood
  'fish':'Seafood', 'salmon':'Seafood', 'prawns':'Seafood', 'tuna':'Seafood', 'cod':'Seafood',
  // Bakery
  'bread':'Bakery', 'roll':'Bakery', 'bagel':'Bakery', 'croissant':'Bakery', 'baguette':'Bakery',
  // Frozen
  'frozen':'Frozen Foods', 'ice cream':'Frozen Foods', 'pizza':'Frozen Foods',
  // Canned
  'tinned':'Canned Goods', 'canned':'Canned Goods', 'beans':'Canned Goods', 'soup':'Canned Goods',
  // Dry goods
  'pasta':'Dry Goods & Pasta', 'rice':'Dry Goods & Pasta', 'cereal':'Dry Goods & Pasta',
  'flour':'Dry Goods & Pasta', 'oats':'Dry Goods & Pasta',
  // Snacks
  'crisps':'Snacks & Sweets', 'chocolate':'Snacks & Sweets', 'biscuits':'Snacks & Sweets',
  'sweets':'Snacks & Sweets', 'popcorn':'Snacks & Sweets',
  // Beverages
  'juice':'Beverages', 'water':'Beverages', 'squash':'Beverages', 'tea':'Beverages', 'coffee':'Beverages',
  // Alcohol
  'wine':'Alcohol', 'beer':'Alcohol', 'cider':'Alcohol',
  // Condiments
  'ketchup':'Condiments & Sauces', 'mayo':'Condiments & Sauces', 'sauce':'Condiments & Sauces',
  'oil':'Condiments & Sauces', 'vinegar':'Condiments & Sauces',
  // Household
  'bin bags':'Household', 'washing powder':'Household', 'toilet roll':'Household',
  'kitchen roll':'Household', 'cleaning':'Household', 'washing up liquid':'Household',
  // Personal care
  'shampoo':'Personal Care', 'soap':'Personal Care', 'toothpaste':'Personal Care',
  'deodorant':'Personal Care',
  // Pet
  'dog food':'Pet Supplies', 'cat food':'Pet Supplies', 'dog treats':'Pet Supplies',
};

function guessCategory(itemName) {
  const lower = itemName.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_GUESS)) {
    if (lower.includes(keyword)) return category;
  }
  return null; // no match — leave category as-is for manual selection
}
```

**Implementation notes:**
- Apply auto-fill who-chips to ALL add modals (event, todo, shop, meal, household) for consistency — not just shopping
- For shopping only: validate that at least one person is selected before allowing save (required field)
- For other item types: keep "Everyone" as an acceptable default — only shopping needs to be mandatory per this request
- Category guess only suggests — never blocks manual override
- Keep the keyword table easy to extend — agent should add at least 50-80 common UK grocery items, not just the starter list above

**Acceptance criteria:**
- [ ] First app use on a device prompts "Who's using this device?"
- [ ] Selection stored in localStorage, used to pre-fill who-chips on all add modals
- [ ] "Switch user" option in Settings (no PIN required)
- [ ] Shopping "Added by" field is mandatory — cannot save without a person selected
- [ ] "Added by" shown clearly on shopping list items (not just a small tag)
- [ ] Typing an item name suggests a category automatically for ~50+ common items
- [ ] Category suggestion shows "✨ Suggested" label briefly
- [ ] User can override the suggested category
- [ ] Category guess is case-insensitive and matches partial words
- [ ] Audit passes with zero issues


---

### S3-017 · Meals — Stop Overwriting Existing Day, Offer Next Available Slot
**Status:** TODO
**Priority:** Critical
**Category:** Bug

**Description:**
Currently, adding a meal for a day that already has one planned silently deletes the existing meal and replaces it. This is destructive and unexpected — if Sarah plans "Roast chicken" for Sunday and later Giuseppe tries to add "Fish and chips" for Sunday, the roast chicken should NOT be silently deleted. This is a genuine data-loss bug, not just a UX nitpick.

**Current (broken) behaviour:**
```javascript
const existing = getMeals().find(m => m.day === day);
if (existing) await window.fbDelete('meals', existing.id);
await window.fbSave('meals', { id, day, name, notes, who: getWhoValue('new-meal-who'), tag: 'New' });
```
This deletes the existing meal for that day without warning, every time.

**Required behaviour:**

When a user selects a day that already has a meal planned, do NOT overwrite it. Instead:

1. Detect the conflict when the day is selected in the modal (before saving) — show inline feedback immediately, not after tapping Save
2. Show a message under the day selector: "⚠️ [Existing meal name] is already planned for [day]"
3. Automatically suggest the next available day that week with no meal planned, and offer to switch to it: "Tuesday is free — switch to Tuesday?"
4. If the whole week is full, suggest the first available day the following week
5. User can still choose to view/edit the existing meal instead, via a "View existing" link
6. Only allow saving to a day that already has a meal if the user explicitly confirms "Replace existing meal" — this must be an explicit, deliberate action with a clear warning, never silent
7. If a meal needs replacing, the old one should be soft-deleted (per S4-004 pattern) not hard-deleted, so it can be recovered if it was a mistake

**Implementation notes:**
- Add an `oninput`/`onchange` listener to `new-meal-day` select that checks `getMeals()` for an existing entry on that day
- Show the warning message inline in the modal, below the day selector
- Calculate "next available day": loop through the 7 days of the current week starting from the selected day, find first day with no meal entry
- If implementing "View existing" — this should open the detail modal for that meal in a way that doesn't lose the in-progress add (consider: just close the add modal and open detail, losing draft input is acceptable here since user explicitly chose to view existing)
- Update `saveModal()` for meal type: check for conflict again at save time (in case it changed), require explicit confirmation flag before allowing overwrite
- Same logic applies in `saveEditItem()` if a user edits a meal's day to one that's already taken

**UI sketch:**
```
Day of week: [Sunday ▾]
⚠️ "Roast chicken" already planned for Sunday
   [View existing]  [Use Tuesday instead →]

   ☐ I want to replace the existing meal anyway
```

**Acceptance criteria:**
- [ ] Selecting a day with an existing meal shows inline warning immediately (not after save attempt)
- [ ] Warning shows the name of the existing meal
- [ ] Next available day is automatically suggested with a one-tap switch option
- [ ] If whole week is full, suggests first available day next week
- [ ] "View existing" link opens that meal's detail view
- [ ] Saving to an occupied day without explicit confirmation is blocked
- [ ] Explicit "replace anyway" checkbox/confirmation required to overwrite
- [ ] Replaced meal is soft-deleted, not hard-deleted (recoverable via S4-004 activity log)
- [ ] Same protection applies when editing a meal's day via Edit modal
- [ ] No meal is ever silently overwritten under any circumstance
- [ ] Audit passes with zero issues


---

### S4-006 · Adversarial Testing Framework
**Status:** DONE (framework created — ongoing process from here)
**Priority:** High
**Category:** Process / Quality

**Description:**
Following real-world testing by Malachi (age 16), several gaps were identified where a family member could access restricted areas or affect other people's data. Rather than treating these as one-off bugs, a permanent testing discipline has been created.

**What was built:**
- `TESTING.md` — a permanent companion file to BACKLOG.md containing:
  - Section A: Core regression tests, run after every sprint
  - Section B: Adversarial test cases, including the specific issues Malachi found
  - Section C: A running log of newly discovered issues, dated and attributed
- `AGENTS.md` updated — testing is now a mandatory gate before any backlog item can be marked DONE

**Findings from this round of testing (30 Jun 2026, found by Malachi):**
1. Could access Settings without entering PIN — tracked, will be verified once S3-015 ships
2. Could delete items added by other family members — by design, mitigated (not prevented) by S4-004 soft delete + undo
3. Could change other family members' task/event assignments — currently by design (no auth yet), open decision below

**Decision — RESOLVED 30 Jun 2026:**
Reassigning other family members' items will remain unrestricted. This is a deliberate product decision, not an oversight.

Rationale (Giuseppe): the priority is keeping the app frictionless for non-technical families. Every permission check, lock, or restriction adds UI complexity and decision fatigue — exactly what causes families to abandon shared apps. Family Hub is a trust-based tool for a small household, not a multi-user enterprise system. The combination of soft-delete + undo (S4-004) + activity log already gives full visibility and reversibility, which is the right level of protection for this context.

This decision should be revisited only if it causes a real, repeated problem in practice — not pre-emptively engineered against a hypothetical one. If it does become a problem, the lightest-touch fix (e.g. a gentle "this was assigned by Ross, are you sure?" confirmation) should be tried before any hard restriction.

**Acceptance criteria:**
- [x] TESTING.md created with regression and adversarial sections
- [x] AGENTS.md updated to require testing before marking items DONE
- [x] Malachi's findings documented as permanent regression tests
- [x] Decision on finding #3 resolved — no restriction added, documented rationale
- [ ] Future sprints reference TESTING.md, not just audit.py


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

### F-004 · Bi-directional Calendar Sync
**Status:** TODO
**Priority:** Medium
**Category:** Commercial / Integration

**Description:**
When events are created on the Family Hub, offer to push them back to family members' personal Google Calendars. Closes the loop — the hub becomes both a receiver and a source of calendar truth.

**Trigger:** After any event is added to the hub (manually or via forward), show a notification: "3 new events on the hub — add to your Google Calendar?" Family members can accept or dismiss.

**Implementation notes:**
- Requires Google OAuth write scope: `https://www.googleapis.com/auth/calendar.events`
- Each family member authenticates separately — events push to their own calendar
- Store OAuth tokens per family member in Firestore (encrypted)
- [DECISION NEEDED] Revisit after S5-002 is live and validated. Only build if family testing reveals demand.

---

### F-005 · Presence & Availability Dashboard
**Status:** TODO
**Priority:** Medium
**Category:** Feature / Commercial

**Description:**
Expand the working location and OOO concepts from S5-002 into a richer presence layer on the dashboard. At a glance, the family knows not just what's happening but where everyone is and whether they're reachable.

**Presence types:**
- 🏠 Home
- 🏢 Office / specific city  
- ✈️ Travelling (different country)
- 🤒 Unwell
- 🔕 Do not disturb
- 🌴 Holiday

**Implementation notes:**
- Manual update: tap your name on dashboard to set your status
- Automatic update: via S5-002 forward (location: / ooo:)
- Status shown as small indicator next to name in header or summary banner
- Optional: auto-clear after a set time (e.g. OOO clears when the date passes)
- This is especially useful for Giuseppe when travelling for Whatfix — family knows he's in Bangalore without having to ask

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
