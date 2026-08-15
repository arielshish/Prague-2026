/* eslint-disable no-console */
'use strict';

const assert = require('assert');
const core = require('./trip-summary-rows-readonly');

function byName(rows, name) {
  return rows.find((r) => r.placeName === name);
}

(function testScheduledVisitedAndExpenseEvidence() {
  const rows = core.buildTripSummaryRows({
    days: [{ dayNum: 3, title: 'יום 3', stops: [{ name: 'Pizza & Pasta Factory' }] }],
    visited: { 'Pizza & Pasta Factory': Date.parse('2026-08-10T12:00:00') },
    expenses: [{ name: 'Pizza & Pasta Factory', ils: 100, czk: 709 }],
    allPlaces: [{ name: 'Pizza & Pasta Factory' }],
    placeCoords: { 'Pizza & Pasta Factory': [50, 14] },
    tripStart: '2026-08-08T00:00:00',
    tripEnd: '2026-08-15T23:59:59'
  });
  const row = byName(rows, 'Pizza & Pasta Factory');
  assert(row);
  assert.strictEqual(row.visited, true);
  assert.strictEqual(row.scheduledDay, 3);
  assert.strictEqual(row.visitedDayByTimestamp, 3);
  assert.strictEqual(row.expenseEvidenceCount, 1);
  assert.deepStrictEqual(row.warnings, []);
})();

(function testAliasByCoordinates() {
  const rows = core.buildTripSummaryRows({
    days: [{ dayNum: 6, stops: [{ name: 'ארוחת ערב — Gran Fierro' }] }],
    visited: { 'Gran Fierro': Date.parse('2026-08-13T20:00:00') },
    allPlaces: [{ name: 'Gran Fierro' }, { name: 'ארוחת ערב — Gran Fierro' }],
    placeCoords: {
      'Gran Fierro': [50.08, 14.42],
      'ארוחת ערב — Gran Fierro': [50.08, 14.42]
    },
    tripStart: '2026-08-08T00:00:00',
    tripEnd: '2026-08-15T23:59:59'
  });
  const row = byName(rows, 'Gran Fierro');
  assert(row);
  assert.strictEqual(row.scheduledDay, 6);
})();

(function testBranchSeparation() {
  const rows = core.buildTripSummaryRows({
    days: [],
    visited: {},
    allPlaces: [{ name: 'Primark Wenceslas Square' }, { name: 'Primark Metropole Zličín' }],
    placeCoords: {
      'Primark Wenceslas Square': [50.0812, 14.4295],
      'Primark Metropole Zličín': [50.054136, 14.2879]
    }
  });
  assert(byName(rows, 'Primark Wenceslas Square'));
  assert(byName(rows, 'Primark Metropole Zličín'));
  assert.notStrictEqual(
    byName(rows, 'Primark Wenceslas Square').coords.join(','),
    byName(rows, 'Primark Metropole Zličín').coords.join(',')
  );
})();

console.log('trip-summary-rows-readonly tests passed');
