import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { AVAILABILITY_TAGS } from '../../src/utils/availability.ts';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('the tag picker exposes every preset window in the availability model', async () => {
  const modal = await src('src/features/profile/components/AvailabilityModal.tsx');

  assert.match(modal, /export const AvailabilityTagPicker/);
  assert.match(modal, /AVAILABILITY_TAGS\.map/);
  assert.deepEqual(
    AVAILABILITY_TAGS.map((tag) => tag.id),
    ['weekday_mornings', 'weekend_mornings', 'weekend_evenings', 'weekday_evenings', 'mornings', 'evenings', 'anytime'],
  );
});

test('Profile card owns the full availability editor, not only available_to_play', async () => {
  const info = await src('src/features/profile/components/ProfileInfo.tsx');
  const card = await src('src/components/ProfileCard.tsx');
  const modal = await src('src/features/profile/components/AvailabilityModal.tsx');

  assert.match(info, /updateAvailabilityTags/);
  assert.match(info, /updateAvailableToPlay/);
  assert.match(info, /availabilityTags=\{preferences\.availability_tags\}/);
  assert.match(info, /editing === 'availability'/);
  assert.match(info, /AvailabilityTagPicker/);
  assert.match(info, /actions\.updateAvailabilityTags\(availabilityDraft\)/);
  assert.match(info, /label="Availability"/);

  assert.match(card, /availabilityTags/);
  assert.match(card, /collapseAvailabilityTags/);
  assert.match(card, /availableToPlay/);
  assert.match(card, /onToggleAvailableToPlay/);
  assert.match(card, /editors\?\.availability/);

  assert.match(modal, /export const AvailabilityTagPicker/);
  assert.match(modal, /AVAILABILITY_TAGS\.map/);
});
