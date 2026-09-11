/**
 * Links a member account to a server-issued providers row so they can confirm their own
 * coupons (mark used / flag) from Marketplace.
 *
 * Writes `providers/{id}.member_uid` and merges the role. Preference flags are leftover
 * compatibility fields and are cleared on --remove; they do not grant provider checks.
 *
 * Usage:
 *   node scripts/set-stringer.mjs --project rands-staging --key serviceAccount.json --list
 *   node scripts/set-stringer.mjs --project rands-staging --key serviceAccount.json --uid <uid> --id karan
 *   node scripts/set-stringer.mjs --project rands-staging --key serviceAccount.json --uid <uid> --id karan --apply
 *   node scripts/set-stringer.mjs --project rands-staging --key serviceAccount.json --uid <uid> --remove --apply
 *
 * Dry-run is the default. Production additionally requires the migration confirmation triple.
 */
import admin from 'firebase-admin';
import { createMigrationDb, parseMigrationArgs } from './migrations/lib/cli.mjs';

const cliArgs = process.argv.slice(2);
const arg = (name) => {
  const i = cliArgs.indexOf(`--${name}`);
  return i === -1 ? null : (cliArgs[i + 1] ?? true);
};
const options = parseMigrationArgs(cliArgs);
if (options.help) {
  console.log(
    'Usage: node scripts/set-stringer.mjs --project <id> --key <serviceAccount.json> [--list | --uid <uid> --id <stringerId>] [--remove] [--apply]',
  );
  process.exit(0);
}
const dryRun = options.dryRun;
const list = cliArgs.includes('--list');
const remove = cliArgs.includes('--remove');

if (!list && !arg('uid')) {
  console.error(
    'Usage: node scripts/set-stringer.mjs --project <id> --key <serviceAccount.json> [--list | --uid <uid> --id <stringerId>] [--remove] [--apply]',
  );
  process.exit(1);
}
const db = createMigrationDb(options);

const leftoverTag = (prefs = {}) => {
  const tags = [];
  if (prefs.stringer === true) tags.push(`legacy stringer:${prefs.stringer_id || '?'}`);
  if (prefs.coach === true) tags.push(`legacy coach:${prefs.coach_id || '?'}`);
  return tags.length ? `  [${tags.join(' ')}]` : '';
};

const providerTag = (rows = []) => {
  if (!rows.length) return '';
  return `  [${rows.map((row) => `provider:${row.id}/${(row.roles || []).join(',') || '?'}`).join(' ')}]`;
};

const run = async () => {
  if (list) {
    const needle = (arg('search') && arg('search') !== true ? String(arg('search')) : '').toLowerCase();
    const [users, prefs, contacts, providers] = await Promise.all([
      db.collection('users').get(),
      db.collection('preferences').get(),
      db.collection('contacts').get(),
      db.collection('providers').get(),
    ]);
    const prefById = new Map(prefs.docs.map((d) => [d.id, d.data()]));
    const contactById = new Map(contacts.docs.map((d) => [d.id, d.data()]));
    const providersByUid = new Map();
    providers.docs.forEach((d) => {
      const data = d.data();
      if (!data.member_uid) return;
      const listForUid = providersByUid.get(data.member_uid) || [];
      listForUid.push({ id: d.id, roles: data.roles });
      providersByUid.set(data.member_uid, listForUid);
    });
    const rows = users.docs
      .map((d) => ({ uid: d.id, ...d.data(), ...(contactById.get(d.id) || {}) }))
      .filter((u) => !needle || `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(needle))
      .map((u) => {
        const p = prefById.get(u.uid) || {};
        return `${u.uid}  ${(u.name || '(no name)').padEnd(28)} ${u.email || ''}${providerTag(providersByUid.get(u.uid))}${leftoverTag(p)}`;
      })
      .sort();
    console.log(rows.join('\n') || 'No matching accounts.');
    console.log(`\n${rows.length} account(s)${needle ? ` matching "${needle}"` : ''}.`);
    process.exit(0);
  }

  const uid = arg('uid');
  if (!uid || uid === true) {
    console.error('Missing --uid. Run with --list to find one.');
    process.exit(1);
  }

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    console.error(`No users/${uid} — check the uid.`);
    process.exit(1);
  }
  const name = userSnap.data().name || '(no name)';

  if (remove) {
    const linked = await db.collection('providers').where('member_uid', '==', uid).get();
    console.log(
      `${dryRun ? '[dry-run] ' : ''}Clearing provider role from ${name} (${uid})${
        linked.empty ? ' (no providers row)' : `: ${linked.docs.map((d) => d.id).join(', ')}`
      }`,
    );
    if (!dryRun) {
      const batch = db.batch();
      linked.docs.forEach((d) => {
        batch.update(d.ref, { member_uid: admin.firestore.FieldValue.delete(), updated_at: new Date().toISOString() });
      });
      batch.set(
        db.doc(`preferences/${uid}`),
        {
          stringer: false,
          stringer_id: admin.firestore.FieldValue.delete(),
          coach: false,
          coach_id: admin.firestore.FieldValue.delete(),
        },
        { merge: true },
      );
      await batch.commit();
    }
    process.exit(0);
  }

  const id = arg('id');
  if (!id || id === true) {
    console.error('Missing --id (e.g. karan, fortyforty, pandemic, archie).');
    process.exit(1);
  }

  const [offers, services, providerSnap] = await Promise.all([
    db.collection('tasks').where('type', '==', 'offer').where('provider_id', '==', id).get(),
    db.collection('services').where('provider_id', '==', id).get(),
    db.doc(`providers/${id}`).get(),
  ]);
  const catalogSize = offers.size + services.size;
  if (catalogSize === 0) {
    console.warn(
      `Warning: no offers or services found with provider_id "${id}". Seed the catalog first, or check the spelling.`,
    );
  } else {
    const labels = [...offers.docs.map((d) => d.data().offer), ...services.docs.map((d) => d.data().offer)].filter(
      Boolean,
    );
    console.log(`"${id}" has ${catalogSize} catalog row(s)${labels.length ? `: ${labels.join(' · ')}` : ''}`);
  }

  const roleArg = arg('role');
  const category =
    (!offers.empty && offers.docs[0].data().category) || (!services.empty && services.docs[0].data().category) || null;
  const role = roleArg && roleArg !== true ? String(roleArg) : category === 'coaching' ? 'coach' : 'stringer';
  if (role !== 'coach' && role !== 'stringer') {
    console.error(`--role must be "coach" or "stringer", got "${role}".`);
    process.exit(1);
  }

  const current = providerSnap.exists ? providerSnap.data() : {};
  if (current.member_uid && current.member_uid !== uid) {
    console.error(`providers/${id} is already linked to ${current.member_uid}.`);
    process.exit(1);
  }
  const roles = Array.isArray(current.roles) ? [...current.roles] : [];
  if (!roles.includes(role)) roles.push(role);

  console.log(`${dryRun ? '[dry-run] ' : ''}Setting ${name} (${uid}) → ${role} providers/${id}`);
  if (!dryRun) {
    await db.doc(`providers/${id}`).set(
      {
        id,
        name: current.name || name,
        roles,
        member_uid: uid,
        updated_at: new Date().toISOString(),
        ...(current.area ? { area: current.area } : {}),
      },
      { merge: true },
    );
    console.log('Done.');
  }
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
