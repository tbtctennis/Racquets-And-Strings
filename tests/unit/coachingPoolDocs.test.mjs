import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (relativePath) => readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('architecture coaching-pool record covers current code and the D8 S5 target', async () => {
  const doc = await load('docs/architecture/COACHING_POOL.md');
  const shape = await load('docs/architecture/DATA_SHAPE.md');
  const flow = await load('docs/architecture/DATA_FLOW.md');
  const diagram = await load('docs/architecture/diagrams/coaching-pool.md');
  const privacy = await load('docs/domain/CONTACT_PRIVACY.md');

  assert.match(doc, /## 1\. Retired group lessons/);
  assert.match(doc, /## 2\. Coaching as a catalog category/);
  assert.match(doc, /## 3\. Actions on a coaching service today/);
  assert.match(doc, /## 4\. Bookings — one lifecycle, no type/);
  assert.match(doc, /## 5\. Event lesson placeholder/);
  assert.match(doc, /## 6\. Coach ↔ player contacts/);
  assert.match(doc, /## 7\. Status vocabulary/);
  assert.match(doc, /## Target state/);

  assert.match(doc, /Book group lesson/);
  assert.match(doc, /\*\*Book\*\*/);
  assert.match(doc, /Redeem discount/);
  assert.match(doc, /group classes/);
  assert.match(doc, /private classes/);
  assert.match(doc, /stringing/);
  assert.match(doc, /not limited to socials/);
  assert.match(doc, /any event that offers coaching/);
  assert.match(doc, /lesson_pool\/\{eventId\}\/members\/\{uid\}/);
  assert.match(doc, /never revived|not coming back/);
  assert.match(doc, /TASK-511/);
  assert.match(doc, /service-lead/);
  assert.match(doc, /redeemReward/);

  assert.match(shape, /^## 9\. Lesson add-on/m);
  assert.match(shape, /^## 10\. Coaching pool/m);
  assert.match(shape, /Book group lesson/);
  assert.match(shape, /group classes, private classes, stringing/);
  assert.match(shape, /not limited to socials/);
  assert.match(shape, /never revived/);

  assert.match(flow, /COACHING_POOL\.md/);
  assert.doesNotMatch(flow, /group-lesson join\/leave/);
  assert.match(flow, /lesson_pool\/\{eventId\}\/members\/\{uid\}/);

  assert.match(diagram, /lesson_pool\/\{eventId\}\/members\/\{uid\}/);
  assert.match(diagram, /Book group lesson/);
  assert.match(diagram, /service-lead/);

  assert.match(privacy, /service-lead/);
  assert.doesNotMatch(privacy, /monthly group lesson/);
});
