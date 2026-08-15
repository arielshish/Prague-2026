/*
 * Prague 2026 — Trip Summary Rows Builder
 * READ ONLY / PURE CORE by design.
 *
 * This file intentionally does not read or write localStorage/Firestore.
 * It accepts a snapshot of app state and returns derived summary rows.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PragueTripSummaryRows = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var VERSION = '2026-08-15-build-trip-summary-rows-readonly-v1';
  var MS_PER_DAY = 86400000;

  function cloneJson(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch (e) { return value; }
  }

  function normalizeDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function tripDayFromTimestamp(ts, tripStart, tripEnd) {
    var start = normalizeDate(tripStart);
    var end = normalizeDate(tripEnd);
    var d = normalizeDate(Number(ts));
    if (!start || !end || !d) return '';
    if (d < start || d > end) return '';
    return Math.floor((d - start) / MS_PER_DAY) + 1;
  }

  function defaultCanonicalName(name, ctx) {
    if (ctx && typeof ctx.canonicalName === 'function') return ctx.canonicalName(name);
    return name;
  }

  function coordsOf(name, ctx) {
    var coords = ctx && ctx.placeCoords ? ctx.placeCoords[name] : null;
    return Array.isArray(coords) ? coords.slice() : null;
  }

  function buildScheduledIndex(days, ctx) {
    var byName = {}, byCoord = {};
    (days || []).forEach(function (day, idx) {
      (day.stops || []).forEach(function (stop) {
        if (!stop || !stop.name) return;
        var info = {
          dayNum: day.dayNum || day.id || (idx + 1),
          dayTitle: day.title || '',
          time: stop.time || '',
          stopName: stop.name
        };
        if (!byName[stop.name]) byName[stop.name] = info;
        var c = coordsOf(stop.name, ctx);
        if (c) {
          var key = c[0] + ',' + c[1];
          if (!byCoord[key]) byCoord[key] = info;
        }
      });
    });
    return { byName: byName, byCoord: byCoord };
  }

  function scheduledInfoFor(name, scheduled, ctx) {
    if (scheduled.byName[name]) return scheduled.byName[name];
    var c = coordsOf(name, ctx);
    if (!c) return null;
    return scheduled.byCoord[c[0] + ',' + c[1]] || null;
  }

  function visitedDayFor(name, visited, ctx) {
    if (ctx && typeof ctx.visitedDayOf === 'function') return ctx.visitedDayOf(name) || '';
    var canonical = defaultCanonicalName(name, ctx);
    var ts = visited && (visited[canonical] || visited[name]);
    return ts ? tripDayFromTimestamp(ts, ctx.tripStart, ctx.tripEnd) : '';
  }

  function expenseEvidenceFor(name, canonicalName, expenses) {
    var hits = [];
    (expenses || []).forEach(function (e) {
      var text = [e && e.name, e && e.place, e && e.note].filter(Boolean).join(' | ');
      if (!text) return;
      if (text.indexOf(name) !== -1 || text.indexOf(canonicalName) !== -1) {
        hits.push({
          id: e.id || '',
          name: e.name || '',
          place: e.place || '',
          date: e.date || '',
          ils: e.ils || 0,
          czk: e.czk || 0
        });
      }
    });
    return hits;
  }

  function collectCandidateNames(ctx) {
    var names = {};
    Object.keys(ctx.visited || {}).forEach(function (n) { names[n] = true; });
    (ctx.days || []).forEach(function (day) {
      (day.stops || []).forEach(function (stop) { if (stop && stop.name) names[stop.name] = true; });
    });
    (ctx.allPlaces || []).forEach(function (place) { if (place && place.name) names[place.name] = true; });
    (ctx.expenses || []).forEach(function (expense) {
      if (expense && expense.place) names[expense.place] = true;
      if (expense && expense.name && coordsOf(expense.name, ctx)) names[expense.name] = true;
    });
    return Object.keys(names).sort(function (a, b) { return a.localeCompare(b, 'he'); });
  }

  function rowFor(name, scheduled, ctx) {
    var canonical = defaultCanonicalName(name, ctx);
    var isVisited = !!(ctx.visited && (ctx.visited[name] || ctx.visited[canonical]));
    var coords = coordsOf(name, ctx) || coordsOf(canonical, ctx);
    var scheduledInfo = scheduledInfoFor(name, scheduled, ctx) || scheduledInfoFor(canonical, scheduled, ctx);
    var visitedDay = visitedDayFor(name, ctx.visited, ctx) || visitedDayFor(canonical, ctx.visited, ctx);
    var expenses = expenseEvidenceFor(name, canonical, ctx.expenses || []);
    var warnings = [];

    if (isVisited && !visitedDay && !scheduledInfo) warnings.push('visited-without-day');
    if (isVisited && !coords) warnings.push('visited-without-coordinates');
    if (scheduledInfo && visitedDay && String(scheduledInfo.dayNum) !== String(visitedDay)) warnings.push('scheduled-day-vs-visited-day-mismatch');
    if (name !== canonical) warnings.push('canonical-alias');
    if (expenses.length && !isVisited) warnings.push('expense-evidence-not-visited');

    return {
      placeName: name,
      canonicalName: canonical,
      visited: isVisited,
      visitedDayByTimestamp: visitedDay || '',
      scheduledDay: scheduledInfo ? scheduledInfo.dayNum : '',
      scheduledStopName: scheduledInfo ? scheduledInfo.stopName : '',
      hasCoords: !!coords,
      coords: coords || null,
      expenseEvidenceCount: expenses.length,
      expenseEvidence: expenses.slice(0, 5),
      proposedSummaryDay: scheduledInfo ? scheduledInfo.dayNum : (visitedDay || ''),
      source: scheduledInfo ? 'scheduled' : (visitedDay ? 'visited-timestamp' : ''),
      warnings: warnings
    };
  }

  function buildTripSummaryRows(input) {
    var ctx = {
      days: cloneJson(input && input.days || []),
      visited: cloneJson(input && input.visited || {}),
      expenses: cloneJson(input && input.expenses || []),
      allPlaces: cloneJson(input && input.allPlaces || []),
      placeCoords: cloneJson(input && input.placeCoords || {}),
      canonicalName: input && input.canonicalName,
      visitedDayOf: input && input.visitedDayOf,
      tripStart: input && input.tripStart || '2026-08-08T00:00:00',
      tripEnd: input && input.tripEnd || '2026-08-15T23:59:59'
    };
    var scheduled = buildScheduledIndex(ctx.days, ctx);
    return collectCandidateNames(ctx).map(function (name) { return rowFor(name, scheduled, ctx); });
  }

  return {
    version: VERSION,
    buildTripSummaryRows: buildTripSummaryRows,
    _private: {
      tripDayFromTimestamp: tripDayFromTimestamp,
      collectCandidateNames: collectCandidateNames,
      buildScheduledIndex: buildScheduledIndex
    }
  };
});
