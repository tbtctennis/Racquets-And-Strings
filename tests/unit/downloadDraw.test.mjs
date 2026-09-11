import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { downloadRRGroupsAsPng, downloadRoundAsPng } from '../../src/pages/tournament/bracketImage.ts';
import { TournamentHeader } from '../../src/pages/tournament/TournamentElements.tsx';

const page = await readFile(new URL('../../src/pages/Tournament.tsx', import.meta.url), 'utf8');
const elements = await readFile(new URL('../../src/pages/tournament/TournamentElements.tsx', import.meta.url), 'utf8');

const headerProps = {
  hasMatches: true,
  isProcessing: false,
  editMode: false,
  started: false,
  mensSkillMerge: null,
  womensSkillMerge: null,
  consolidateDoubles: false,
  currentDrawFormat: 'bracket',
  onDownload: () => undefined,
  onGenerateMatches: () => undefined,
  onCancelMatches: () => undefined,
  onToggleEdit: () => undefined,
  onSetMensSkillMerge: () => undefined,
  onSetWomensSkillMerge: () => undefined,
  onToggleConsolidateDoubles: () => undefined,
  zoneDrawsEnabled: false,
  onOpenZoneConfig: () => undefined,
};

const knockoutMatch = {
  id: 'm1',
  event_id: 'e1',
  tournament_choice: 'Singles',
  division: "Men's",
  skill_group: 'Challengers',
  drawsize: 2,
  match_id: 'F-1',
  round: 'F',
  position: 1,
  player_1_slot: 1,
  player_2_slot: 2,
  player_1_name: 'Ada Lovelace',
  player_1_uid: 'u1',
  player_2_name: 'Grace Hopper',
  player_2_uid: 'u2',
  status: 'pending',
  started: false,
};

const captureSvg = (run) => {
  const origImage = globalThis.Image;
  const origCreate = URL.createObjectURL;
  const origBlob = globalThis.Blob;
  let svg = '';
  globalThis.Image = class {
    set src(_value) {}
  };
  URL.createObjectURL = () => 'blob:test';
  globalThis.Blob = class extends origBlob {
    constructor(parts, options) {
      super(parts, options);
      if (String(options?.type || '').includes('svg')) svg = String(parts?.[0] ?? '');
    }
  };
  try {
    run();
    return svg;
  } finally {
    globalThis.Image = origImage;
    URL.createObjectURL = origCreate;
    globalThis.Blob = origBlob;
  }
};

test('organizer sees the Download Draw control and a non-organizer does not', () => {
  const organizer = renderToStaticMarkup(React.createElement(TournamentHeader, { ...headerProps, isCreator: true }));
  const spectator = renderToStaticMarkup(React.createElement(TournamentHeader, { ...headerProps, isCreator: false }));

  assert.match(organizer, /Manage Draw/);
  assert.equal(spectator, '');
  assert.match(elements, /if \(!isCreator\) return null;/);
  assert.match(elements, /label="Download Draw"/);
  assert.match(page, /\{!pastMode && isCreator && \(/);
  assert.match(page, /<TournamentHeader/);
  assert.match(
    page,
    /downloadRoundAsPng\(knockoutMatches, r, currentDraw\?\.label \|\| 'Draw', event\?\.title, userMap\)/,
  );
  assert.match(page, /downloadRRGroupsAsPng\([\s\S]*userMap/);
  assert.match(page, /Names and contacts/);
});

test('error-boundary Download the draw fallback is untouched', () => {
  const boundary = elements.slice(
    elements.indexOf('export class BracketErrorBoundary'),
    elements.indexOf('// ─── Player-facing zone controls'),
  );
  assert.match(boundary, /Download the draw to view it offline\./);
  assert.match(boundary, />\s*Download Draw\s*</);
});

test('round and group PNG exports include participant contacts', () => {
  const contacts = { u1: { phone: '4165550101', email: 'ada@example.com' } };
  const roundSvg = captureSvg(() => downloadRoundAsPng([knockoutMatch], 'F', 'Draw', 'Open', contacts));
  const groupSvg = captureSvg(() =>
    downloadRRGroupsAsPng(
      [[{ uid: 'u1', name: 'Ada Lovelace', participantId: 'p1' }]],
      ['Group A'],
      [],
      'Draw',
      'Open',
      contacts,
    ),
  );

  assert.match(roundSvg, /4165550101/);
  assert.match(groupSvg, /4165550101/);
});
