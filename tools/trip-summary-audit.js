/*
 * Prague 2026 — Trip Summary Audit Tool
 * READ ONLY by design.
 *
 * How to use:
 *   1. Open the live app in the browser.
 *   2. Paste this file into the DevTools console.
 *   3. Run: PragueTripSummaryAudit.run()
 *
 * Safety rules:
 *   - Does not call localStorage.setItem/removeItem/clear.
 *   - Does not call Firestore/Firebase writes.
 *   - Does not mutate DAYS, DAYS_STATE, VISITED_STATE, EXPENSES, PLACE_COORDS, or ALL_PLACES.
 *   - Produces a report only.
 */
(function () {
  'use strict';

  var AUDIT_VERSION = '2026-08-15-audit-readonly-v2';
  var TRIP_START = new Date('2026-08-08T00:00:00');
  var TRIP_END = new Date('2026-08-15T23:59:59');

  function safeCall(label, fn, fallback) {
    try { return fn(); }
    catch (e) {
      return fallback;
    }
  }

  function cloneJson(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch (e) { return value; }
  }

  function readLocalStorageSnapshot() {
    var keys = [
      'prague_days_v1',
      'prague_visited_v1',
      'prague_exp_v10',
      'prague_exp_ts',
      'prague_budget_v1',
      'prague_total_budget',
      'prague_pack_v2',
      'prague_remindersDone',
      'prague_trip_summary_overrides_v1'
    ];
    var out = {};
    keys.forEach(function (k) {
      var v = safeCall('localStorage:' + k, function () { return localStorage.getItem(k); }, null);
      out[k] = {
        exists: v !== null,
        length: v == null ? 0 : String(v).length
      };
    });
    return out;
  }

  function parseMaybeJson(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }

  function localDays() {
    return safeCall('getDaysState', function () {
      if (typeof getDaysState === 'function') return cloneJson(getDaysState());
      return parseMaybeJson(localStorage.getItem('prague_days_v1'), Array.isArray(window.DAYS) ? cloneJson(window.DAYS) : []);
    }, []);
  }

  function localVisited() {
    return safeCall('getVisitedState', function () {
      if (typeof getVisitedState === 'function') return cloneJson(getVisitedState());
      return parseMaybeJson(localStorage.getItem('prague_visited_v1'), {});
    }, {});
  }

  function localExpenses() {
    return safeCall('expenses', function () {
      if (Array.isArray(window.EXPENSES)) return cloneJson(window.EXPENSES);
      return parseMaybeJson(localStorage.getItem('prague_exp_v10'), []);
    }, []);
  }

  function coordsOf(name) {
    return safeCall('coordsOf', function () {
      return window.PLACE_COORDS && window.PLACE_COORDS[name] ? window.PLACE_COORDS[name].slice() : null;
    }, null);
  }

  function canonicalName(name) {
    return safeCall('canonicalName', function () {
      if (typeof window._canonicalName === 'function') return window._canonicalName(name);
      return name;
    }, name);
  }

  function visitedDay(name) {
    return safeCall('visitedDayOf', function () {
      if (typeof window.visitedDayOf === 'function') return window.visitedDayOf(name) || '';
      var st = localVisited();
      var ts = st[canonicalName(name)] || st[name];
      if (!ts) return '';
      var d = new Date(Number(ts));
      if (!(d >= TRIP_START && d <= TRIP_END)) return '';
      return Math.floor((d - TRIP_START) / 86400000) + 1;
    }, '');
  }

  function buildScheduledIndex(days) {
    var byName = {}, byCoord = {};
    (days || []).forEach(function (d, i) {
      (d.stops || []).forEach(function (s) {
        if (!s || !s.name) return;
        var info = {
          dayNum: d.dayNum || d.id || (i + 1),
          dayTitle: d.title || '',
          time: s.time || '',
          stopName: s.name
        };
        if (!byName[s.name]) byName[s.name] = info;
        var c = coordsOf(s.name);
        if (c && !byCoord[c[0] + ',' + c[1]]) byCoord[c[0] + ',' + c[1]] = info;
      });
    });
    return { byName: byName, byCoord: byCoord };
  }

  function scheduledInfoFor(name, scheduled) {
    if (scheduled.byName[name]) return scheduled.byName[name];
    var c = coordsOf(name);
    if (c && scheduled.byCoord[c[0] + ',' + c[1]]) return scheduled.byCoord[c[0] + ',' + c[1]];
    return null;
  }

  function expenseEvidenceFor(name, expenses) {
    var cName = canonicalName(name);
    var hits = [];
    (expenses || []).forEach(function (e) {
      var text = [e && e.name, e && e.place, e && e.note].filter(Boolean).join(' | ');
      if (!text) return;
      if (text.indexOf(name) !== -1 || text.indexOf(cName) !== -1) {
        hits.push({ id: e.id || '', name: e.name || '', place: e.place || '', date: e.date || '', ils: e.ils || 0, czk: e.czk || 0 });
      }
    });
    return hits;
  }

  function collectCandidateNames(days, visited, expenses) {
    var names = {};
    Object.keys(visited || {}).forEach(function (n) { names[n] = true; });
    (days || []).forEach(function (d) {
      (d.stops || []).forEach(function (s) { if (s && s.name) names[s.name] = true; });
    });
    (window.ALL_PLACES || []).forEach(function (p) { if (p && p.name) names[p.name] = true; });
    (expenses || []).forEach(function (e) {
      if (e && e.place) names[e.place] = true;
      // Do not automatically add free-text expense names as places unless they already match a known coordinate/name.
      if (e && e.name && coordsOf(e.name)) names[e.name] = true;
    });
    return Object.keys(names).sort(function (a, b) { return a.localeCompare(b, 'he'); });
  }

  function rowFor(name, days, visited, expenses, scheduled) {
    var cName = canonicalName(name);
    var isVisited = !!(visited && (visited[name] || visited[cName]));
    var c = coordsOf(name) || coordsOf(cName);
    var sched = scheduledInfoFor(name, scheduled) || scheduledInfoFor(cName, scheduled);
    var vDay = visitedDay(name) || visitedDay(cName);
    var expHits = expenseEvidenceFor(name, expenses).concat(cName !== name ? expenseEvidenceFor(cName, expenses) : []);
    var warnings = [];

    if (isVisited && !vDay && !sched) warnings.push('visited-without-day');
    if (isVisited && !c) warnings.push('visited-without-coordinates');
    if (sched && vDay && String(sched.dayNum) !== String(vDay)) warnings.push('scheduled-day-vs-visited-day-mismatch');
    if (name !== cName) warnings.push('canonical-alias');
    if (expHits.length && !isVisited) warnings.push('expense-evidence-not-visited');

    return {
      placeName: name,
      canonicalName: cName,
      visited: isVisited,
      visitedDayByTimestamp: vDay || '',
      scheduledDay: sched ? sched.dayNum : '',
      scheduledStopName: sched ? sched.stopName : '',
      hasCoords: !!c,
      coords: c || null,
      expenseEvidenceCount: expHits.length,
      expenseEvidence: expHits.slice(0, 5),
      proposedSummaryDay: sched ? sched.dayNum : (vDay || ''),
      warnings: warnings
    };
  }

  function summarize(rows, storageSnapshot) {
    var summary = {
      version: AUDIT_VERSION,
      generatedAt: new Date().toISOString(),
      totalRows: rows.length,
      visitedRows: rows.filter(function (r) { return r.visited; }).length,
      missingCoordsVisited: rows.filter(function (r) { return r.visited && !r.hasCoords; }).length,
      aliases: rows.filter(function (r) { return r.placeName !== r.canonicalName; }).length,
      dayMismatches: rows.filter(function (r) { return r.warnings.indexOf('scheduled-day-vs-visited-day-mismatch') !== -1; }).length,
      expenseOnlyEvidence: rows.filter(function (r) { return r.warnings.indexOf('expense-evidence-not-visited') !== -1; }).length,
      storageSnapshot: storageSnapshot
    };
    return summary;
  }

  function run() {
    var before = readLocalStorageSnapshot();
    var days = localDays();
    var visited = localVisited();
    var expenses = localExpenses();
    var scheduled = buildScheduledIndex(days);
    var names = collectCandidateNames(days, visited, expenses);
    var rows = names.map(function (n) { return rowFor(n, days, visited, expenses, scheduled); });
    var after = readLocalStorageSnapshot();

    var changedKeys = [];
    Object.keys(before).forEach(function (k) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changedKeys.push(k);
    });

    var report = {
      summary: summarize(rows, before),
      localStorageChangedDuringAudit: changedKeys,
      rows: rows
    };

    if (changedKeys.length) {
      console.warn('[TripSummaryAudit] WARNING: localStorage changed during read-only audit', changedKeys);
    }
    console.group('[TripSummaryAudit] ' + AUDIT_VERSION);
    console.table(rows.map(function (r) {
      return {
        place: r.placeName,
        canonical: r.canonicalName,
        visited: r.visited,
        visitedDay: r.visitedDayByTimestamp,
        scheduledDay: r.scheduledDay,
        coords: r.hasCoords,
        expenses: r.expenseEvidenceCount,
        proposedDay: r.proposedSummaryDay,
        warnings: r.warnings.join(', ')
      };
    }));
    console.log(report);
    console.groupEnd();
    return report;
  }

  window.PragueTripSummaryAudit = {
    version: AUDIT_VERSION,
    run: run,
    readLocalStorageSnapshot: readLocalStorageSnapshot
  };
})();
