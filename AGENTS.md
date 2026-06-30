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

```
1. Read the next IN PROGRESS or TODO item in BACKLOG.md
2. Understand what it requires — check existing patterns in index.html first
3. Implement the change
4. Run: python3 audit.py
5. If audit fails → fix issues → re-run audit
6. If audit passes → run: node --check /tmp/audit_check.js (JS syntax)
7. If both pass → work through the RELEVANT sections of TESTING.md before committing:
   - Always run Section A (Core Regression) in full
   - Run any Section B cases relevant to what you just changed
     (e.g. changed Settings → run B1, changed delete logic → run B2)
   - If you cannot interact with a live browser, reason through each test
     step against the actual code change and confirm it would pass —
     note in your summary which tests were verified by code reasoning
     vs which need human verification in a real browser
8. If you find a NEW issue during testing that isn't already in TESTING.md
   Section C, add it there immediately with today's date, "Claude Code agent"
   as finder, and a description — then decide whether to fix it now or
   flag it as a new BACKLOG.md item for a future sprint
9. git add index.html BACKLOG.md TESTING.md && git commit -m "..." && git push
10. Update BACKLOG.md — mark item as DONE with date
11. Move to next item
```

**A sprint item is not DONE until both audit.py passes AND the relevant TESTING.md sections have been worked through.** Do not skip testing to save time — this is exactly how the regressions Giuseppe's family found in earlier sprints happened.

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
