import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueueHeading, formatQueueHeading } from '../../src/components/QueueHeading.tsx';

test('formatQueueHeading applies the title-count pattern', () => {
  assert.equal(formatQueueHeading('Scheduling requested', 3), 'Scheduling requested (3)');
  assert.equal(formatQueueHeading('Needs your review', 1), 'Needs your review (1)');
});

test('QueueHeading renders the same pattern for queue surfaces', () => {
  const html = renderToStaticMarkup(React.createElement(QueueHeading, { title: 'Coupon decisions', count: 2 }));

  assert.equal(html, 'Coupon decisions (2)');
});
