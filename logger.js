'use strict';
var Backbone = require('Backbone');
var $ = require('$');
var _ = require('lodash');
var PERF = require('perf');
var REPORTER = require('reporter');
function myAwsomelogger() {
  this.log = [];
  this.max = 999;
}
myAwsomelogger.prototype.set = function(input) {
  if (this.log.length > 999) {
    this.clear();
  }
  var data = _.extend({}, input, {
    date: Math.round(PERF.now())
  });
  data.d = logAny(input.d, 2);
  this.log.push(data);
}
myAwsomelogger.prototype.clear = function() {
  this.log.shift();
}
myAwsomelogger.prototype.show = function(){
  var strUrl = '/debugger.html';
  var winName = 'debugger' /*+ Math.random()*/;
  var logs = dddddd(this.log);
  var wdegugger = window.open(strUrl, winName);
  setTimeout(sendLogs, 300);
  function sendLogs() {
    if (wdegugger) {
      wdegugger.renderLogs(logs);
    } else {
      setTimeout(sendLogs, 300);
    }
  }
}

function dddddd(logs) {
  var parsedLog = []
  var map = {};
  _.each(logs, function(log) {
    if (log.id) {
      map[log.id] = map[log.id] || [];
      map[log.id].push(log);      
    } else {
      parsedLog.push({
        type: log.t,
        name: log.n,
        data: log.d,
        date: log.date
      })
    }
  });
  _.each(map, function(views){
    var dates = {}
    var max = views[0].date;
    _.each(views, function(view){
      dates[view.t] = view.date;
      max = Math.max(max, view.date);
    })
    var data = _.extend(dates, {
      entity: views[0].d.entity,
      id: views[0].id
    });
    parsedLog.push({
      type: views[0].d.entity,
      name: views[0].n,
      data: data,
      date: views[0].date,
      end: max,
    })
  });
  parsedLog.sort(function(a,b){return a.date - b.date});
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
  if (obj === window) {
    return returnObj;
  } else if (obj instanceof Backbone.View) {
    if (obj.el) {
      returnObj.el = logAny(obj.el);
    }
    if (obj.name) {
      returnObj.name = obj.name;
    }
    if (obj.model) {
      returnObj.model = logAny(obj.model.toJSON());
    }
  } else if (obj instanceof Backbone.Model) {
    returnObj = logAny(obj.toJSON());
  } else if (obj instanceof $) {
    returnObj = {
      selector: obj.selector,
      items: []
    };
    obj.each(function (i, node) {
      returnObj.items.push(logHtmlElement(node));
    });
  } else if (obj instanceof Error) {
    _.each(obj, function(k, v) {
      returnObj[k] = logAny(v);
    });
  } else if (obj instanceof $.Event || 'originalEvent' in obj) {
    returnObj = {
      altKey: obj.altKey,
      bubbles: obj.bubbles,
      button: obj.button,
      cancelable: obj.cancelable,
      clientX: obj.clientX,
      clientY: obj.clientY,
      ctrlKey: obj.ctrlKey,
      currentTarget: logHtmlElement(obj.currentTarget),
      data: logAny(obj.data),
      delegateTarget: logHtmlElement(obj.delegateTarget),
      eventPhase: obj.eventPhase,
      //handleObj: logAny(obj.handleObj),
      isDefaultPrevented: obj.isDefaultPrevented(),
      metaKey: obj.metaKey,
      offsetX: obj.offsetX,
      offsetY: obj.offsetY,
      originalEvent: logHtmlElement(obj.originalEvent),
      pageX: obj.pageX,
      pageY: obj.pageY,
      relatedTarget: logHtmlElement(obj.relatedTarget),
      screenX: obj.screenX,
      screenY: obj.screenY,
      shiftKey: obj.shiftKey,
      target: logHtmlElement(obj.target),
      timeStamp: obj.timeStamp,
      toElement: logHtmlElement(obj.toElement),
      type: obj.type
    };
  } else if (obj instanceof Array) {
    for (var i = obj.length - 1; i >= 0; i--) {
      returnObj[i] = logDepth(obj[i], depth);
    }
  } else if ($.isNode(obj)) {
    returnObj = logHtmlElement(obj);
  } else if (obj instanceof Object) {
    if ('state' in obj && 'readyState' in obj) {
      returnObj = {
        readyState: obj.readyState,
        response: obj.responseJSON ? obj.responseJSON : logAny(obj.responseText, 0, 100),
        status: obj.status
      }
    } else if (typeof obj.xhr == 'function') {
      returnObj = {
        url: obj.url,
        type: obj.type,
        dataType: obj.dataType
      }
    } else {
      for (var j in obj) {
        returnObj[j] = logDepth(obj[j], depth);
      }
    }
  } else {
    var _obj;
    try{ _obj = JSON.stringify(obj) } catch(e){}
    if (!_obj) {
      try{ _obj = String(obj) } catch(e){}
    }
    REPORTER.send({
      t: 'reporter',
      n: 'unknown_type',
      f: 'reporter',
      d: _obj
    })
  }
  return returnObj;
}

function logDepth(obj, depth) {
  if (typeof obj != 'function') {
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
    returnObj.push('#'+node.id);
  }
  if (node.className) {
    returnObj.push('.'+node.className.split(' ').join('.'));
  }
  returnObj.push('>');
  return returnObj.join(' ');
}

module.exports = myAwsomelogger;
