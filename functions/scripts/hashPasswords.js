const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function loadPasswordMap(filePath) {
  if (!filePath) {
    return null;
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed.reduce((acc, entry) => {
      if (entry && entry.email && entry.password) {
        acc[String(entry.email).toLowerCase()] = String(entry.password);
      }
      return acc;
    }, {});
  }

  return Object.keys(parsed).reduce((acc, key) => {
    acc[String(key).toLowerCase()] = String(parsed[key]);
    return acc;
  }, {});
}

async function main() {
  const [, , mappingArg] = process.argv;
  const passwordMap = loadPasswordMap(mappingArg);
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;

  if (!passwordMap && !defaultPassword) {
    console.error('❌ Provide a mapping file or set DEFAULT_USER_PASSWORD.');
    process.exit(1);
  }

  const snapshot = await db.collection('users').get();
  if (snapshot.empty) {
    console.log('ℹ️  No users found.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.passwordHash) {
      skipped += 1;
      continue;
    }

    const email = String(data.email || '').toLowerCase();
    const password = (passwordMap && passwordMap[email]) || defaultPassword;

    if (!password) {
      console.warn(`⚠️  Skipping ${email || doc.id} (no password provided).`);
      skipped += 1;
      continue;
    }

    const passwordHash = createPasswordHash(password);
    await doc.ref.update({ passwordHash });
    updated += 1;
    console.log(`✅ Updated ${email || doc.id}`);
  }

  console.log(`\nDone. Updated ${updated} user(s), skipped ${skipped}.`);
}

main().catch((error) => {
  console.error('❌ Failed to update passwords:', error);
  process.exit(1);
});
