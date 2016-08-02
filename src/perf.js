//"use strict";

//https://gist.github.com/RubaXa/8662836#file-performance-js
// allow running in Node.js environment
import {window} from 'my-global';

var _PERF = window.performance || {};

// We need to keep a global reference to the _PERF object to
// prevent any added properties from being garbage-collected in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137407
window._perfRefForUserTimingPolyfill = _PERF;

//
// Note what we shimmed
//
_PERF.userTimingJsNow = false;
_PERF.userTimingJsNowPrefixed = false;
_PERF.userTimingJsUserTiming = false;
_PERF.userTimingJsUserTimingPrefixed = false;
_PERF.userTimingJsPerformanceTimeline = false;
_PERF.userTimingJsPerformanceTimelinePrefixed = false;

// for prefixed support
var prefixes = [];
var methods = [];
var methodTest = null;
var i, j;

//
// _PERF.now() shim
//  http://www.w3.org/TR/hr-time/
//
if (typeof _PERF.now !== "function") {
  _PERF.userTimingJsNow = true;

  // copy prefixed version over if it exists
  methods = ["webkitNow", "msNow", "mozNow"];

  for (i = 0; i < methods.length; i++) {
    if (typeof _PERF[methods[i]] === "function") {
      _PERF.now = _PERF[methods[i]];

      _PERF.userTimingJsNowPrefixed = true;

      break;
    }
  }

  //
  // now() should be a DOMHighResTimeStamp, which is defined as being a time relative
  // to navigationStart of the PerformanceTiming (PT) interface.  If this browser supports
  // PT, use that as our relative start.  Otherwise, use "now" as the start and all other
  // now() calls will be relative to our initialization.
  //

  var nowOffset = +(new Date());
  if (_PERF.timing && _PERF.timing.navigationStart) {
    nowOffset = _PERF.timing.navigationStart;
  }

  if (typeof _PERF.now !== "function") {
    // No browser support, fall back to Date.now
    if (Date.now) {
      _PERF.now = function () {
        return Date.now() - nowOffset;
      };
    } else {
      // no Date.now support, get the time from new Date()
      _PERF.now = function () {
        return +(new Date()) - nowOffset;
      };
    }
  }
}

//
// PerformanceTimeline (PT) shims
//  http://www.w3.org/TR/performance-timeline/
//

/**
 * Adds an object to our internal Performance Timeline array.
 *
 * Will be blank if the environment supports PT.
 */
var addToPerformanceTimeline = function () {};

/**
 * Clears the specified entry types from our timeline array.
 *
 * Will be blank if the environment supports PT.
 */
var clearEntriesFromPerformanceTimeline = function () {};

// performance timeline array
var performanceTimeline = [];

// whether or not the timeline will require sort on getEntries()
var performanceTimelineRequiresSort = false;

// whether or not ResourceTiming is natively supported but UserTiming is
// not (eg Firefox 35)
var hasNativeGetEntriesButNotUserTiming = false;

//
// If getEntries() and mark() aren't defined, we'll assume
// we have to shim at least some PT functions.
//
if (typeof _PERF.getEntries !== "function" ||
  typeof _PERF.mark !== "function") {

  if (typeof _PERF.getEntries === "function" &&
    typeof _PERF.mark !== "function") {
    hasNativeGetEntriesButNotUserTiming = true;
  }

  _PERF.userTimingJsPerformanceTimeline = true;

  // copy prefixed version over if it exists
  prefixes = ["webkit", "moz"];
  methods = ["getEntries", "getEntriesByName", "getEntriesByType"];

  for (i = 0; i < methods.length; i++) {
    for (j = 0; j < prefixes.length; j++) {
      // prefixed method will likely have an upper-case first letter
      methodTest = prefixes[j] + methods[i].substr(0, 1).toUpperCase() + methods[i].substr(1);

      if (typeof _PERF[methodTest] === "function") {
        _PERF[methods[i]] = _PERF[methodTest];

        _PERF.userTimingJsPerformanceTimelinePrefixed = true;
      }
    }
  }

  /**
   * Adds an object to our internal Performance Timeline array.
   *
   * @param {Object} obj PerformanceEntry
   */
  addToPerformanceTimeline = function (obj) {
    performanceTimeline.push(obj);

    //
    // If we insert a measure, its startTime may be out of order
    // from the rest of the entries because the use can use any
    // mark as the start time.  If so, note we have to sort it before
    // returning getEntries();
    //
    if (obj.entryType === "measure") {
      performanceTimelineRequiresSort = true;
    }
  };

  /**
   * Ensures our PT array is in the correct sorted order (by startTime)
   */
  var ensurePerformanceTimelineOrder = function () {
    if (!performanceTimelineRequiresSort) {
      return;
    }

    //
    // Measures, which may be in this list, may enter the list in
    // an unsorted order. For example:
    //
    //  1. measure("a")
    //  2. mark("start_mark")
    //  3. measure("b", "start_mark")
    //  4. measure("c")
    //  5. getEntries()
    //
    // When calling #5, we should return [a,c,b] because technically the start time
    // of c is "0" (navigationStart), which will occur before b's start time due to the mark.
    //
    performanceTimeline.sort(function (a, b) {
      return a.startTime - b.startTime;
    });

    performanceTimelineRequiresSort = false;
  };

  /**
   * Clears the specified entry types from our timeline array.
   *
   * @param {string} entryType Entry type (eg "mark" or "measure")
   * @param {string} [name] Entry name (optional)
   */
  clearEntriesFromPerformanceTimeline = function (entryType, name) {
    // clear all entries from the perf timeline
    i = 0;
    while (i < performanceTimeline.length) {
      if (performanceTimeline[i].entryType !== entryType) {
        // unmatched entry type
        i++;
        continue;
      }

      if (typeof name !== "undefined" && performanceTimeline[i].name !== name) {
        // unmatched name
        i++;
        continue;
      }

      // this entry matches our criteria, remove just it
      performanceTimeline.splice(i, 1);
    }
  };

  if (typeof _PERF.getEntries !== "function" || hasNativeGetEntriesButNotUserTiming) {
    var origGetEntries = _PERF.getEntries;

    /**
     * Gets all entries from the Performance Timeline.
     * http://www.w3.org/TR/performance-timeline/#dom-performance-getentries
     *
     * NOTE: This will only ever return marks and measures.
     *
     * @returns {PerformanceEntry[]} Array of PerformanceEntrys
     */
    _PERF.getEntries = function () {
      ensurePerformanceTimelineOrder();

      // get a copy of all of our entries
      var entries = performanceTimeline.slice(0);

      // if there was a native version of getEntries, add that
      if (hasNativeGetEntriesButNotUserTiming && origGetEntries) {
        // merge in native
        Array.prototype.push.apply(entries, origGetEntries.call(_PERF));

        // sort by startTime
        entries.sort(function (a, b) {
          return a.startTime - b.startTime;
        });
      }

      return entries;
    };
  }

  if (typeof _PERF.getEntriesByType !== "function" || hasNativeGetEntriesButNotUserTiming) {
    var origGetEntriesByType = _PERF.getEntriesByType;

    /**
     * Gets all entries from the Performance Timeline of the specified type.
     * http://www.w3.org/TR/performance-timeline/#dom-performance-getentriesbytype
     *
     * NOTE: This will only work for marks and measures.
     *
     * @param {string} entryType Entry type (eg "mark" or "measure")
     *
     * @returns {PerformanceEntry[]} Array of PerformanceEntrys
     */
    _PERF.getEntriesByType = function (entryType) {
      // we only support marks/measures
      if (typeof entryType === "undefined" ||
        (entryType !== "mark" && entryType !== "measure")) {

        if (hasNativeGetEntriesButNotUserTiming && origGetEntriesByType) {
          // native version exists, forward
          return origGetEntriesByType.call(_PERF, entryType);
        }

        return [];
      }

      // see note in ensurePerformanceTimelineOrder() on why this is required
      if (entryType === "measure") {
        ensurePerformanceTimelineOrder();
      }

      // find all entries of entryType
      var entries = [];
      for (i = 0; i < performanceTimeline.length; i++) {
        if (performanceTimeline[i].entryType === entryType) {
          entries.push(performanceTimeline[i]);
        }
      }

      return entries;
    };
  }

  if (typeof _PERF.getEntriesByName !== "function" || hasNativeGetEntriesButNotUserTiming) {
    var origGetEntriesByName = _PERF.getEntriesByName;

    /**
     * Gets all entries from the Performance Timeline of the specified
     * name, and optionally, type.
     * http://www.w3.org/TR/performance-timeline/#dom-performance-getentriesbyname
     *
     * NOTE: This will only work for marks and measures.
     *
     * @param {string} name Entry name
     * @param {string} [entryType] Entry type (eg "mark" or "measure")
     *
     * @returns {PerformanceEntry[]} Array of PerformanceEntrys
     */
    _PERF.getEntriesByName = function (name, entryType) {
      if (entryType && entryType !== "mark" && entryType !== "measure") {
        if (hasNativeGetEntriesButNotUserTiming && origGetEntriesByName) {
          // native version exists, forward
          return origGetEntriesByName.call(_PERF, name, entryType);
        }

        return [];
      }

      // see note in ensurePerformanceTimelineOrder() on why this is required
      if (typeof entryType !== "undefined" && entryType === "measure") {
        ensurePerformanceTimelineOrder();
      }

      // find all entries of the name and (optionally) type
      var entries = [];
      for (i = 0; i < performanceTimeline.length; i++) {
        if (typeof entryType !== "undefined" &&
          performanceTimeline[i].entryType !== entryType) {
          continue;
        }

        if (performanceTimeline[i].name === name) {
          entries.push(performanceTimeline[i]);
        }
      }

      if (hasNativeGetEntriesButNotUserTiming && origGetEntriesByName) {
        // merge in native
        Array.prototype.push.apply(entries, origGetEntriesByName.call(_PERF, name, entryType));

        // sort by startTime
        entries.sort(function (a, b) {
          return a.startTime - b.startTime;
        });
      }

      return entries;
    };
  }
}

//
// UserTiming support
//
if (typeof _PERF.mark !== "function") {
  _PERF.userTimingJsUserTiming = true;

  // copy prefixed version over if it exists
  prefixes = ["webkit", "moz", "ms"];
  methods = ["mark", "measure", "clearMarks", "clearMeasures"];

  for (i = 0; i < methods.length; i++) {
    for (j = 0; j < prefixes.length; j++) {
      // prefixed method will likely have an upper-case first letter
      methodTest = prefixes[j] + methods[i].substr(0, 1).toUpperCase() + methods[i].substr(1);

      if (typeof _PERF[methodTest] === "function") {
        _PERF[methods[i]] = _PERF[methodTest];

        _PERF.userTimingJsUserTimingPrefixed = true;
      }
    }
  }

  // only used for measure(), to quickly see the latest timestamp of a mark
  var marks = {};

  if (typeof _PERF.mark !== "function") {
    /**
     * UserTiming mark
     * http://www.w3.org/TR/user-timing/#dom-performance-mark
     *
     * @param {string} markName Mark name
     */
    _PERF.mark = function (markName) {
      var now = _PERF.now();

      // mark name is required
      if (typeof markName === "undefined") {
        throw new SyntaxError("Mark name must be specified");
      }

      // mark name can't be a NT timestamp
      if (_PERF.timing && markName in _PERF.timing) {
        throw new SyntaxError("Mark name is not allowed");
      }

      if (!marks[markName]) {
        marks[markName] = [];
      }

      marks[markName].push(now);

      // add to perf timeline as well
      addToPerformanceTimeline({
        entryType: "mark",
        name: markName,
        startTime: now,
        duration: 0
      });
    };
  }

  if (typeof _PERF.clearMarks !== "function") {
    /**
     * UserTiming clear marks
     * http://www.w3.org/TR/user-timing/#dom-performance-clearmarks
     *
     * @param {string} markName Mark name
     */
    _PERF.clearMarks = function (markName) {
      if (!markName) {
        // clear all marks
        marks = {};
      } else {
        marks[markName] = [];
      }

      clearEntriesFromPerformanceTimeline("mark", markName);
    };
  }

  if (typeof _PERF.measure !== "function") {
    /**
     * UserTiming measure
     * http://www.w3.org/TR/user-timing/#dom-performance-measure
     *
     * @param {string} measureName Measure name
     * @param {string} [startMark] Start mark name
     * @param {string} [endMark] End mark name
     */
    _PERF.measure = function (measureName, startMark, endMark) {
      var now = _PERF.now();

      if (typeof measureName === "undefined") {
        throw new SyntaxError("Measure must be specified");
      }

      // if there isn't a startMark, we measure from navigationStart to now
      if (!startMark) {
        // add to perf timeline as well
        addToPerformanceTimeline({
          entryType: "measure",
          name: measureName,
          startTime: 0,
          duration: now
        });

        return;
      }

      //
      // If there is a startMark, check for it first in the NavigationTiming interface,
      // then check our own marks.
      //
      var startMarkTime = 0;
      if (_PERF.timing && startMark in _PERF.timing) {
        // mark cannot have a timing of 0
        if (startMark !== "navigationStart" && _PERF.timing[startMark] === 0) {
          throw new Error(startMark + " has a timing of 0");
        }

        // time is the offset of this mark to navigationStart's time
        startMarkTime = _PERF.timing[startMark] - _PERF.timing.navigationStart;
      } else if (startMark in marks) {
        startMarkTime = marks[startMark][marks[startMark].length - 1];
      } else {
        throw new Error(startMark + " mark not found");
      }

      //
      // If there is a endMark, check for it first in the NavigationTiming interface,
      // then check our own marks.
      //
      var endMarkTime = now;

      if (endMark) {
        endMarkTime = 0;

        if (_PERF.timing && endMark in _PERF.timing) {
          // mark cannot have a timing of 0
          if (endMark !== "navigationStart" && _PERF.timing[endMark] === 0) {
            throw new Error(endMark + " has a timing of 0");
          }

          // time is the offset of this mark to navigationStart's time
          endMarkTime = _PERF.timing[endMark] - _PERF.timing.navigationStart;
        } else if (endMark in marks) {
          endMarkTime = marks[endMark][marks[endMark].length - 1];
        } else {
          throw new Error(endMark + " mark not found");
        }
      }

      // add to our measure array
      var duration = endMarkTime - startMarkTime;

      // add to perf timeline as well
      addToPerformanceTimeline({
        entryType: "measure",
        name: measureName,
        startTime: startMarkTime,
        duration: duration
      });
    };
  }

  if (typeof _PERF.clearMeasures !== "function") {
    /**
     * UserTiming clear measures
     * http://www.w3.org/TR/user-timing/#dom-performance-clearmeasures
     *
     * @param {string} measureName Measure name
     */
    _PERF.clearMeasures = function (measureName) {
      clearEntriesFromPerformanceTimeline("measure", measureName);
    };
  }
}

module.exports = _PERF;
