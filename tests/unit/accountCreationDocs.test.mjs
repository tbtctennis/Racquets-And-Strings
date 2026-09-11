import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (relativePath) => readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('architecture account-creation record covers the live signup journey', async () => {
  const doc = await load('docs/architecture/ACCOUNT_CREATION.md');
  const flow = await load('docs/architecture/DATA_FLOW.md');
  const diagram = await load('docs/architecture/diagrams/account-creation.md');

  assert.match(doc, /## 1\. Email gate/);
  assert.match(doc, /## 2\. Password and Auth account/);
  assert.match(doc, /## 3\. Profile bootstrap and completion/);
  assert.match(doc, /## 4\. Duplicate-address path/);
  assert.match(doc, /## 5\. Throttling/);
  assert.match(doc, /## 6\. Status vocabulary/);

  assert.match(doc, /checkSignupEmail/);
  assert.match(doc, /secondary_email/);
  assert.match(doc, /ensureUserProfileDocuments/);
  assert.match(doc, /persistSignupProfile/);
  assert.match(doc, /LOOKUP_LIMIT|30 lookups per 60|30 successful lookups/);
  assert.match(doc, /resource-exhausted/);
  assert.match(doc, /createUserWithEmailAndPassword/);
  assert.match(doc, /users\.name/);

  assert.match(doc, /\| Signup screen phase/);
  assert.match(doc, /\| Email-gate result/);
  assert.match(doc, /\| Merge marker/);
  assert.match(doc, /\| Profile completeness/);
  assert.match(doc, /explicit skill/);
  assert.match(doc, /not stored as `2\.0`/);

  assert.match(flow, /ACCOUNT_CREATION\.md/);
  assert.match(flow, /contacts\.secondary_email/);
  assert.match(diagram, /checkSignupEmail callable/);
  assert.match(diagram, /contacts\.secondary_email/);
});
