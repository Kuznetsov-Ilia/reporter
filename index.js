import PERF from './perf';
import SEND from './sender';
import {extend} from 'misc/utils';

export default Reporter;

function Reporter(LOGGER, TRANSFORM) {
  this.LOGGER = LOGGER;
  this.TIMERS_DATA = {};
  this.DATA = {};
  this.TRANSFORM = TRANSFORM;
}

extend(Reporter.prototype, {
  start(args) {
    var markName = ['start', args.t, args.n, args.id].join('-');
    PERF.mark(markName);
    args.start = markName;
    this.TIMERS_DATA[markName] = args;
    return this.TIMERS_DATA[markName];
  },

  end(args) {
    var token = [args.t, args.n, args.id].join('-');
    var markNameStart = 'start-' + token;
    var measureName = 'measure-' + token;
    var markNameEnd = 'end-' + token;
    if (this.markExists(markNameStart)) {
      PERF.mark(markNameEnd);
      PERF.measure(measureName, markNameStart, markNameEnd);
    }
    var data = this.TIMERS_DATA[markNameStart] || {};
    var duration = this.getMeasure(measureName);
    extend(data, {
      end: markNameEnd,
      duration: duration
    });

    this.LOGGER.set(data);
    data = null;
    delete this.TIMERS_DATA[markNameStart];
    return this;
  },

  send(data) {
    if (data) {
      if (this.DATA) {
        extend(this.DATA, data);
      } else {
        this.DATA = data;
      }
    } else if (!this.DATA) { // nothing to send
      return this;
    }
    this.LOGGER.set(this.DATA);
    SEND(this.TRANSFORM.get(this.DATA));
    this.clear();
    return this;
  },

  log(data) {
    if (data) {
      if (this.DATA) {
        extend(this.DATA, data);
      } else {
        this.DATA = data;
      }
    } else if (!this.DATA) { // nothing to send
      return this;
    }
    this.LOGGER.set(this.DATA);
    this.clear();
    // do logger magick
    return this;
  },

  clear() {
    this.DATA = null;
    return this;
  },

  clearMarks(marks) {
    if (marks && marks.length) {
      marks.forEach(PERF.clearMarks.bind(PERF));
    }
  },

  markExists(markName) {
    var entryPoint = PERF.getEntriesByName(markName, 'mark');
    return entryPoint && entryPoint.length > 0;
  },

  getMeasure(measureName) {
    var measure = PERF.getEntriesByName(measureName, 'measure');
    return measure[0] && measure[0].duration;
  },

  getDuration(startMarkName, stopMarkName) {
    if (this.markExists(startMarkName)) {
      stopMarkName = stopMarkName || 'tmpStopMarkName';
      var measureName = ['tmpMeasure', startMarkName, stopMarkName].join('-');
      if (stopMarkName === 'tmpStopMarkName') {
        PERF.mark(stopMarkName);
      } else if (!this.markExists(stopMarkName)) {
        return false;
      }
      PERF.measure(measureName, startMarkName, stopMarkName);
      var measure = PERF.getEntriesByName(measureName, 'measure');
      var duration = measure[0] && Math.round(measure[0].duration * 1000) / 1000;
      PERF.clearMarks(startMarkName);
      PERF.clearMarks(stopMarkName);
      PERF.clearMeasures(measureName);
      return duration;
    } else {
      return false;
    }
  },

  mark(markName) {
    PERF.mark(markName);
  }
});
