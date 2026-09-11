import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlaceCard } from '../../src/components/PlaceCard.tsx';

const court = {
  name: 'Riverside Courts',
  dropdown: 'Riverside Park',
  lat: 43.7,
  lng: -79.4,
  address: '1 River Street',
  courtType: 'Tennis',
  numCourts: 4,
  lights: true,
  winterPlay: false,
  website: 'https://example.com',
  clubInfo: 'Community courts',
  zone: 'Central',
  bookingUrl: 'https://example.com/book',
  count: 2,
  hasPrograms: true,
  pickleballEntries: [{ netType: 'Adjustable', lights: true, numCourts: 2 }],
};

test('PlaceCard compact density preserves court details and actions', () => {
  const html = renderToStaticMarkup(
    React.createElement(PlaceCard, { court, density: 'compact', onViewPrograms: () => {}, onSuggest: () => {} }),
  );

  assert.match(html, /p-1/);
  assert.match(html, />Riverside Park</);
  assert.match(html, /TENNIS/);
  assert.match(html, /LIGHTS/);
  assert.match(html, /PICKLEBALL 2 CT · ADJUSTABLE NET/);
  assert.match(html, /2 players/);
  assert.match(html, /destination=43\.7,-79\.4/);
  assert.match(html, /View Available Programs/);
  assert.match(html, />Report</);
});

test('PlaceCard hides optional details and actions when data is absent', () => {
  const html = renderToStaticMarkup(
    React.createElement(PlaceCard, {
      court: {
        ...court,
        address: '',
        website: '',
        bookingUrl: undefined,
        clubInfo: '',
        count: 0,
        hasPrograms: false,
        pickleballEntries: [],
      },
    }),
  );

  assert.doesNotMatch(html, /1 River Street|Website|Book Online|active player|Report|PICKLEBALL/);
  assert.match(html, /Directions/);
});
