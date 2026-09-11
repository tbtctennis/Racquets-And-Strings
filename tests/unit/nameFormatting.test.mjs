import assert from 'node:assert/strict';
import test from 'node:test';
import { compactPersonName, formatPersonName } from '../../src/utils/nameFormatting.ts';

test('formatPersonName trims and title-cases ordinary names', () => {
  assert.equal(formatPersonName('  bLAKE   bell  '), 'Blake Bell');
  assert.equal(formatPersonName('SERGIO TRUJILLO'), 'Sergio Trujillo');
});

test('formatPersonName preserves the fallback for an empty name', () => {
  assert.equal(formatPersonName(''), 'Player');
  assert.equal(formatPersonName('   ', 'Unknown player'), 'Unknown player');
  assert.equal(formatPersonName(undefined), 'Player');
});

test('formatPersonName leaves bracket placeholders unchanged', () => {
  assert.equal(formatPersonName('BYE'), 'BYE');
  assert.equal(formatPersonName('Player Loading'), 'Player Loading');
  assert.equal(formatPersonName('PLAYER_LOADING'), 'PLAYER_LOADING');
  assert.equal(formatPersonName('Winner of QF1'), 'Winner of QF1');
  assert.equal(formatPersonName(' winner of qf1 '), 'winner of qf1');
});

test('compactPersonName keeps the whole first name and a surname initial', () => {
  assert.equal(compactPersonName('Annas Tariq'), 'Annas T');
  assert.equal(compactPersonName('  bLAKE   bell  '), 'Blake B');
  assert.equal(compactPersonName('Charles Xavier'), 'Charles X');
});

test('compactPersonName truncates an oversized first name at 7 characters with no initial', () => {
  assert.equal(compactPersonName('Alexandria-Montgomery Playername'), 'Alexand');
  assert.equal(compactPersonName('Constantinople'), 'Constan');
});

test('compactPersonName preserves placeholders and single-token fallbacks', () => {
  assert.equal(compactPersonName('BYE'), 'BYE');
  assert.equal(compactPersonName('Winner of QF1'), 'Winner of QF1');
  assert.equal(compactPersonName('Madonna'), 'Madonna');
  assert.equal(compactPersonName(''), 'Player');
});
