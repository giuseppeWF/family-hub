# Family Hub — Test Plan

This file is the agent's testing companion to `BACKLOG.md` and `AGENTS.md`.
It must be run **after every sprint, before marking items DONE in BACKLOG.md.**

A sprint is not complete until every test in the relevant section below passes.
If a test fails, fix the issue, re-run `python3 audit.py`, then re-run the failed test.

---

## How to use this file

1. After implementing backlog items for a sprint, run `python3 audit.py` first (structural checks)
2. Then work through **Section A — Core Regression** in full
3. Then work through **Section B — Adversarial / Abuse Cases** in full
4. Any new bug found during testing gets added to Section B permanently, with the date and who found it, so it can never silently regress
5. Only mark backlog items DONE once both sections pass

---

## Section A — Core Regression Tests

Run these after every sprint regardless of what changed. They verify the app's fundamental promises still hold.

### A1. Data persistence & sync
- [ ] Add an event on one browser tab → appears on a second tab within 3 seconds without refresh
- [ ] Tick a todo as done on one device → updates on a second device within 3 seconds
- [ ] Delete a shopping item → disappears on all open devices
- [ ] Refresh the page → all data is still present (nothing lost on reload)
- [ ] Close and reopen the browser entirely → all data persists (Firestore, not just session)

### A2. Every tab — basic CRUD
For EACH of: Calendar, To-dos, Shopping, Meals, Household —
- [ ] Can add a new item via the top + button
- [ ] Can add a new item via the bottom + button
- [ ] New item appears in the list immediately
- [ ] Can tap an item to open its detail view
- [ ] Can edit the item and changes save correctly
- [ ] Can delete the item and it disappears
- [ ] Empty state shows correctly when the list has zero items (temporarily delete all to verify, then restore)

### A2a. Runtime checks the agent cannot verify by code-reading alone
**These must be verified by reasoning through the actual rendered output, not just code structure:**
- [ ] **Widget internal scroll:** On the overview/dashboard, add 8+ todo items and 8+ shopping items. Verify that inside each dashboard card, you can scroll within the card body to see all items. The card body element (`dash-card-body`) must have `overflow-y: auto` AND a `max-height` set — both are required. Verify both exist in CSS.
- [ ] **Priority sort timing:** In `renderHousehold()`, the sort must happen INSIDE the Firestore `onSnapshot` callback or the `fb-data` event handler — NOT on app init before data loads. Verify by tracing: where does `pending.sort(...)` appear relative to where `window.fbHousehold` is populated?
- [ ] **Repeat event generation timing:** The recurring event generation function must be called AFTER Firestore data has loaded (i.e. inside the `fb-data` handler or after `getEvents()` returns non-empty results). Verify the function is actually called somewhere and not just defined.
- [ ] **Tab badges:** After adding/deleting items, verify badge counts update immediately without a page refresh. Verify badges show `-` or nothing when count is 0, never a blank bubble.
- [ ] **Mark done without modal:** Tapping the circle/checkbox element directly must call toggle function, not showDetail. Verify the circle element has its OWN onclick that does NOT call showDetail.

### A3. Who / assignment
- [ ] Who-chip selector appears on all five add modals
- [ ] Selecting multiple people works (e.g. Giuseppe + Ross on one task)
- [ ] Selected people display correctly on the item afterward
- [ ] Editing an item's who-assignment via Edit modal pre-selects current assignees correctly

### A4. Mobile layout
- [ ] Open on a phone at ~390px width
- [ ] Header fits on screen without text wrapping awkwardly
- [ ] All 6 nav tabs visible and tappable without horizontal scroll
- [ ] Overview page scrolls vertically, no content is clipped/unreachable
- [ ] Modals are usable — all fields visible and fillable without horizontal scroll

### A5. Settings
- [ ] Settings opens (with PIN if S3-015 is live)
- [ ] Hub name change is visible on a SECOND device within a few seconds
- [ ] Adding a family member is visible on a SECOND device within a few seconds
- [ ] Family member colour shows correctly across the app after being added

### A6. QA self-check
- [ ] Triple-tap the header title → QA report opens
- [ ] QA report shows all green / "safe to deploy"

### A7. What's New system — check before EVERY deployment
The What's New popup is a common source of regressions. Verify all four of these before committing:

- [ ] **APP_VERSION constant exists** in index.html (e.g. `const APP_VERSION = '3.1'`)
- [ ] **version.json exists** in repo root and contains `{"version":"3.1",...}` 
- [ ] **Versions match exactly** — APP_VERSION in index.html === version in version.json. If they differ, the update prompt will loop forever showing on every load
- [ ] **fh_seen_version** is written to localStorage when popup is dismissed — verify the dismiss handler includes `localStorage.setItem('fh_seen_version', APP_VERSION)`
- [ ] **WHATS_NEW features list is current** — contains only real, shipped, end-user-facing features. No placeholders, no developer notes, no features that haven't shipped yet
- [ ] **After any deployment that bumps APP_VERSION** — open the app in an incognito window, verify the popup appears once, dismiss it, refresh, verify it does NOT appear again

**Rule for updating WHATS_NEW:**
Every sprint that ships user-visible features must update:
1. `APP_VERSION` — bump the version number
2. `version.json` — update to match
3. `WHATS_NEW.features` — add new features, remove nothing (users may not have seen older ones)
4. Only include end-user facing features — no infrastructure, security, or bug fix items
5. Write for a non-technical family member — plain English, emoji, benefit-focused

---

## Section B — Adversarial / Abuse Test Cases

These simulate a curious or mischievous family member (particularly a teenager) deliberately probing the app for weaknesses. Each test case below was either anticipated in advance or found through real testing. **Every case must remain in this file permanently** — even once fixed, keep testing it forever so it cannot silently regress in a future sprint.

### B1. Settings PIN bypass
**Found by:** Malachi, 30 Jun 2026 — got into Settings without entering the PIN
**Status:** Needs verification once S3-015 ships

Test steps:
- [ ] Open Settings — PIN prompt must appear (assuming a PIN has been set)
- [ ] Tap outside the PIN modal — Settings must NOT open without the correct PIN
- [ ] Press browser back button while PIN modal is open — Settings panel must not be left accessible underneath
- [ ] Try opening Settings via any other route in the app (e.g. a stray button, a link inside another modal) — PIN must be required every time, with no alternate path that skips it
- [ ] Open browser dev tools, manually call `openSettings()` from console — this is expected to still work for a technical user; this is a SOFT lock only (see S3-015 notes), document this limitation, do not attempt to prevent console access
- [ ] Refresh the page while Settings is open and unlocked — does it require the PIN again, or stay unlocked? (Decide and document the intended behaviour — recommend: require PIN again after refresh)

### B2. Deleting other people's items
**Found by:** Malachi, 30 Jun 2026 — could delete items added by other family members
**Status:** By design today (no ownership restrictions). Mitigated by S4-004 (soft delete + undo), not prevented.

Test steps:
- [ ] As any family member, delete an item that was added/assigned to someone else
- [ ] Confirm: item disappears immediately from the active view (expected — deletion is allowed)
- [ ] Confirm: Undo toast appears within 1 second, on the SAME device
- [ ] Confirm: Undo toast appears on OTHER connected devices too (e.g. parent sees it on the SyncGo)
- [ ] Confirm: tapping Undo restores the item fully, with original who-assignment intact
- [ ] Confirm: if Undo is not tapped, item remains recoverable via Settings → Recent Activity for 30 days
- [ ] Confirm: the activity log entry correctly shows WHO deleted it (not "Everyone" or blank)
- [ ] [DECISION NEEDED] Should there be a future restriction where only the item's creator or an admin can delete it? Currently: anyone can delete anything, but it's always reversible. Revisit after family feedback.

### B3. Changing other family members' assignments
**Found by:** Malachi, 30 Jun 2026 — could change who a task/item was assigned to
**Status:** By design today (shared device, no auth). Accepted as a known gap until S5-003.

Test steps:
- [ ] As any family member, edit a task assigned to someone else and change the assignment
- [ ] Confirm: change saves and syncs to all devices
- [ ] Confirm: activity log records who made the change (the editor, not the original assignee)
- [x] This is EXPECTED and PERMANENT behaviour, not a bug. Decision made 30 Jun 2026 (Giuseppe): unrestricted reassignment stays — frictionless UX for non-technical families is the priority. Will only be revisited if it causes a real, repeated problem in practice. See BACKLOG.md S4-006 for full rationale.

### B4. Rapid-fire / spam testing
- [ ] Tap the + button and Save rapidly 10 times in a row — does it create 10 duplicate items, or does the UI prevent double-submission?
- [ ] Recommend: disable the Save button immediately on tap, re-enable only after the Firestore write completes or fails
- [ ] Add 50+ items to a single list (e.g. shopping) — does the UI remain responsive, or does it lag/break?
- [ ] Type a very long string (500+ characters) into a name field — does it save correctly, break the layout, or get rejected gracefully?
- [ ] Paste emoji-only or special-character-only text into a name field — confirm it doesn't break rendering

### B5. Recurring task / event abuse
- [ ] Mark a daily recurring task done 10 times in a row rapidly — confirm it doesn't create 10 duplicate "next occurrence" entries, only one
- [ ] Set a recurring event to "Daily" and leave the app open for a simulated week (or manipulate system date if testing allows) — confirm it doesn't runaway-generate hundreds of future events
- [ ] **(S7-B04, added 2026-08-04)** Delete a recurring event → the single-vs-series prompt must appear; deleting a NON-recurring event must never show this prompt
- [ ] **(S7-B04)** Choose "This and future events" on delete → only occurrences dated on/after the one you deleted from disappear; earlier occurrences in the same series are untouched
- [ ] **(S7-B04)** Choose "This and future events" on edit → the edited name/time/who/notes apply to every future occurrence, but each occurrence keeps its OWN date (verify no two occurrences collapse onto the same date)
- [ ] **(S7-B04)** Cancel the single-vs-series prompt (both delete and edit) → confirm nothing was written to Firestore and, for edit, the edit modal stays open with the sync indicator back to "Live", not stuck on "Saving…"
- [ ] **(S7-B04)** Tap Undo after a series delete → ALL deleted occurrences reappear, not just the one you originally tapped delete on
- [ ] **(S7-B04)** Lock one future occurrence in a series (S4-005), then delete/edit "this and future" from an earlier occurrence → the locked occurrence is skipped, not force-deleted/edited
- [ ] **(S7-B06, added 2026-08-04)** Create a Weekly (or Daily/Fortnightly/Monthly) event with a "Repeat until" date several months out — confirm it shows on ONLY its actual occurrence day(s) on the calendar (week strip, month view), never on every day between creation and the "repeat until" date. Test on both mobile and web — this was found on mobile but the bug was in shared JS logic (`eventOnDay`), not device-specific
- [ ] **(S7-B06)** Tap each "Repeat until" quick-pick chip (1 month / 3 months / 6 months / 1 year) in both the Add Event and Edit Event modals — confirm the "Repeat until" date field itself visibly updates, separately from "End date"
- [ ] **(S7-B06)** Create a genuine multi-day event (S4-009, e.g. a 3-day holiday) with NO recurrence — confirm it still correctly spans all 3 days (this field's original behaviour must be unaffected by the recur-until fix)

### B6. Browser tools / console access
**Expected limitation — document, do not attempt to fully prevent**

- [ ] Confirm: a technically savvy person with browser dev tools could call internal functions directly (e.g. `toggleEditMode()`, `openSettings()`) bypassing UI restrictions
- [ ] This is normal for any client-side web app and is NOT a realistic security boundary
- [ ] True protection against this requires server-side validation (Firestore Security Rules), which DOES exist for actual data writes — console access to UI functions does not bypass Firestore rules
- [ ] Verify: even with direct console access to write functions, Firestore Security Rules still reject unauthorised writes (test once S5-004 rules are deployed)

### B7. Multi-device race conditions
- [ ] Two people edit the SAME item at the same time on two different devices — confirm last-write-wins behaviour doesn't cause a crash or corrupted data
- [ ] Two people try to claim the same meal slot for the same day simultaneously (post S3-017) — confirm the conflict warning works correctly for both

### B8. Stored HTML/script injection via free-text fields
**Found by:** independent test-agent pass, 4 Aug 2026 — S7-001. No escaping existed anywhere in the file before this.

- [ ] Type `<img src=x onerror=alert(1)>` into an event/todo/shop/meal/household name, notes, quantity, or store field, or a family member's name in Settings — confirm it renders as literal text everywhere it's displayed (dashboard, full list, calendar, detail modal, edit modal, activity log, favourites picker), never as a live image tag or executed script
- [ ] Type a name containing a double-quote (`"`) or single-quote (`'`) — confirm the edit modal's pre-filled input still shows the correct text and doesn't break the page or inject a working `onfocus`/`onclick` handler
- [ ] Set a family member's name to something containing `{` or `}` in Settings — confirm every OTHER member's colour-coding still renders correctly (this used to be able to corrupt the shared member-colour `<style>` block for everyone, not just that member)
- [ ] Confirm `escapeHtml()` is still called at every free-text render site if new item fields/views are ever added — this is the kind of check that's easy to silently skip on a new render path

### B9. Household "mark done" without opening the detail modal
**Found by:** independent test-agent pass, 4 Aug 2026 — S7-001.
- [ ] Tap the check circle directly on a Household list row (not the text) — confirm it toggles done/undone immediately, without opening the detail modal, matching Todos/Shopping/Dashboard behaviour
- [ ] Tap the household task text/notes — confirm it still opens the detail modal as before

### B10. Undo toast cross-device visibility
**Found by:** independent test-agent pass, 4 Aug 2026 — S7-001.
- [ ] Delete an item on Device A — confirm the Undo toast appears on Device B within a few seconds
- [ ] Tap Undo on Device B — confirm the item is restored on both devices
- [ ] Refresh Device A right after deleting something on it — confirm it does NOT re-show its own just-dismissed/expired toast from the historical activity log (only genuinely new deletes should trigger the cross-device toast, not the initial load of existing history)
- [ ] Known limit, not a bug: undoing a recurring-event *series* delete (S7-B04) from a DIFFERENT device than the one that deleted it only restores the single occurrence that device's delete button was on, not the rest of the series — full series restore only works from the same device, right after the delete, via Undo

### B11. Voice input coverage and whole-event fill
**Found by:** Giuseppe, real-device testing, 4 Aug 2026 — S7-B07.
- [ ] Every free-text field on every add form (event notes, shop quantity, shop store, meal notes, household notes — plus the existing name/text fields) has a working 🎤 button
- [ ] On the Add Event modal, tap "🎤 Say the whole thing" and say "Dentist appointment Tuesday at 3pm with Malachi" — confirm name/date/time/who all fill in correctly and nothing saves automatically
- [ ] Say a phrase with "next Tuesday" vs bare "Tuesday" on the same day — confirm "next" resolves a full week later than the bare form
- [ ] Say a phrase with no recognisable date/time/who (e.g. "walk the dogs") — confirm the whole phrase becomes the event name and no fields are incorrectly guessed
- [ ] On a browser without SpeechRecognition support, confirm both the per-field mic buttons AND the new "say the whole thing" banner are hidden, not just the per-field ones

---

## Section C — New Issues Log

When new issues are found during family testing, add them here with date, finder, and description. Once a backlog item is created to fix it, link the backlog ID. Once fixed, move the permanent regression test into Section B above — never delete an entry from this log.

| Date | Found by | Description | Backlog ID | Status |
|------|----------|--------------|------------|--------|
| 2026-06-30 | Malachi | Got into Settings without PIN | S3-015 | Fixed S3-015 |
| 2026-06-30 | Malachi | Could delete other people's items | S4-004 | Pending S4-004 |
| 2026-06-30 | Malachi | Could change other people's assignments | — | Accepted by design (see B3) |
| 2026-07-02 | Giuseppe | Repeat events not generating future occurrences on app load | S4-B01 | Open |
| 2026-07-02 | Giuseppe | Overview widget internal scroll not working (page scrolls fine, card content clips) | S4-B02 | Open |
| 2026-07-02 | Giuseppe | House tasks not sorted by priority — sort runs before Firestore data loads | S4-B03 | Open |
| 2026-08-04 | Independent test-agent pass (S7-001) | No HTML escaping anywhere — stored injection via any name/notes field | S7-001 | Fixed S7-001 |
| 2026-08-04 | Independent test-agent pass (S7-001) | Device-user picker overlay pops over active modals on every remote Firestore write | S7-001 | Fixed S7-001 |
| 2026-08-04 | Independent test-agent pass (S7-001) | Meal-replace hard-deleted, bypassing soft-delete/undo | S7-001 | Fixed S7-001 |
| 2026-08-04 | Independent test-agent pass (S7-001) | Sync status stuck on "Saving…" on validation-failure early-returns | S7-001 | Fixed S7-001 |
| 2026-08-04 | Independent test-agent pass (S7-001) | No double-submission guard on Save — rapid taps create duplicate items | S7-001 | Fixed S7-001 |
| 2026-08-04 | Independent test-agent pass (S7-001) | Undo toast never appeared on other devices | S7-001 | Fixed S7-001 |
| 2026-08-04 | Independent test-agent pass (S7-001) | Household rows required detail modal to mark done (unlike Todos/Shopping) | S7-001 | Fixed S7-001 |
| 2026-08-04 | Giuseppe (mobile) | Weekly recurring event shows on every day, not once a week | S7-B06 | Fixed S7-B06 |
| 2026-08-04 | Giuseppe (mobile) | "Repeat until" quick-pick chips appear to do nothing when tapped | S7-B06 | Fixed S7-B06 (same root cause as above) |
| 2026-08-04 | Giuseppe | Voice input only available on the first field of each form | S7-B07 | Fixed S7-B07 |

---

## Notes on testing philosophy

This is a family app, not a bank. The goal is not to make the app impossible to misuse — that would make it frustrating for legitimate use too. The goal is:

1. **Reversibility** — nothing destructive should be permanent or silent
2. **Visibility** — parents should be able to see what happened and who did it
3. **Reasonable friction** — a PIN is enough friction to stop casual mischief; it doesn't need to stop a determined attacker with dev tools, because the threat model is "teenager being cheeky," not "malicious actor"

Resist the urge to over-engineer security for a family app. Each new restriction should be weighed against the friction it adds for legitimate everyday use.
