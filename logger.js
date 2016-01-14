exports.__esModule = true;
exports.default = myAwsomelogger;

var _global = require('global');

var _global2 = _interopRequireDefault(_global);

var _utils = require('misc/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function myAwsomelogger() {
  this.log = [];
  this.max = 999;
}
myAwsomelogger.prototype.set = function (input) {
  if (this.log.length > 999) {
    this.clear();
  }
  var data = (0, _utils.extend)({}, input, {
    date: Math.round(Date.now())
  });
  data.d = logAny(input.d, 2);
  this.log.push(data);
};
myAwsomelogger.prototype.clear = function () {
  this.log.shift();
};
myAwsomelogger.prototype.show = function () {
  var strUrl = '/debugger.html';
  var winName = 'debugger'; /*+ Math.random()*/;
  var logs = dddddd(this.log);
  var wdegugger = _global2.default.open(strUrl, winName);
  setTimeout(sendLogs, 300);
  function sendLogs() {
    if (wdegugger) {
      wdegugger.renderLogs(logs);
    } else {
      setTimeout(sendLogs, 300);
    }
  }
};

function dddddd(logs) {
  var parsedLog = [];
  var map = {};
  logs.forEach(function (log) {
    if (log.id) {
      map[log.id] = map[log.id] || [];
      map[log.id].push(log);
    } else {
      parsedLog.push({
        type: log.t,
        name: log.n,
        data: log.d,
        date: log.date
      });
    }
  });
  map.forEach(function (views) {
    var dates = {};
    var max = views[0].date;
    views.forEach(function (view) {
      dates[view.t] = view.date;
      max = Math.max(max, view.date);
    });
    var data = (0, _utils.extend)(dates, {
      entity: views[0].d.entity,
      id: views[0].id
    });
    parsedLog.push({
      type: views[0].d.entity,
      name: views[0].n,
      data: data,
      date: views[0].date,
      end: max
    });
  });
  parsedLog.sort(function (a, b) {
    return a.date - b.date;
  });
  return parsedLog;
}

function logAny(obj, depth, stringLimit) {
  stringLimit = stringLimit || 128;

  if (!obj) {
    return String(obj);
  }
  if (['string', 'number', 'boolean'].indexOf(typeof obj) !== -1) {
    return String(obj).substr(0, stringLimit);
  }

  var returnObj = {};
  if (obj === _global2.default) {
    return returnObj;
  } else if (obj instanceof Error) {
    obj.forEach(function (k, v) {
      returnObj[k] = logAny(v);
    });
  } else if (obj instanceof Array) {
    for (var i = obj.length - 1; i >= 0; i--) {
      returnObj[i] = logDepth(obj[i], depth);
    }
  } else if ((0, _utils.isNode)(obj)) {
    returnObj = logHtmlElement(obj);
  } else if (obj instanceof Object) {
    if ('state' in obj && 'readyState' in obj) {
      returnObj = {
        readyState: obj.readyState,
        response: obj.responseJSON ? obj.responseJSON : logAny(obj.responseText, 0, 100),
        status: obj.status
      };
    } else if (typeof obj.xhr === 'function') {
      returnObj = {
        url: obj.url,
        type: obj.type,
        dataType: obj.dataType
      };
    } else {
      for (var j in obj) {
        returnObj[j] = logDepth(obj[j], depth);
      }
    }
  } else {
    var _obj;
    try {
      _obj = JSON.stringify(obj);
    } catch (e) {}
    if (!_obj) {
      try {
        _obj = String(obj);
      } catch (e) {}
    }
  }
  return returnObj;
}

function logDepth(obj, depth) {
  if (typeof obj !== 'function') {
    if (depth) {
      return logAny(obj, --depth);
    } else {
      return logAny(JSON.stringify(obj));
    }
  }
  return '';
}

function logHtmlElement(node) {
  if (!node) {
    return '';
  }
  var returnObj = ['<', node.tagName];
  if (node.id) {
    returnObj.push('#' + node.id);
  }
  if (node.className) {
    returnObj.push('.' + node.className.split(' ').join('.'));
  }
  returnObj.push('>');
  return returnObj.join(' ');
}