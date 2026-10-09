import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, filterLocationOptions, getRegionsForCountry } from './locationCatalog.js';

test('country autocomplete is complete and matches India and Indonesia case-insensitively', () => {
  const matches = filterLocationOptions(COUNTRIES, 'iNd').map(({ name }) => name);
  assert.ok(matches.includes('India'));
  assert.ok(matches.includes('Indonesia'));
});

test('region autocomplete is scoped to the selected country', () => {
  const indiaRegions = getRegionsForCountry('IN');
  const matches = filterLocationOptions(indiaRegions, 'tAm');
  assert.ok(matches.some(({ name }) => name === 'Tamil Nadu'));
  assert.ok(matches.every(({ name }) => !name.toLowerCase().includes('california')));

  const usRegions = getRegionsForCountry('US');
  assert.ok(filterLocationOptions(usRegions, 'Cal').some(({ name }) => name === 'California'));
});
