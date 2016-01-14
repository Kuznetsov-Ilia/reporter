(function (window, release_id) {
  var url = '//otvet.radar.imgsmail.ru/update';
  var project = 'otvet';
  var loaded = 'before';
  var errTypes = ['EvalError', 'InternalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError'];
  var blackList = ['zStartIndexer', 'evalSmlo', 'SwfStore', 'DealPly', 'Object.parse', 'Script error', 'night_mode_disable', 'atomicFindClose', 'captureReady', 'Недостаточно места на диске', 'MailRuApi is not defined', 'getLoginButtonSignatureCodes', 'clearOverlappingSelection', 'onReceivedTouchIcons', 'The system cannot find the path specified', 'SelectedDivWithSearchText', '\'ucwp\' is undefined', '__gCrWeb'];
  var send = 'sendBeacon' in navigator ? viaSendBeacon : viaImg;
  var isArray = Array.isArray ? Array.isArray : function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
  var bro;
  var platform;
  window.onload = function () {
    loaded = 'after';
  };
  window.onerror = function (message, filename, lineno, colno, errorObject) {
    var err = ensure(message, filename, lineno, colno, errorObject);
    var interval = [];
    if (isUndefined(bro)) {
      bro = getBro();
    }
    if (isUndefined(platform)) {
      platform = getPlatform();
      if (platform === 'unknown' && navigator.userAgent) {
        radar('debug', 'unknown-platform', { platform: navigator.userAgent });
      }
    }
    if (bro[0]) {
      interval.push(bro[0]);
    }
    if (bro[1]) {
      interval.push('' + bro.join('-'));
    }
    if (platform && platform !== 'unknown') {
      interval.push(platform);
    }
    if (check(err.message)) {
      var _parse = parse(err);

      var msg = _parse.msg;
      var err_stats = _parse.err_stats;

      radar('error', interval.concat(err_stats, [loaded, release_id]), { error: msg });
    } else {
      radar('error', interval.concat(['garbage', loaded, release_id]));
    }
  };

  function ensure(message, filename, lineno, colno, errorObject) {
    var err = {};
    if (typeof errorObject === 'object') {
      err = {
        colno: isUndefined(errorObject.columnNumber) ? colno : errorObject.columnNumber,
        lineno: isUndefined(errorObject.lineNumber) ? lineno : errorObject.lineNumber,
        filename: isUndefined(errorObject.fileName) ? filename : errorObject.fileName,
        message: isUndefined(errorObject.message) ? message : errorObject.message,
        stack: errorObject.stack
      };

      for (var i = 0, l = errTypes.length; i < l; i++) {
        if (window[errTypes[i]] && errorObject instanceof window[errTypes[i]]) {
          err.type = i;
          break;
        }
      }
    } else if (typeof message === 'object') {
      err = message;
    } else {
      err = {
        colno: colno,
        lineno: lineno,
        filename: filename,
        message: message
      };
    }

    if (!err.stack) {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(errorObject, ensure);
        err.stack = errorObject.stack;
      } else {
        err.stack = new Error().stack;
      }
      if (err.stack) {
        // remove one stack level:
        if (!isUndefined(window.Components)) {
          // Mozilla:
          err.stack = err.stack.substring(err.stack.indexOf('\n') + 1);
        } else if (!isUndefined(window.chrome)) {
          // V8:
          err.stack = err.stack.replace(/\n[^\n]*/, '');
        }
      }
    }
    if (err.stack) {
      err.stack = err.stack.substr(0, 500);
    }
    return err;
  }

  function isUndefined(a) {
    return a === undefined;
  }

  function parse(err) {
    var msg = [];
    var interval = [];
    var props = ['message', 'filename', 'lineno', 'colno', 'stack', 'type'];
    for (var i = 0, l = props.length; i < l; i++) {
      var property = props[i];
      if (isUndefined(err[property])) {
        interval.push('no_' + property);
      } else {
        msg.push(property.slice(0, 1) + ':' + property);
      }
    }
    msg = msg.join(',');
    return {
      msg: msg, interval: interval
    };
  }

  function check(message) {
    if (message && typeof message === 'string') {
      for (var i = 0, l = blackList.length; i < l; i++) {
        if (message.match(blackList[i])) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  function radar(t, i, r) {
    var title = t;
    var value = 1;
    var interval;
    var filename;
    var message;

    if (typeof t === 'object') {
      for (var k in t) {
        if (t.hasOwnProperty(k)) {
          title = k;
          value = t[k];
        }
      }
    }
    var intervalType = typeof i;
    switch (intervalType) {
      case 'string':
        interval = i + ':1';
        break;
      case 'object':
        if (isArray(i)) {
          interval = i.join(':1,') + ':1';
        } else {
          interval = [];
          for (var k in i) {
            if (i.hasOwnProperty(k)) {
              interval.push(k + ':v');
            }
          }
          interval = interval.join(',');
        }
        break;
      default:
        title = 'fuckup';
        value = 1;
        interval = 'reporter';
        r = {
          fuckup: 'no case to handle interval type ' + intervalType
        };
        break;
    }

    if (typeof r === 'object') {
      for (var k in r) {
        if (r.hasOwnProperty(k)) {
          filename = 'otvet-' + k;
          message = r[k];
        }
      }
    }

    var data = {
      p: project,
      t: title,
      v: value
    };
    if (interval) {
      data.i = interval;
    }
    if (filename) {
      data.rlog = filename;
      data.rlog_message = message;
      data.email = window.CURRENT_USER ? window.CURRENT_USER.email : '';
      data.ua = 1;
    }

    send(data);
  }

  function viaSendBeacon(data) {
    if (typeof data === 'object') {
      var realData = JSON.stringify(data);
      var stats = JSON.stringify({
        p: project,
        t: 'kaktam',
        v: 1,
        i: 'sendBeacon:1'
      });
      setTimeout(function () {
        navigator.sendBeacon(url, realData);
        navigator.sendBeacon(url, stats);
      }, 0);
    }
  }

  function viaImg(data) {
    if (typeof data === 'object') {
      var img = new Image();
      img.onerror = function () {
        return radar('kaktam', 'error');
      };
      img.onload = function () {
        return radar('kaktam', 'load');
      };
      var params = [];
      for (var i in data) {
        params.push(i + '=' + data[i]);
      }
      var uri = url + '?' + params.join('&');
      setTimeout(function () {
        return img.src = uri;
      }, 0);
    }
  }

  function getBro() {
    var ua = navigator.userAgent;
    var tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
      if (tem != null) {
        return tem.slice(1).join(' ').replace('OPR', 'Opera');
      }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) {
      M.splice(1, 1, tem[1]);
    }

    return M;
  }
  function getPlatform() {
    var ua = navigator.userAgent;
    if (ua.match(/windows|win32/)) {
      return 'win';
    } else if (ua.match(/macintosh|mac os x/)) {
      return 'mac';
    } else if (ua.match(/linux/)) {
      return 'linux';
    } else if (ua.match(/adobeair/)) {
      return 'adobeair';
    } else {
      return 'unknown';
    }
  }
})(window, RELEASE_ID);