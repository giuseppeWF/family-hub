/**
 * Family Hub — Forward to Hub inbox processor (S5-002 + S7-B06 + S7-B07 + S7-B09 + S7-B10)
 *
 * Lives in a Google Apps Script project (script.google.com), NOT deployed via
 * this repo's GitHub Pages build — this file is a version-controlled copy of
 * that script's source. After editing, copy the contents back into the Apps
 * Script editor and save.
 *
 * WHAT IT DOES
 * Runs on a time-driven trigger (see createTrigger()) every 5 minutes.
 * Scans unread mail under a Gmail label ("Family Hub" by default) forwarded
 * or sent by family members, classifies each into an event / todo / shopping
 * item / meal, writes it to the same Firestore collections the web app reads
 * (events/todos/shopping/meals — via listenCol('<collection>') filtered on
 * familyId, exactly like every other write in index.html), replies with a
 * confirmation, then marks the message read and archives the thread.
 *
 * ONE-TIME SETUP (Giuseppe — cannot be done from this repo):
 *   1. script.google.com → New project → paste this file's contents in as Code.gs
 *   2. Project Settings → Script Properties, set:
 *        FIREBASE_PROJECT_ID   = family-central-app  (from index.html's firebaseConfig)
 *        FAMILY_ID             = <the family's Firestore family doc id>
 *        SERVICE_ACCOUNT_KEY   = <full JSON key for a service account with
 *                                 Cloud Datastore User role, from Google Cloud
 *                                 Console → IAM → Service Accounts → Keys>
 *        GMAIL_LABEL           = Family Hub   (optional — this is the default)
 *   3. Gmail → create a label called "Family Hub" (or whatever GMAIL_LABEL is)
 *      and a filter that applies it to forwarded/family mail
 *   4. Run createTrigger() once from the Apps Script editor (Run menu) to
 *      install the 5-minute time-driven trigger
 *   5. Authorise the script's Gmail + external-request permissions when prompted
 *
 * [S7-B07] Sender identification needs NO manual email list. Layer 1 reads
 * emailMap from the family's Firestore doc (auto-populated by index.html the
 * moment a family member signs in with Google — see recordEmailMapEntry() in
 * index.html). Layer 2 — for an address that's never signed in to the web app
 * (e.g. a work/Outlook address) — replies asking who they are, and remembers
 * the answer in the same emailMap permanently. MEMBER_EMAILS does not exist
 * in this script and does not need to.
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var GMAIL_LABEL_DEFAULT = 'Family Hub';
var GENERATION_CAP_DAYS = 90; // unused here, kept for parity with index.html's own cap language

// [S7-B06] Expanded event keyword list — a subject containing any of these
// is treated as an event even without an explicit "event:"/"appointment:"
// prefix, a detected weekday, or a time. Real-world forwarded mail (school
// newsletters, clinic reminders, venue confirmations) rarely says "event:".
var EVENT_KEYWORDS = [
  'appointment', 'meeting', 'dentist', 'doctor', 'school', 'pickup', 'drop off',
  'party', 'birthday', 'holiday', 'trip', 'flight', 'concert', 'match', 'game',
  'class', 'session', 'call', 'interview', 'gym', 'training', 'mma', 'swimming',
  'lesson', 'club', 'practice', 'rehearsal', 'show', 'event', 'visit', 'hospital',
  'cinema', 'theatre', 'restaurant', 'dinner', 'lunch', 'breakfast'
];

var TODO_KEYWORDS = ['todo', 'to-do', 'task', 'chore', 'hoover', 'clean', 'fix', 'buy', 'book', 'call', 'email', 'pay', 'renew', 'sort'];
var SHOPPING_KEYWORDS = ['pick up', 'buy', 'shopping', 'shop', 'milk', 'bread', 'eggs', 'groceries'];
var DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
var MEMBER_COLORS = { Giuseppe: '#E8A838', Ross: '#E07070', Malachi: '#5B9BD5', Mack: '#2EC4B6', Rachel: '#B08BE8', Everyone: '#9B8BCC' };

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
function processInbox() {
  var props = PropertiesService.getScriptProperties();
  var projectId = props.getProperty('FIREBASE_PROJECT_ID');
  var familyId = props.getProperty('FAMILY_ID');
  var keyJson = JSON.parse(props.getProperty('SERVICE_ACCOUNT_KEY'));
  var labelName = props.getProperty('GMAIL_LABEL') || GMAIL_LABEL_DEFAULT;

  var token = getAccessToken(keyJson);
  var base = firestoreBase(projectId);

  var roster = getFamilyRoster(base, token, familyId);       // ['Giuseppe','Ross',...]
  var emailMap = getEmailMap(base, token, familyId);          // { 'giuseppe@gmail.com': 'Giuseppe', ... }

  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) { Logger.log('Label "' + labelName + '" not found — nothing to do.'); return; }

  var threads = label.getThreads();
  for (var t = 0; t < threads.length; t++) {
    var thread = threads[t];
    var messages = thread.getMessages();
    var processedAny = false;
    for (var m = 0; m < messages.length; m++) {
      var message = messages[m];
      if (message.isUnread()) {
        processMessage(message, { base: base, token: token, familyId: familyId, roster: roster, emailMap: emailMap });
        message.markRead();
        processedAny = true;
      }
    }
    if (processedAny) thread.moveToArchive();
  }
}

// One-off helper — run manually once from the Apps Script editor to install
// the 5-minute trigger (matches S5-002's "runs every 5 minutes" spec).
function createTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'processInbox') ScriptApp.deleteTrigger(existing[i]);
  }
  ScriptApp.newTrigger('processInbox').timeBased().everyMinutes(5).create();
}

// ── PER-MESSAGE PROCESSING ─────────────────────────────────────────────────────
function processMessage(message, ctx) {
  var fromField = message.getFrom();
  var fromEmail = extractEmailAddress(fromField);
  var rawSubject = message.getSubject() || '';
  var subject = stripForwardPrefix(rawSubject); // [S7-B09 fix 1]
  var body = message.getPlainBody() || '';

  var memberName = senderToMember(fromField, ctx.emailMap, ctx.roster); // [S7-B07 Layer 1] + [S7-B09 fix 3]

  if (!memberName) {
    // [S7-B07 Layer 2] Either this is a brand-new unknown sender, or it's
    // their reply answering a previous "who are you?" prompt — tryProcessNameReply
    // checks for a pending hold under this exact address first.
    var learned = tryProcessNameReply(message, fromEmail, ctx);
    if (learned) return; // learning + pending-item processing already handled everything
    handleUnknownSender(message, fromEmail, rawSubject, body);
    return;
  }

  createItemFromMessage(ctx, memberName, subject, body, message);
}

// Shared by the live path (sender already known) and the reply-learning path
// (sender just identified themselves — process what they originally sent).
function createItemFromMessage(ctx, memberName, subject, body, message) {
  var item = classifyAndBuild(subject, body, memberName);
  var confirmation = writeItem(ctx.base, ctx.token, ctx.familyId, item);
  if (message) message.reply(confirmation + '\n\n— The Family Hub 🏠');
}

// ── SUBJECT CLEANUP [S7-B09 fix 1] ───────────────────────────────────────────
function stripForwardPrefix(subject) {
  var s = subject;
  // Outlook/Gmail can stack these ("Fwd: Re: FW: ...") — strip repeatedly.
  var prefixRe = /^(fw|fwd|re)\s*:\s*/i;
  while (prefixRe.test(s)) s = s.replace(prefixRe, '');
  return s.trim();
}

// ── SENDER IDENTIFICATION [S7-B07 Layer 1] + [S7-B09 fix 3] ──────────────────
function extractEmailAddress(fromField) {
  var m = fromField.match(/<([^>]+)>/);
  return (m ? m[1] : fromField).toLowerCase().trim();
}

function senderToMember(fromField, emailMap, roster) {
  var email = extractEmailAddress(fromField);

  // Layer 1: address already known (signed into the web app, or previously
  // learned via a reply — both land in the same emailMap).
  if (emailMap[email]) return emailMap[email];

  // Fallback: the email's own display name matches a roster member's first
  // name (works even for a never-before-seen address, no learning needed).
  var displayMatch = fromField.match(/^"?([^"<]+)"?\s*</);
  if (displayMatch) {
    var firstName = displayMatch[1].trim().split(/\s+/)[0];
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].toLowerCase() === firstName.toLowerCase()) return roster[i];
    }
  }
  return null; // unknown — caller triggers reply-based learning
}

// ── CLASSIFICATION [S7-B06] ───────────────────────────────────────────────────
// Returns { type: 'event'|'todo'|'shopping'|'meal', name, date, start, end, notes }
function classifyAndBuild(subject, body, memberName) {
  var lower = subject.toLowerCase();

  // Explicit prefixes always win, regardless of anything else in the subject.
  if (/^(event|appointment)\s*:/i.test(subject)) {
    return buildEvent(subject.replace(/^(event|appointment)\s*:\s*/i, ''), subject, body, memberName);
  }
  if (/^(task|todo)\s*:/i.test(subject)) {
    return { type: 'todo', text: subject.replace(/^(task|todo)\s*:\s*/i, '').trim() };
  }
  if (/^(shopping|shop)\s*:/i.test(subject)) {
    return { type: 'shopping', name: subject.replace(/^(shopping|shop)\s*:\s*/i, '').trim() };
  }
  if (/^meal\s*:/i.test(subject)) {
    return { type: 'meal', name: subject.replace(/^meal\s*:\s*/i, '').trim(), day: extractDayName(subject) };
  }

  // No prefix — smart detection. [S7-B06 fix] More generous than requiring
  // a day AND (time OR keyword): a day alone, or an explicit keyword alone
  // (dentist/appointment/meeting etc.), is enough real-world signal.
  var hasDay = !!extractDayName(subject) || /\btoday\b|\btomorrow\b/i.test(subject);
  var hasTime = !!extractTimeFromText(subject);
  var hasEventKeyword = EVENT_KEYWORDS.some(function (k) { return lower.indexOf(k) !== -1; });
  var isReminderStyle = /reminder|appointment|booking|confirmation/i.test(subject);

  if (hasEventKeyword || hasDay || isReminderStyle) {
    return buildEvent(subject, subject, body, memberName);
  }
  if (TODO_KEYWORDS.some(function (k) { return lower.indexOf(k) !== -1; }) && !SHOPPING_KEYWORDS.some(function (k) { return lower.indexOf(k) !== -1; })) {
    return { type: 'todo', text: subject.trim() };
  }
  if (SHOPPING_KEYWORDS.some(function (k) { return lower.indexOf(k) !== -1; })) {
    return { type: 'shopping', name: subject.trim() };
  }
  // Default: nothing recognisable — safest fallback is a plain todo, never
  // silently dropped.
  return { type: 'todo', text: subject.trim() };
}

function buildEvent(nameGuess, subject, body, memberName) {
  // [S7-B10] Body's explicit "Date:" wins over the subject's relative/day-name
  // date, NOT the other way round. "today"/"tomorrow" in a subject line is
  // relative to when the ORIGINAL message was written — by the time a family
  // member gets round to forwarding it (minutes, hours, sometimes the next
  // day) and this script picks it up, "tomorrow" no longer means what it did
  // when the sender typed it. A structured "Date: August 6, 2026" in the body
  // is an absolute, unambiguous value regardless of forwarding delay — caught
  // by testing the exact reported scenario (subject said "tomorrow", body
  // said "Date: August 6, 2026", and "tomorrow" relative to processing time
  // resolved to the WRONG day). Time is the opposite: a subject range like
  // "13:30 - 14:30" is more complete than the body's single point-in-time
  // and isn't subject to the same staleness, so subject wins there.
  var bodyParsed = parseBodyForAppointment(body);

  var name = nameGuess.trim() || 'Untitled event';
  var date = bodyParsed.date || extractRelativeOrNamedDate(subject) || null;
  var time = extractTimeFromText(subject) || null;
  var start = time ? time.start : (bodyParsed.start || '09:00');
  var end = time ? time.end : (bodyParsed.end || addOneHour(start));
  var who = bodyParsed.who || memberName;
  var notes = bodyParsed.notes || null;

  return { type: 'event', name: name, date: date, start: start, end: end, who: who, notes: notes };
}

// ── DATE/TIME EXTRACTION [S7-B06] ────────────────────────────────────────────
function extractDayName(text) {
  var lower = text.toLowerCase();
  for (var i = 0; i < DAY_NAMES.length; i++) {
    if (new RegExp('\\b' + DAY_NAMES[i] + '\\b').test(lower)) return DAY_NAMES[i];
  }
  return null;
}

// today/tomorrow [S7-B06 fix 2], else the nearest upcoming occurrence of a
// named weekday. Never guesses when nothing is present — returns null so the
// caller can fall back to body parsing.
function extractRelativeOrNamedDate(text) {
  var lower = text.toLowerCase();
  var today = new Date();
  if (/\btoday\b/.test(lower)) return formatDateYMD(today);
  if (/\btomorrow\b/.test(lower)) {
    var tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    return formatDateYMD(tom);
  }
  var dayName = extractDayName(text);
  if (!dayName) return null;
  var targetDow = DAY_NAMES.indexOf(dayName);
  var todayDow = today.getDay();
  var delta = (targetDow - todayDow + 7) % 7;
  var result = new Date(today);
  result.setDate(today.getDate() + delta);
  return formatDateYMD(result);
}

// Handles "13:30", "1:30 PM", "13:30 - 14:30" [S7-B06 fix 3]. Returns
// { start: 'HH:MM', end: 'HH:MM' } or null.
function extractTimeFromText(text) {
  var rangeMatch = text.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (rangeMatch) {
    return {
      start: pad2(rangeMatch[1]) + ':' + rangeMatch[2],
      end: pad2(rangeMatch[3]) + ':' + rangeMatch[4]
    };
  }
  var m24 = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m24) {
    var start24 = pad2(m24[1]) + ':' + m24[2];
    return { start: start24, end: addOneHour(start24) };
  }
  var m12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (m12) {
    var h = parseInt(m12[1], 10) % 12;
    var mins = m12[2] || '00';
    if (/pm/i.test(m12[3])) h += 12;
    var start12 = pad2(String(h)) + ':' + mins;
    return { start: start12, end: addOneHour(start12) };
  }
  return null;
}

function addOneHour(hhmm) {
  var parts = hhmm.split(':');
  var h = (parseInt(parts[0], 10) + 1) % 24;
  return pad2(String(h)) + ':' + parts[1];
}

function pad2(s) { s = String(s); return s.length < 2 ? '0' + s : s; }
function formatDateYMD(d) {
  return d.getFullYear() + '-' + pad2(String(d.getMonth() + 1)) + '-' + pad2(String(d.getDate()));
}

// ── BODY PARSER [S7-B10] ──────────────────────────────────────────────────────
// Handles structured appointment-reminder emails:
//   Hello Giuseppe Lucarelli,
//   Clinician: Chandra Basavaraj
//   Date: August 6, 2026
//   Time: 01:30:00 PM
function parseBodyForAppointment(body) {
  var result = { date: null, start: null, end: null, who: null, notes: null };
  if (!body) return result;

  var dateMatch = body.match(/Date:\s*([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i) ||
                  body.match(/Date:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
  if (dateMatch) {
    var parsed = new Date(dateMatch[1]);
    if (!isNaN(parsed.getTime())) result.date = formatDateYMD(parsed);
  }

  var timeMatch = body.match(/Time:\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (timeMatch) {
    var h = parseInt(timeMatch[1], 10);
    var mins = timeMatch[2];
    var ampm = timeMatch[3];
    if (ampm && /pm/i.test(ampm) && h < 12) h += 12;
    if (ampm && /am/i.test(ampm) && h === 12) h = 0;
    result.start = pad2(String(h)) + ':' + mins;
    result.end = addOneHour(result.start);
  }

  var whoMatch = body.match(/(?:Hello|Dear|Hi)\s+([A-Z][a-z]+)/);
  if (whoMatch) result.who = whoMatch[1]; // matched against the real roster by the caller via memberName fallback — kept as the raw first name here

  var clinicianMatch = body.match(/Clinician:\s*([^\r\n]+)/i);
  if (clinicianMatch) result.notes = 'With: ' + clinicianMatch[1].trim();

  return result;
}

// ── ITEM CREATION (Firestore writes) ─────────────────────────────────────────
function writeItem(base, token, familyId, item) {
  var id = 'gs_' + Date.now();
  if (item.type === 'event') {
    var who = item.who || 'Everyone';
    var firstWho = who.split(',')[0].trim();
    firestoreSetDoc(base, token, 'events/' + id, {
      id: id, name: item.name, date: item.date || null, endDate: null, recurUntil: null,
      start: item.start || '09:00', end: item.end || '10:00',
      who: who, color: MEMBER_COLORS[firstWho] || '#2EC4B6', recur: null, seriesId: null,
      notes: item.notes || null, familyId: familyId, createdAt: new Date().toISOString()
    });
    var dateLabel = item.date || 'an unspecified date';
    return '✅ Added as a calendar event for ' + dateLabel + ' at ' + (item.start || '09:00') + (who !== 'Everyone' ? ', assigned to ' + who : '') + '.';
  }
  if (item.type === 'todo') {
    firestoreSetDoc(base, token, 'todos/' + id, {
      id: id, text: item.text, who: 'Everyone', type: 'todo', points: 0, due: null, recur: null, done: false,
      familyId: familyId, createdAt: new Date().toISOString()
    });
    return '✅ Added as a to-do: "' + item.text + '".';
  }
  if (item.type === 'shopping') {
    firestoreSetDoc(base, token, 'shopping/' + id, {
      id: id, name: item.name, qty: '1', cat: 'Other', store: null, who: 'Everyone', done: false,
      familyId: familyId, createdAt: new Date().toISOString()
    });
    return '✅ Added "' + item.name + '" to the shopping list.';
  }
  if (item.type === 'meal') {
    firestoreSetDoc(base, token, 'meals/' + id, {
      id: id, day: item.day || null, name: item.name, notes: '', who: 'Everyone', tag: 'New',
      familyId: familyId, createdAt: new Date().toISOString()
    });
    return '✅ Added "' + item.name + '" to the meal planner' + (item.day ? ' for ' + item.day : '') + '.';
  }
  return '⚠️ Got your message but couldn\'t work out what to do with it — added nothing.';
}

// ── REPLY-BASED LEARNING [S7-B07 Layer 2] ─────────────────────────────────────
function pendingKey(email) { return 'pending_' + email.replace(/[^a-zA-Z0-9]/g, '_'); }

function handleUnknownSender(message, fromEmail, subject, body) {
  var props = PropertiesService.getScriptProperties();
  var key = pendingKey(fromEmail);
  var existingRaw = props.getProperty(key);
  var pending = existingRaw ? JSON.parse(existingRaw) : [];
  pending.push({ subject: subject, body: body, timestamp: Date.now() });
  props.setProperty(key, JSON.stringify(pending));

  message.reply(
    "👋 Hey! I got your message but I don't know who you are yet.\n\n" +
    "Reply with just your first name and I'll remember you next time — " +
    "I'll add whatever you just sent as soon as I know who you are.\n\n" +
    "— The Family Hub 🏠"
  );
}

// Called for every message from a still-unknown sender BEFORE assuming it's
// a fresh item. Returns true if this message was consumed as a name reply
// (and any pending items from this sender were processed) — false if there's
// no pending hold for this sender yet, meaning it's a genuinely new message
// that should go through handleUnknownSender() instead.
function tryProcessNameReply(message, fromEmail, ctx) {
  var props = PropertiesService.getScriptProperties();
  var key = pendingKey(fromEmail);
  var raw = props.getProperty(key);
  if (!raw) return false; // no prior "who are you?" was ever sent to this address

  var body = (message.getPlainBody() || '').trim();
  var name = null;
  for (var i = 0; i < ctx.roster.length; i++) {
    var re = new RegExp('\\b' + ctx.roster[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (re.test(body)) { name = ctx.roster[i]; break; }
  }
  if (!name) return false; // their reply didn't contain a recognisable name — leave the hold in place, ask again isn't triggered here to avoid a reply-loop; a human (Giuseppe) can clear it manually if needed

  addToEmailMap(ctx.base, ctx.token, ctx.familyId, fromEmail, name);
  ctx.emailMap[fromEmail] = name; // keep this run's in-memory copy in sync too

  var pending = JSON.parse(raw);
  for (var p = 0; p < pending.length; p++) {
    createItemFromMessage(ctx, name, stripForwardPrefix(pending[p].subject), pending[p].body, null);
  }
  props.deleteProperty(key);

  message.reply(
    "✅ Got it — I'll remember you as " + name + " from this address! " +
    "Next time you forward something, I'll know it's you. 😊\n\n" +
    (pending.length ? "I've just added what you sent earlier too." : "") +
    "\n\n— The Family Hub 🏠"
  );
  return true;
}

// ── AUTH — SERVICE ACCOUNT JWT BEARER FLOW ───────────────────────────────────
function getAccessToken(keyJson) {
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claimSet = {
    iss: keyJson.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  var base64url = function (obj) { return Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, ''); };
  var toSign = base64url(header) + '.' + base64url(claimSet);
  var signatureBytes = Utilities.computeRsaSha256Signature(toSign, keyJson.private_key);
  var signature = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, '');
  var jwt = toSign + '.' + signature;

  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true
  });
  var data = JSON.parse(response.getContentText());
  if (!data.access_token) throw new Error('Failed to get Firestore access token: ' + response.getContentText());
  return data.access_token;
}

// ── FIRESTORE REST HELPERS ────────────────────────────────────────────────────
function firestoreBase(projectId) {
  return 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents';
}

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return { doubleValue: v };
  if (typeof v === 'object') return { mapValue: { fields: toFirestoreFields(v) } };
  return { stringValue: String(v) };
}
function toFirestoreFields(obj) {
  var fields = {};
  for (var k in obj) { if (obj.hasOwnProperty(k)) fields[k] = toFirestoreValue(obj[k]); }
  return fields;
}
function fromFirestoreValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('doubleValue' in v) return v.doubleValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return fromFirestoreFields((v.mapValue && v.mapValue.fields) || {});
  // getFamilyRoster()'s 'members' field is a Firestore array (arrayValue) of
  // maps ({name,color}) — without this branch every array-typed field
  // decoded as null, silently breaking roster lookup entirely.
  if ('arrayValue' in v) return ((v.arrayValue && v.arrayValue.values) || []).map(fromFirestoreValue);
  return null;
}
function fromFirestoreFields(fields) {
  var obj = {};
  for (var k in fields) { if (fields.hasOwnProperty(k)) obj[k] = fromFirestoreValue(fields[k]); }
  return obj;
}

function firestoreGetDoc(base, token, path) {
  var res = UrlFetchApp.fetch(base + '/' + path, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return null;
  var doc = JSON.parse(res.getContentText());
  return fromFirestoreFields(doc.fields || {});
}

// Full-document overwrite (used for creating new events/todos/etc — each
// gets a brand-new doc id, so there's nothing to merge with).
function firestoreSetDoc(base, token, path, obj) {
  UrlFetchApp.fetch(base + '/' + path, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: toFirestoreFields(obj) }),
    muteHttpExceptions: true
  });
}

// ── FAMILY DATA ───────────────────────────────────────────────────────────────
// Reads the SAME 'settings/members' doc the web app itself writes
// (fbSave('settings', {id:'members', members:[{name,color},...]})) —
// returns just the names.
function getFamilyRoster(base, token, familyId) {
  var doc = firestoreGetDoc(base, token, 'settings/members');
  if (!doc || !doc.members) return [];
  var names = [];
  for (var i = 0; i < doc.members.length; i++) {
    if (doc.members[i] && doc.members[i].name) names.push(doc.members[i].name);
  }
  return names;
}

// [S7-B07 Layer 1] Reads the emailMap field on the family's own document —
// auto-populated by index.html's recordEmailMapEntry() the moment a family
// member signs in with Google. Keys are stored with '.' replaced by '_'
// (Firestore field paths use '.' as a nesting separator, so a literal email
// address can't be a field-path segment) and are un-escaped here.
function getEmailMap(base, token, familyId) {
  var doc = firestoreGetDoc(base, token, 'families/' + familyId);
  var raw = (doc && doc.emailMap) ? doc.emailMap : {};
  var result = {};
  for (var k in raw) {
    if (raw.hasOwnProperty(k)) result[k.replace(/_/g, '.')] = raw[k];
  }
  return result;
}

// [S7-B07 Layer 2] Permanently remembers a manually-confirmed sender.
function addToEmailMap(base, token, familyId, email, name) {
  var safeKey = email.toLowerCase().replace(/\./g, '_');
  var url = base + '/families/' + familyId + '?updateMask.fieldPaths=' + encodeURIComponent('emailMap.' + safeKey);
  UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: { emailMap: { mapValue: { fields: toFirestoreFields((function () { var o = {}; o[safeKey] = name; return o; })()) } } } }),
    muteHttpExceptions: true
  });
}
