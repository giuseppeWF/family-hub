#!/usr/bin/env python3
"""
Family Hub — Pre-commit Audit Script
Run this before every git commit. Zero issues = safe to deploy.
Usage: python3 audit.py
"""

import json
import subprocess
import re
import sys

content = open('index.html').read()
issues  = []
passed  = []

def check(label, condition, issue_msg):
    if condition:
        passed.append(label)
    else:
        issues.append(issue_msg)
    return condition

# ── 1. JS SYNTAX ──────────────────────────────────────────────────────────────
ss = content.find('<script>\n// ── GLOBALS')
se = content.find('</script>\n</body>')
if ss == -1 or se == -1:
    issues.append("Could not find script block boundaries")
else:
    with open('/tmp/audit_check.js', 'w') as f:
        f.write(content[ss+8:se])
    r = subprocess.run(['node', '--check', '/tmp/audit_check.js'],
                       capture_output=True, text=True)
    check('JS syntax', r.returncode == 0,
          f"JS SYNTAX ERROR: {r.stderr.strip()[:200]}")

# ── 2. REQUIRED MODAL FIELDS ──────────────────────────────────────────────────
required_fields = [
    # Event
    'new-event-name', 'new-event-date', 'new-event-end-date', 'new-event-start', 'new-event-end',
    'new-event-who', 'new-event-who-chips', 'new-event-recur', 'new-event-notes',
    # Todo
    'new-todo-text', 'new-todo-who', 'new-todo-who-chips',
    'new-todo-type', 'new-todo-due', 'new-todo-recur', 'new-todo-save-fav',
    # Shopping
    'new-shop-name', 'new-shop-qty', 'new-shop-cat',
    'new-shop-who', 'new-shop-who-chips', 'new-shop-save-fav',
    # Meal
    'new-meal-name', 'new-meal-day', 'new-meal-notes',
    'new-meal-who', 'new-meal-who-chips', 'new-meal-save-fav',
    # Household
    'new-house-text', 'new-house-room', 'new-house-who',
    'new-house-who-chips', 'new-house-priority', 'new-house-notes',
]
for field in required_fields:
    check(f'field #{field}', f'id="{field}"' in content,
          f"Missing modal field: #{field}")

# ── 3. FIRESTORE LISTENERS ────────────────────────────────────────────────────
required_listeners = ['events', 'todos', 'shopping', 'meals',
                      'household', 'shopfavs', 'mealfavs', 'todofavs', 'activityLog']
for col in required_listeners:
    check(f'listener:{col}', f"listenCol('{col}'" in content,
          f"Missing Firestore listener for collection: '{col}'")

# ── 4. FBSAVE COLLECTIONS HAVE LISTENERS ─────────────────────────────────────
save_cols = set(re.findall(r"fbSave\('([^']+)'", content))
for col in save_cols:
    check(f'save→listener:{col}', f"listenCol('{col}'" in content,
          f"fbSave writes to '{col}' but no listener exists for it")

# ── 5. TAB STRUCTURE ──────────────────────────────────────────────────────────
tabs = ['calendar', 'todos', 'shopping', 'meals', 'household']
for tab in tabs:
    view_start = content.find(f'id="view-{tab}"')
    next_view  = content.find('id="view-', view_start + 10)
    view_html  = content[view_start:next_view if next_view > 0 else view_start + 8000]

    check(f'{tab}:view-element',  view_start > 0,
          f"Tab '{tab}': missing view element #view-{tab}")
    check(f'{tab}:nav-tab',       f'data-view="{tab}"' in content,
          f"Tab '{tab}': missing nav tab with data-view=\"{tab}\"")
    check(f'{tab}:view-title',    'view-title' in view_html,
          f"Tab '{tab}': missing .view-title")
    check(f'{tab}:view-subtitle', 'view-subtitle' in view_html,
          f"Tab '{tab}': missing .view-subtitle")
    check(f'{tab}:top-add-btn',   'margin-top:0' in view_html,
          f"Tab '{tab}': missing top add button (margin-top:0)")
    check(f'{tab}:bottom-add-btn', view_html.count('add-btn') >= 2,
          f"Tab '{tab}': missing bottom add button (need 2+ add-btn)")

# ── 6. DETAIL MODAL BUTTONS ───────────────────────────────────────────────────
for btn in ['detail-edit-btn', 'detail-delete-btn', 'detail-action-btn']:
    check(f'detail-btn:{btn}', f'id="{btn}"' in content,
          f"Missing detail modal button: #{btn}")

# ── 7. DETAIL MODAL COVERAGE ─────────────────────────────────────────────────
show_start = content.find('function showDetail')
show_end   = content.find('\nfunction closeDetailModal', show_start)
show_fn    = content[show_start:show_end] if show_start > 0 else ''
for t in ['event', 'todo', 'shop', 'meal', 'household']:
    check(f'showDetail:{t}', f"if (type === '{t}')" in show_fn,
          f"showDetail() missing case for type '{t}'")

# ── 8. EDIT MODAL COVERAGE ────────────────────────────────────────────────────
edit_start = content.find('function openEditItem')
edit_fn    = content[edit_start:edit_start + 8000] if edit_start > 0 else ''
for t in ['todo', 'shop', 'meal', 'event', 'household']:
    check(f'openEditItem:{t}', f"if (type === '{t}')" in edit_fn,
          f"openEditItem() missing case for type '{t}'")

# ── 9. WHO CHIP WIRING ────────────────────────────────────────────────────────
chip_checks = {
    'renderWhoChips function':     'function renderWhoChips' in content,
    'toggleWhoChip function':      'function toggleWhoChip' in content,
    'getWhoValue function':        'function getWhoValue' in content,
    'detailDelete function':       'function detailDelete' in content,
    'event chips in openModal':    "renderWhoChips('new-event-who-chips'" in content,
    'todo chips in openModal':     "renderWhoChips('new-todo-who-chips'"  in content,
    'shop chips in openModal':     "renderWhoChips('new-shop-who-chips'"  in content,
    'meal chips in openModal':     "renderWhoChips('new-meal-who-chips'"  in content,
    'house chips in openModal':    "renderWhoChips('new-house-who-chips'" in content,
    'event getWhoValue in save':   "getWhoValue('new-event-who')"         in content,
    'todo getWhoValue in save':    "getWhoValue('new-todo-who')"          in content,
    'shop getWhoValue in save':    "getWhoValue('new-shop-who')"          in content,
    'meal getWhoValue in save':    "getWhoValue('new-meal-who')"          in content,
    'house getWhoValue in save':   "getWhoValue('new-house-who')"         in content,
}
for label, condition in chip_checks.items():
    check(f'chips:{label}', condition, f"Who chips: {label} — missing")

# ── 10. TOGGLE FUNCTIONS ──────────────────────────────────────────────────────
for fn in ['toggleTodo', 'toggleShop', 'toggleHousehold']:
    check(f'fn:{fn}', f'async function {fn}' in content,
          f"Missing toggle function: {fn}")

# ── 11. CORE FUNCTIONS ────────────────────────────────────────────────────────
core_fns = [
    'function renderAll', 'function renderDashboard', 'function renderCalendar',
    'function renderTodos', 'function renderShopping', 'function renderMeals',
    'function renderHousehold', 'function saveModal', 'function openModal',
    'function closeModal', 'function openEditItem', 'function saveEditItem',
    'function showDetail', 'function deleteItem', 'function setSyncStatus',
    'function runQA', 'function switchView', 'function applyCardState',
    'async function logActivity', 'function renderActivityLog',
]
for fn in core_fns:
    check(f'fn:{fn}', fn in content, f"Missing core function: {fn}")

# ── 12. FIREBASE CONFIG ───────────────────────────────────────────────────────
check('firebase:config',
      'family-central-app.firebaseapp.com' in content,
      "Firebase config missing or changed")
check('firebase:firestore-import',
      'firebase-firestore' in content,
      "Firestore SDK import missing")

# ── 13. NO DUPLICATE IDS ─────────────────────────────────────────────────────
ids = re.findall(r'(?<![a-z-])id="([^"]+)"', content)
seen, dupes = set(), set()
for id_ in ids:
    if id_ in seen:
        dupes.add(id_)
    seen.add(id_)
check('no-duplicate-ids', not dupes,
      f"Duplicate HTML IDs found: {', '.join(sorted(dupes))}")

# ── 14. MOBILE META TAGS ──────────────────────────────────────────────────────
check('meta:viewport',
      'name="viewport"' in content,
      "Missing viewport meta tag")
check('meta:pwa-capable',
      'mobile-web-app-capable' in content,
      "Missing PWA meta tag")

# ── 15. WHAT'S NEW SYSTEM (TESTING.md Section A7) ─────────────────────────────
# The What's New popup has regressed twice (S5-B08, S5-B08-FIX2) — these
# checks exist so a future change can't silently reintroduce either bug.
app_version_match = re.search(r"const APP_VERSION\s*=\s*'([^']+)'", content)
app_version = app_version_match.group(1) if app_version_match else None
check("whatsnew:app-version-exists", app_version is not None,
      "APP_VERSION constant not found in index.html")

version_json = None
try:
    with open('version.json') as f:
        version_json = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    issues.append(f"version.json missing or invalid: {e}")

if version_json is not None:
    check("whatsnew:version-json-has-version", 'version' in version_json,
          "version.json has no \"version\" key")
    if app_version is not None:
        check("whatsnew:versions-match",
              version_json.get('version') == app_version,
              f"APP_VERSION ('{app_version}') != version.json ('{version_json.get('version')}') "
              "— mismatch makes the update banner loop forever")

# checkWhatsNew() must fetch version.json itself rather than relying solely
# on the APP_VERSION baked into whatever HTML happens to be cached — that
# was the root cause of the popup reappearing across reloads (S5-B08-FIX2).
cwn_start = content.find('function checkWhatsNew')
cwn_end   = content.find('\nfunction closeWhatsNew', cwn_start)
cwn_fn    = content[cwn_start:cwn_end] if cwn_start > 0 else ''
check("whatsnew:fetches-version-json",
      "fetch('version.json" in cwn_fn,
      "checkWhatsNew() must fetch version.json — comparing only against the "
      "baked-in APP_VERSION reintroduces the reappearing-popup bug")

# [S5-B08-REDUX] checkWhatsNew() must bail out entirely when the fetch
# fails, rather than falling through to compare/persist against the
# baked-in APP_VERSION fallback. That fallback can be older than the
# version already correctly recorded in fh_seen_version (true after any
# deploy since this page loaded), so a single failed fetch — routine on a
# flaky mobile/WiFi connection — re-shows the popup and overwrites the
# correct "seen" value with a stale one, flipping back next time the
# fetch succeeds: an oscillating loop, not a one-off.
check("whatsnew:bails-out-on-failed-fetch",
      "if (!fetchedOk) return" in cwn_fn,
      "checkWhatsNew() must return early when the version.json fetch fails "
      "— falling through to compare against the baked-in APP_VERSION "
      "reintroduces the reappearing-popup loop (S5-B08-REDUX)")

# closeWhatsNew() must persist the SAME value checkWhatsNew() compared
# against (a fetched variable), not re-read the baked-in constant, or the
# two can disagree after a stale-cache reload.
ccwn_start = content.find('function closeWhatsNew')
ccwn_fn    = content[ccwn_start:ccwn_start + 300] if ccwn_start > 0 else ''
check("whatsnew:persists-seen-version",
      "localStorage.setItem('fh_seen_version'" in ccwn_fn,
      "closeWhatsNew() must set localStorage 'fh_seen_version' on dismiss")
check("whatsnew:persists-fetched-value-not-constant",
      "localStorage.setItem('fh_seen_version', APP_VERSION)" not in ccwn_fn,
      "closeWhatsNew() persists the baked-in APP_VERSION instead of the "
      "fetched version.json value checkWhatsNew() actually compared against"
)

# WHATS_NEW.features must exist, be non-trivial, and not still contain the
# original placeholder content from before S5-B08 (a regression signal if
# a future stale-file overwrite reintroduces it).
wn_start = content.find('const WHATS_NEW')
wn_end   = content.find('\n};', wn_start) if wn_start > 0 else -1
wn_block = content[wn_start:wn_end] if wn_start > 0 else ''
feature_count = len(re.findall(r"\{\s*icon:", wn_block))
check("whatsnew:features-non-trivial", feature_count >= 5,
      f"WHATS_NEW.features has only {feature_count} entries — looks incomplete")
stale_markers = ['Dog walk rota', 'Weather widget', 'Auto update prompts', 'TODO', 'TBD', 'placeholder']
found_stale = [m for m in stale_markers if m in wn_block]
check("whatsnew:no-stale-placeholder-content", not found_stale,
      f"WHATS_NEW.features still contains stale/placeholder text: {found_stale}")

# ── REPORT ────────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"  Family Hub — Audit Report")
print(f"{'='*60}")
print(f"  Checks passed: {len(passed)}")
print(f"  Issues found:  {len(issues)}")
print(f"{'='*60}\n")

if issues:
    print("❌ ISSUES TO FIX BEFORE DEPLOYING:\n")
    for i, issue in enumerate(issues, 1):
        print(f"  {i:2}. {issue}")
    print(f"\n{'='*60}")
    print("  ⛔  NOT safe to deploy — fix issues above first")
    print(f"{'='*60}\n")
    sys.exit(1)
else:
    print("  ✅  ALL CHECKS PASSED — safe to deploy")
    print(f"{'='*60}\n")
    sys.exit(0)
