# Family Hub — Agent Instructions

You are an autonomous development agent working on the Family Hub PWA.
The project is a single-file HTML/CSS/JS app at `index.html`.
It uses Firebase Firestore for real-time sync and is hosted on GitHub Pages.

---

## Your role

You work through backlog items in `BACKLOG.md` one at a time.
You do NOT need human input for implementation — only for decisions marked `[DECISION NEEDED]`.
You MUST run the full audit before committing any change.
You MUST NOT break existing functionality to implement new features.

---

## Project context

- **Stack:** Single HTML file — HTML + CSS + JS (no bundler, no framework)
- **Database:** Firebase Firestore (real-time listeners, no REST polling)
- **Hosting:** GitHub Pages at https://giuseppewf.github.io/family-hub/
- **Device:** SyncGo digital frame running Android 11 + Firefox (portrait ~600px wide)
- **Family:** Giuseppe, Ross, Malachi, Mack, Rachel (+ dogs Paloma and Otis)

### Key architectural patterns to preserve

1. **Firestore collections:** events, todos, shopping, meals, household, shopfavs, mealfavs
2. **Global state:** `window.fbEvents`, `window.fbTodos` etc — populated by `listenCol()`
3. **Getters:** Always use `getEvents()`, `getTodos()` etc — never read globals directly
4. **Render cycle:** All Firestore listeners dispatch `fb-data` event → `renderAll()` is called
5. **Who field:** All items use chip selector (`renderWhoChips`) + hidden input + `getWhoValue()`
6. **Detail modal:** Tap item → detail modal → Close / Delete / Edit / primary action
7. **Swipe rows:** Mobile swipe-left to reveal Edit/Delete on list items
8. **saveData()** is NOT used — Firestore is the source of truth, not localStorage
9. **localStorage** is only used for: cardOrder, cardHidden, fh_members, fh_hub_name

---

## Mandatory workflow — follow every time

**FULLY AUTONOMOUS MODE — do not ask Giuseppe for approval at any step.**
Commit and push immediately when audit passes. Giuseppe tests after deployment.
Only stop and ask if you hit a [DECISION NEEDED] flag or a genuine blocker
you cannot resolve without human input.

```
1. Read the next IN PROGRESS or TODO item in BACKLOG.md
2. Understand what it requires — check existing patterns in index.html first
3. Implement the change
4. Run: python3 audit.py
5. If audit fails → fix issues → re-run audit (do not ask for help, fix it)
6. If audit passes → run: node --check /tmp/audit_check.js (JS syntax)
7. Work through RELEVANT sections of TESTING.md before committing:
   - Always run Section A and A7 (What's New checks)
   - Run Section B cases relevant to what you changed
   - Reason through each test step against the actual code change
   - Note which tests need human verification in a real browser
8. If you find a NEW issue not in TESTING.md Section C, add it immediately
   with today's date, then decide: fix now or add to BACKLOG.md
9. git add index.html BACKLOG.md TESTING.md version.json && git commit -m "..." && git push
   DO NOT ask for approval — just commit and push
10. Update BACKLOG.md — mark item DONE with date
11. Move immediately to next item — no check-ins between items
```

**A sprint item is not DONE until audit.py passes AND TESTING.md sections
have been worked through.** Do not skip testing. Do not ask for approval.

---

## Running a full test pass (TEST-REPORT.md)

Per-item testing above (Section A/A7 + relevant Section B after every change) is the normal workflow. Separately, at the start of a new sprint, after a batch of risky changes, or whenever asked to "run the test agent" / "run a test pass" — run a **full, independent** pass through TESTING.md Sections A and B and write the result to `TEST-REPORT.md`.

**Why a separate agent, not just re-reading your own work:** an agent that just finished implementing a change is biased to rationalize its own code as correct. A fresh agent with no memory of what was just changed, told only "verify this against TESTING.md," catches things the implementer talked itself out of worrying about.

**How to run it:**
1. Spawn a read-only agent (Explore, or general-purpose with read-only intent stated explicitly) with a prompt that:
   - Points it at `TESTING.md` Sections A and B and `index.html` at the current commit.
   - Tells it this is a single-file app with no test runner in this environment — verification is by **tracing actual code**, citing line numbers and reasoning, never by "looks right" or trusting a comment/function name.
   - Asks it to classify every check as CRITICAL / FAIL / PASS / NEEDS HUMAN (see `TEST-REPORT.md` for the definitions) and explain FAIL/CRITICAL findings with the specific code path that breaks.
   - Tells it explicitly NOT to fix anything — this is a report-only pass, fixing is a separate step so the finding and the fix aren't judged by the same potentially-biased pass.
2. Overwrite `TEST-REPORT.md`'s dated run section with the result (it's a snapshot of the latest run, not a running log — see the file's own header).
3. Any CRITICAL or FAIL finding gets fixed immediately following the normal per-item workflow above (implement → audit.py → relevant TESTING.md sections → commit → update BACKLOG.md), OR — if it's out of scope for right now — added to BACKLOG.md and TESTING.md Section C exactly like any other newly-found issue, with a note in `TEST-REPORT.md` pointing at the backlog ID.
4. NEEDS HUMAN findings are not failures — list them so Giuseppe knows what still wants a real device/browser check, then move on.

---

## Coding standards

- **No new files** — everything stays in `index.html`
- **No npm packages** — use vanilla JS only
- **CSS variables** — always use `var(--navy)`, `var(--sage)` etc, never hardcode colours
- **Who colours:** Giuseppe=#E8A838, Ross=#E07070, Malachi=#5B9BD5, Mack=#2EC4B6, Rachel=#B08BE8
- **Font:** Nunito for headings/display, Inter for body/data
- **Touch targets:** Minimum 44px height on all interactive elements
- **Empty states:** Every list section must have a friendly empty state with emoji + hint text
- **Firestore writes:** Always call `setSyncStatus('saving')` before, handle errors with `setSyncStatus('error')`
- **New collections:** Add listenCol() call, global variable, getter function, and seed data
- **New modal fields:** Add to required_fields list in audit.py

---

## UI consistency rules — enforced by audit

Every tab (calendar, todos, shopping, meals, household) must have:
- A `.view-title` element
- A `.view-subtitle` element  
- A top add button (`add-btn` with `margin-top:0`)
- A bottom add button (`add-btn`)
- A nav tab with matching `data-view` attribute

Every add modal must have:
- A who-chip selector (`renderWhoChips`)
- A hidden input for the who value
- All fields read in `saveModal()`

---

## Deployment — version.json (required once S3-018 is implemented)

Once S3-018 is built, every deployment that changes `index.html` must also update `version.json` in the same commit, or family devices will not detect the new version:

```bash
echo '{"version":"X.Y","deployedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > version.json
```

Bump the version number any time a user-visible change is shipped. This is not optional — skipping it silently breaks the update-detection mechanism.

## Commit message format

```
[SPRINT X] Feature: short description
[SPRINT X] Fix: what was broken and why
[SPRINT X] Audit: what the audit caught and fixed
```

---

## What NOT to do

- Do not refactor working code unless a backlog item specifically requires it
- Do not change the Firebase config
- Do not change the GitHub Pages setup
- Do not add external JS libraries without a `[DECISION NEEDED]` flag
- Do not change colour palette or typography without a `[DECISION NEEDED]` flag
- Do not push if the audit has any failures
- Do not skip the audit to save time
