import test from 'node:test';
import assert from 'node:assert/strict';
import { getBrandedHeadline } from './brandCopy.js';

test('legacy generated headline displays the new brand', () => {
  assert.equal(getBrandedHeadline('Professional at NEXORA'), 'Professional at Vuprise');
  assert.equal(getBrandedHeadline('  professional at nexora  '), 'Professional at Vuprise');
});

test('custom headlines and empty values are preserved', () => {
  assert.equal(getBrandedHeadline('Product designer at Acme'), 'Product designer at Acme');
  assert.equal(getBrandedHeadline(''), '');
  assert.equal(getBrandedHeadline(null), '');
});
