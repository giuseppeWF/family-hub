#!/usr/bin/env python3
"""
Family Hub — Pre-commit Audit Script
Run this before every git commit. Zero issues = safe to deploy.
Usage: python3 audit.py
"""

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
    'new-event-name', 'new-event-date', 'new-event-start', 'new-event-end',
    'new-event-who', 'new-event-who-chips', 'new-event-recur',
    # Todo
    'new-todo-text', 'new-todo-who', 'new-todo-who-chips',
    'new-todo-type', 'new-todo-due', 'new-todo-recur',
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
                      'household', 'shopfavs', 'mealfavs']
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
edit_fn    = content[edit_start:edit_start + 5000] if edit_start > 0 else ''
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
ids = re.findall(r'id="([^"]+)"', content)
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
