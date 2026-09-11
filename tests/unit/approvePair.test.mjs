import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApprovePair } from '../../src/components/ApprovePair.tsx';

const render = (props = {}) =>
  renderToStaticMarkup(
    React.createElement(ApprovePair, {
      onApprove: () => {},
      onReject: () => {},
      ...props,
    }),
  );

test('renders one consistently sized approve/reject pair with accessible labels', () => {
  const html = render({ approveLabel: 'Confirm result', rejectLabel: 'Reject result' });

  assert.match(html, /aria-label="Confirm result"/);
  assert.match(html, /aria-label="Reject result"/);
  assert.equal((html.match(/type="button"/g) || []).length, 2);
  assert.equal((html.match(/h-11 w-11/g) || []).length, 2);
  assert.match(html, /gap-2/);
});

test('disables both actions while busy', () => {
  const html = render({ busy: true });

  assert.equal((html.match(/disabled=""/g) || []).length, 2);
  assert.match(html, /aria-busy="true"/);
});

test('supports custom labels without adding visible text', () => {
  const html = render({ approveLabel: 'Approve cancellation and refund', rejectLabel: 'Leave active' });

  assert.match(html, /aria-label="Approve cancellation and refund"/);
  assert.match(html, /aria-label="Leave active"/);
  assert.doesNotMatch(html, />Approve cancellation and refund</);
});
