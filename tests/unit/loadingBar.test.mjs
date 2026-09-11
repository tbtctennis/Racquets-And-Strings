import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingBar } from '../../src/components/LoadingBar.tsx';

const renderBar = (props) => renderToStaticMarkup(React.createElement(LoadingBar, props));

test('LoadingBar is indeterminate when progress is omitted', () => {
  const html = renderBar({ label: 'Loading locations…' });

  assert.match(html, /Loading locations…/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /animate-pulse/);
  assert.doesNotMatch(html, /aria-valuenow/);
  assert.doesNotMatch(html, /aria-valuetext/);
  assert.doesNotMatch(html, /\d+%/);
});

test('LoadingBar stays indeterminate when a leftover progress number is passed', () => {
  const html = renderBar({ label: 'Loading matches…', progress: 45 });

  assert.match(html, /Loading matches…/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(html, /aria-valuenow/);
  assert.doesNotMatch(html, /aria-valuetext/);
  assert.doesNotMatch(html, /45%/);
  assert.doesNotMatch(html, /\d+%/);
});
