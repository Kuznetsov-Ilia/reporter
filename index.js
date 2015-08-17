'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _perf = require('./perf');

var _perf2 = _interopRequireDefault(_perf);

var _sender = require('./sender');

var _sender2 = _interopRequireDefault(_sender);

var _miscUtils = require('misc/utils');

exports['default'] = Reporter;

function Reporter(LOGGER, TRANSFORM) {
  this.LOGGER = LOGGER;
  this.TIMERS_DATA = {};
  this.DATA = {};
  this.TRANSFORM = TRANSFORM;
  this.MEASURES = {};
}

_miscUtils.extend(Reporter.prototype, {
  start: function start(args) {
    var markName = ['start', args.t, args.n, args.id].join('-');
    _perf2['default'].mark(markName);
    args.start = markName;
    this.TIMERS_DATA[markName] = args;
    return this.TIMERS_DATA[markName];
  },

  end: function end(args) {
    var token = [args.t, args.n, args.id].join('-');
    var markNameStart = 'start-' + token;
    var measureName = 'measure-' + token;
    var markNameEnd = 'end-' + token;
    if (this.markExists(markNameStart)) {
      _perf2['default'].mark(markNameEnd);
      _perf2['default'].measure(measureName, markNameStart, markNameEnd);
    }
    var data = this.TIMERS_DATA[markNameStart] || {};
    var duration = this.getMeasure(measureName);
    _miscUtils.extend(data, {
      end: markNameEnd,
      duration: duration
    });

    this.LOGGER.set(data);
    data = null;
    delete this.TIMERS_DATA[markNameStart];
    return this;
  },

  send: function send(data) {
    if (data) {
      if (this.DATA) {
        _miscUtils.extend(this.DATA, data);
      } else {
        this.DATA = data;
      }
    } else if (!this.DATA) {
      // nothing to send
      return this;
    }
    this.LOGGER.set(this.DATA);
    _sender2['default'](this.TRANSFORM.get(this.DATA));
    this.clear();
    return this;
  },

  log: function log(data) {
    if (data) {
      if (this.DATA) {
        _miscUtils.extend(this.DATA, data);
      } else {
        this.DATA = data;
      }
    } else if (!this.DATA) {
      // nothing to send
      return this;
    }
    this.LOGGER.set(this.DATA);
    this.clear();
    // do logger magick
    return this;
  },

  clear: function clear() {
    this.DATA = null;
    return this;
  },

  clearMarks: function clearMarks(marks) {
    if (marks && marks.length) {
      marks.forEach(_perf2['default'].clearMarks.bind(_perf2['default']));
    }
  },

  markExists: function markExists(markName) {
    var entryPoint = _perf2['default'].getEntriesByName(markName, 'mark');
    return entryPoint && entryPoint.length > 0;
  },

  getMeasure: function getMeasure(measureName) {
    var measure = _perf2['default'].getEntriesByName(measureName, 'measure');
    return measure[0] && measure[0].duration;
  },

  getMeasures: function getMeasures(measureGroupName) {
    var mg = this.MEASURES[measureGroupName];
    mg.name.filter(function (n) {
      return mg.start.indexOf(n) !== -1 && mg.end.indexOf(n) !== -1;
    })
    //.forEach(n => PERF.measure(n, [measureGroupName, n, 'start'].join('-'), [measureGroupName, n, 'end'].join('-')));
    .forEach(function (n) {
      _perf2['default'].measure(n, [measureGroupName, n, 'start'].join('-'), [measureGroupName, n, 'end'].join('-'));
    });

    return _perf2['default'].getEntriesByType('measure').filter(function (m) {
      return mg.name.indexOf(m.name) !== -1;
    }).map(function (m) {
      return {
        k: m.name,
        v: Math.round(m.duration * 1000) / 1000
      };
    });
  },

  getDuration: function getDuration(startMarkName, stopMarkName) {
    if (this.markExists(startMarkName)) {
      stopMarkName = stopMarkName || 'tmpStopMarkName';
      var measureName = ['tmpMeasure', startMarkName, stopMarkName].join('-');
      if (stopMarkName === 'tmpStopMarkName') {
        _perf2['default'].mark(stopMarkName);
      } else if (!this.markExists(stopMarkName)) {
        return false;
      }
      _perf2['default'].measure(measureName, startMarkName, stopMarkName);
      var measure = _perf2['default'].getEntriesByName(measureName, 'measure');
      var duration = measure[0] && Math.round(measure[0].duration * 1000) / 1000;
      _perf2['default'].clearMarks(startMarkName);
      _perf2['default'].clearMarks(stopMarkName);
      _perf2['default'].clearMeasures(measureName);
      return duration;
    } else {
      return false;
    }
  },

  mark: function mark(markGroup, markName, markType) {
    if (markType) {
      if (['start', 'end'].indexOf(markType) === -1) {
        return console.error('unknown mark type', markType);
      }
      var mName = [markGroup, markName, markType].join('-');
      _perf2['default'].mark(mName);
      this.MEASURES[markGroup] = this.MEASURES[markGroup] || { name: [], start: [], end: [] };
      var mg = this.MEASURES[markGroup];

      if (mg.name.indexOf(markName) === -1) {
        mg.name.push(markName);
      }
      if (mg[markType].indexOf(markName) === -1) {
        mg[markType].push(markName);
      }
    } else {
      markName = markGroup;
      _perf2['default'].mark(markName);
    }
  }
});
module.exports = exports['default'];