'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _global = require('global');

var _global2 = _interopRequireDefault(_global);

var _perf = require('./perf');

var _perf2 = _interopRequireDefault(_perf);

var _miscUtils = require('misc/utils');

exports['default'] = unloadHandler;

function unloadHandler(handler, REPORTER) {
  this.handler = handler;
  this.REPORTER = REPORTER;
}

_miscUtils.extend(unloadHandler.prototype, {
  start: function start() {
    this.prevOnbeforeunload = _global2['default'].onbeforeunload || _miscUtils.noop;
    _global2['default'].onbeforeunload = sendStatisticsBeforeUnload(this.REPORTER, this.handler);
  },
  stop: function stop() {
    _global2['default'].onbeforeunload = this.prevOnbeforeunload;
  }
});

function sendStatisticsBeforeUnload(REPORTER, namesHandler) {
  return function () {
    var names = {
      api: {},
      css: {},
      js: {}
    };
    _perf2['default'].getEntriesByType('resource').filter(selfHostOnly).reduce(namesHandler, names).map(convertToRadar).forEach(REPORTER.send.bind(REPORTER));
  };
}

function convertToRadar(type, typeName) {
  var n = type.map(function (domainVals, domainName) {
    var sum = domainVals.reduce(function (_sum, val) {
      return _sum + val;
    }, 0);
    return {
      k: domainName,
      v: Math.round(sum / domainVals.length)
    };
  });
  return {
    t: typeName,
    n: n
  };
}

function selfHostOnly(r) {
  var duration = Math.round(r.duration * 1000) / 1000;
  var rns = r.name.split('/');
  var domain = rns[2];
  /*var initiatorType = r.initiatorType;
  if (!initiatorType) {
    if (r.name) {
      var b = r.name.split('.');
      var c = b.pop();
      initiatorType = c.split('?')[0];
    } else {
      REPORTER.send({
        t: 'debug',
        n: 'onbeforeunload',
        f: 'onbeforeunload',
        d: r
      });
    }
  }*/
  if (domain === location.host) {
    return [rns, duration];
  }
}
module.exports = exports['default'];