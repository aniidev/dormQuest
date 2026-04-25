/**
 * Clears Firestore `dorms` and repopulates with random UMD-style halls/rooms.
 * Optionally resets every `users/*` profile to a unique dorm from the new pool.
 *
 * Prerequisites:
 * 1. Firebase Console → Project settings → Service accounts → Generate new private key.
 * 2. Save the JSON file outside the repo (never commit it).
 * 3. Run (PowerShell):
 *    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
 *    npm run seed:umd-dorms
 *
 * Flags:
 *   --skip-users     Only replace `dorms`; do not modify user profiles.
 */

import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import process from 'process';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const UMD_HALLS = [
  'Ellicott Hall',
  'Hagerstown Hall',
  'La Plata Hall',
  'Bladen Hall',
  'Cumberland Hall',
  'Annapolis Hall',
  'Centreville Hall',
  'Chestertown Hall',
  'Denton Hall',
  'Easton Hall',
  'Frederick Hall',
  'Oakland Hall',
  'Cambridge Hall',
  'Johnson-Whittle Hall',
  'Pyon-Chen Hall',
  'Wicomico Hall',
  'Worcester Hall',
  'Caroline Hall',
  'Dorchester Hall',
  'Prince Frederick Hall',
  'Queen Anne Hall',
  'St. Mary\'s Hall',
  'Somerset Hall',
  'Talbot Hall',
  'Washington Hall',
];

const TARGET_DORM_COUNT = 72;

function buildDormDocKey(hallName, roomNumber) {
  const hall = hallName.trim();
  const room = roomNumber.trim().toUpperCase();
  const hallKey = hall
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  const safeHall = hallKey.length > 0 ? hallKey : 'HALL';
  return `${safeHall}__${room}`;
}

function randomRoomNumber() {
  if (Math.random() < 0.45) {
    const wing = String.fromCharCode(65 + Math.floor(Math.random() * 6));
    const num = 100 + Math.floor(Math.random() * 420);
    return `${wing}-${num}`;
  }
  const floor = 1 + Math.floor(Math.random() * 8);
  const rest = String(100 + Math.floor(Math.random() * 900)).slice(-3);
  return `${floor}${rest}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initAdmin() {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!path || !existsSync(path)) {
    console.error(
      'Missing service account file. Set GOOGLE_APPLICATION_CREDENTIALS to the JSON path (absolute path recommended on Windows).'
    );
    process.exit(1);
  }
  const json = JSON.parse(readFileSync(path, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(json),
  });
  return admin.firestore();
}

async function deleteCollectionDocs(db, collectionId) {
  const ref = db.collection(collectionId);
  let deleted = 0;
  for (;;) {
    const snap = await ref.limit(500).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
    console.log(`  …deleted ${deleted} docs from "${collectionId}"`);
  }
  return deleted;
}

function generateUniqueDorms(count) {
  const used = new Set();
  const entries = [];
  let guard = 0;
  while (entries.length < count && guard < count * 50) {
    guard += 1;
    const hallName = UMD_HALLS[Math.floor(Math.random() * UMD_HALLS.length)];
    const roomNumber = randomRoomNumber();
    const dorm = buildDormDocKey(hallName, roomNumber);
    if (used.has(dorm)) continue;
    used.add(dorm);
    entries.push({
      dorm,
      hallName,
      roomNumber: roomNumber.trim().toUpperCase(),
      timestamp: Date.now(),
    });
  }
  if (entries.length < count) {
    throw new Error(`Could only generate ${entries.length} unique dorms (try increasing variety).`);
  }
  return entries;
}

async function writeDorms(db, entries) {
  let written = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + 400);
    chunk.forEach((e) => {
      batch.set(db.collection('dorms').doc(e.dorm), e, { merge: false });
    });
    await batch.commit();
    written += chunk.length;
    console.log(`  …wrote ${written} dorms`);
  }
}

async function resetUsersToDorms(db, dormEntries, skipUsers) {
  if (skipUsers) {
    console.log('Skipping user profile updates (--skip-users).');
    return;
  }
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) {
    console.log('No user documents to update.');
    return;
  }
  const pool = shuffle(dormEntries);
  if (usersSnap.size > pool.length) {
    console.warn(
      `Warning: ${usersSnap.size} users but only ${pool.length} unique dorms; some rooms will be shared.`
    );
  }
  let idx = 0;
  let updated = 0;
  const users = usersSnap.docs;

  for (let i = 0; i < users.length; i += 400) {
    const batch = db.batch();
    const chunk = users.slice(i, i + 400);
    chunk.forEach((docSnap) => {
      const pick = pool[idx % pool.length];
      idx += 1;
      batch.set(
        docSnap.ref,
        {
          hallName: pick.hallName,
          roomNumber: pick.roomNumber,
          dorm: pick.dorm,
          timestamp: Date.now(),
        },
        { merge: true }
      );
    });
    await batch.commit();
    updated += chunk.length;
    console.log(`  …updated ${updated} user profiles`);
  }
}

async function main() {
  const skipUsers = process.argv.includes('--skip-users');
  console.log('Initializing Firebase Admin…');
  const db = initAdmin();

  console.log('Removing all documents in collection "dorms"…');
  await deleteCollectionDocs(db, 'dorms');

  console.log(`Generating ${TARGET_DORM_COUNT} unique UMD-style dorm entries…`);
  const entries = generateUniqueDorms(TARGET_DORM_COUNT);

  console.log('Writing new "dorms" documents…');
  await writeDorms(db, entries);

  console.log('Resetting user hall/room/dorm fields to new data…');
  await resetUsersToDorms(db, entries, skipUsers);

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
