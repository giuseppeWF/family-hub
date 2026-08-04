# Family Hub — Test Report

This file holds the **most recent** run of the full TESTING.md pass. It is overwritten each time the testing prompt (see AGENTS.md → "Running a test pass") is run — it is a snapshot, not a log. Section C of TESTING.md is the permanent historical record of issues found; this file is just "what did the last full pass find."

Each finding gets a verdict:
- **CRITICAL** — breaks a core promise (data loss, permanently stuck UI, audit-invisible correctness bug). Fix before anything else.
- **FAIL** — real bug, not critical (cosmetic, edge case, minor inconsistency). Fix this sprint if time allows, otherwise add to BACKLOG.md.
- **PASS** — verified correct by reasoning through the code against the check.
- **NEEDS HUMAN** — cannot be verified by reading code alone (visual rendering, real device timing, actual touch behaviour). Flag it, don't guess.

A reasoning trail (which code, which lines, why) is required for every FAIL/CRITICAL — "looks wrong" is not a finding, "line X does Y, which contradicts Z" is.

---

## Run: 2026-08-04 (Sprint 7 — S7-001)

**Scope:** Full TESTING.md Section A + Section B pass against `index.html` @ commit `f9cbfa7`, run via a fresh read-only agent with no memory of the Sprint 7 changes that had just been made, specifically to catch anything the implementing agent (with fresh-in-mind assumptions about its own changes) might rationalize away.

**Method:** Static code reasoning (single-file app, no test runner/DOM harness in this environment) — every check traced to specific line numbers and reasoned through against actual code behaviour, not assumed from naming or comments.

**Result: 2 CRITICAL, 5 FAIL, ~30 PASS, 6 NEEDS HUMAN. All 7 CRITICAL/FAIL findings fixed same session (see BACKLOG.md S7-001 for the fix writeup on each).**

| # | Verdict | Finding | Fixed by |
|---|---------|---------|----------|
| 1 | CRITICAL | No HTML escaping anywhere in the file — any todo/shop/meal/household/event/member name or notes field containing `<img onerror=...>` or a quote-breakout string executes as live HTML/JS the moment it renders, on any device. | Added `escapeHtml()`, applied at every free-text render site (~55 sites across dashboard/list/detail/edit views + onboarding + settings member list) |
| 2 | CRITICAL | `checkDeviceUserPrompt()` re-shows the device-user picker overlay (z-index 490) on every `fb-data` event (i.e. every remote Firestore write from any device) whenever no confident match/manual pick exists — hijacking an in-progress Add/Edit modal on this device the moment someone elsewhere adds anything. | Added `isBlockingOverlayOpen()` guard, shared with the screensaver's existing blocker-list check |
| 3 | FAIL | Replacing a conflicting meal slot did a hard `fbDelete()`, bypassing the app's soft-delete/undo/activity-log convention — silent, permanent, no Undo. | Routed through `deleteItem()` in both `saveModal()` and `saveEditItem()`; also now correctly refuses to silently delete a *locked* conflicting meal |
| 4 | FAIL | `setSyncStatus('saving')` never reset to `'live'` on validation-failure early-returns in `saveModal()`/`saveEditItem()` — sync dot stuck on "Saving…" until something unrelated happened to trigger it | Added `setSyncStatus('live')` on every early-return path |
| 5 | FAIL | No double-submission guard on Save — rapid repeat taps create genuine duplicate Firestore documents (TESTING.md B4's own stated recommendation, never implemented) | Save buttons (add + edit modals) disable synchronously on tap, re-enable in a `finally` block on every exit path |
| 6 | FAIL | Undo toast (`showUndoToast`) was local-DOM-only — never appeared on other connected devices, failing TESTING.md B2's explicit requirement | New `startCrossDeviceUndoListener()` (docChanges on `activityLog`, skips the initial historical snapshot and this tab's own session) + `showRemoteUndoToast()`, reusing the existing toast/restore pipeline |
| 7 | FAIL | Household list rows had no separate handler on the check circle — the whole row shared one `onclick="showDetail(...)"`, so marking a house task done required opening the detail modal, unlike Todos/Shopping/Dashboard (TESTING.md A2a) | Split the check circle into its own 44px `onclick="toggleHousehold(...);event.stopPropagation()"` target, matching the Todos row structure exactly |

Full per-check verdicts (Section A1–A7, B1–B7) and the deep-dive trace notes on `getRecurSeries()`, `deleteItem()`, `saveEditItem()`, `matchDeviceUserToGoogleAccount()`, `checkWhatsNew()`, and a full `toISOString()`/`new Date()` grep sweep (all clean — no remaining instance of the S7-B01 bug class) are preserved in this session's conversation log; only the actionable findings are kept here per this file's own "snapshot, not an archive" rule.

**NEEDS HUMAN (not failures — flagged for a real device/browser check):** A4 mobile layout in full; A2a's 50+ item / 500+ char long-text visual rendering; A5's actual cross-device sync latency; B4's real-world responsiveness at 50+ items; B6's live Firestore Security Rules enforcement (requires a deployed-rules test, not static reading); B7's actual concurrent-edit timing behaviour.

---

## How to read an old run

Once a new run overwrites this file, the historical record of what was found and fixed lives in:
- **BACKLOG.md** — each bug that was fixed has its own dated entry with root cause and fix.
- **TESTING.md Section C** — permanent log of every issue ever found, with the backlog ID that fixed it.

This file intentionally does NOT try to be both a snapshot and a history — trying to do both made past versions of this kind of file (see BACKLOG.md's own note about a stale-copy overwrite incident) unreliable as a source of truth for "what's true right now."
