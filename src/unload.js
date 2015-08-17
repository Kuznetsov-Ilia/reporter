import window from 'global';
import PERF from './perf';
import {noop, extend} from 'misc/utils';
export default unloadHandler;

function unloadHandler (handler, REPORTER) {
  this.handler = handler;
  this.REPORTER = REPORTER;
}

extend(unloadHandler.prototype, {
  start () {
    this.prevOnbeforeunload = window.onbeforeunload || noop;
    window.onbeforeunload = sendStatisticsBeforeUnload(this.REPORTER, this.handler);
  },
  stop () {
    window.onbeforeunload = this.prevOnbeforeunload;
  }
});

function sendStatisticsBeforeUnload (REPORTER, namesHandler) {
  return function (){
    var names = {
      api: {},
      css: {},
      js: {}
    };
    PERF.getEntriesByType('resource')
      .filter(selfHostOnly)
      .reduce(namesHandler, names)
      .map(convertToRadar)
      .forEach(REPORTER.send.bind(REPORTER));
  };
}

function convertToRadar(type, typeName) {
  var n = type.map(function(domainVals, domainName) {
    var sum = domainVals.reduce((_sum, val) => _sum + val, 0);
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
