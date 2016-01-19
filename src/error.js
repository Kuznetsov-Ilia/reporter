var release_id = window.RELEASE_ID;
var url = '//otvet.radar.imgsmail.ru/update';
var project = 'otvet';
var loaded = 'before';
var errTypes = [
  'EvalError',
  'InternalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  'AppError'
];
var blackList = [
  'zStartIndexer',
  'evalSmlo',
  'SwfStore',
  'DealPly',
  'Object.parse',
  'Script error',
  'night_mode_disable',
  'atomicFindClose',
  'captureReady',
  'Недостаточно места на диске',
  'MailRuApi is not defined',
  'getLoginButtonSignatureCodes',
  'clearOverlappingSelection',
  'onReceivedTouchIcons',
  'The system cannot find the path specified',
  'SelectedDivWithSearchText',
  '\'ucwp\' is undefined',
  '__gCrWeb'
];
var send = 'sendBeacon' in navigator ? viaSendBeacon : viaImg;
var isArray = Array.isArray ?
    Array.isArray
  : arg => Object.prototype.toString.call(arg) === '[object Array]';
var bro;
var platform;
window.onload = () => loaded = 'after';
window.onerror = (message, filename, lineno, colno, errorObject) => {
  var err = ensure(message, filename, lineno, colno, errorObject);
  var interval = [loaded, release_id];
  if (isUndefined(bro)) {
    bro = getBro();
  }
  if (isUndefined(platform)) {
    platform = getPlatform();
    if (platform === 'unknown' && navigator.userAgent) {
      radar('debug', 'unknown-platform', {
        platform: 'unknown'
      });
    }
  }
  if (bro[0]) {
    interval.push(bro[0]);
  } else {
    radar('debug', 'unknown-bro', { bro: 'unknown' });
  }
  if (bro[1]) {
    interval.push(`${bro.join('-')}`);
  }
  if (platform && platform !== 'unknown') {
    interval.push(platform);
  }
  var { msg, err_stats } = parse(err);
  if (err_stats) {
    interval = interval.concat(err_stats);
  }
  if (interval.indexOf('no_filename') === -1) {
    if (err.filename.match(location.host)) {
      interval.push('internal');
    } else {
      interval.push('external');
    }
  }
  if (interval.indexOf('internal') !== -1 && check(err.message)) {
    if (err.stack && err.stack.indexOf('.js') !== -1) {
      radar('error', interval, { error: msg });
    } else {
      interval.push('not-handable');
      radar('error', interval, { 'not-handable': msg });
    }
  } else {
    interval.push('garbage');
    radar('error', interval);
  }
};
window.AppError = AppError;
window.radar = radar;

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
      err.stack = (new Error()).stack;
    }
    if (err.stack) { // remove one stack level:
      if (!isUndefined(window.Components)) { // Mozilla:
        err.stack = err.stack.substring(err.stack.indexOf('\n') + 1);
      } else if (!isUndefined(window.chrome)) { // V8:
        err.stack = err.stack.replace(/\n[^\n]*/, '');
      }
    }
  }
  if (err.stack) {
    //err.stack = err.stack.substr(0, 500);
  }
  return err;
}

function isUndefined(a) {
  return a === undefined;
}

function parse(err) {
  var msg = [];
  var interval = [];
  var props = ['message', 'filename', 'lineno', 'colno', 'stack'];
  for (var i = 0, l = props.length; i < l; i++) {
    var property = props[i];
    if (isUndefined(err[property])) {
      interval.push(`no_${property}`);
    } else {
      msg.push(`${property.slice(0, 1)}:${err[property]}`);
    }
  }
  msg = msg.join(',');
  return {
    msg, interval
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
  var title;
  var value = 1;
  var interval;
  var filename;
  var message;

  switch (typeof t) {
  case 'string':
  case 'number':
    title = t;
  break;
  case 'object':
    if (isArray(t)) {
      title = t[0];
      value = t[1];
    } else {
      for (var k in t) {
        if (t.hasOwnProperty(k)) {
          title = k;
          value = t[k];
        }
      }
    }
  break;
  default: return;
  }
  switch (typeof i) {
  case 'number':
    interval = `${i}:1`;
  break;
  case 'string':
    if (i.indexOf(':') === -1) {
      interval = `${i}:1`;
    } else {
      interval = i;
    }
    break;
  case 'object':
    if (isArray(i)) {
      if (String(i[0]).indexOf(':') === -1) {
        interval = `${i.join(':1,')}:1`;
      } else {
        interval = i.join(',');
      }
    } else {
      interval = [];
      for (var k in i) {
        if (i.hasOwnProperty(k)) {
          interval.push(`${k}:v`);
        }
      }
      interval = interval.join(',');
    }
    break;
  default: break;
  }

  if (typeof r === 'object') {
    for (var k in r) {
      if (r.hasOwnProperty(k)) {
        filename = `otvet-${k}`;
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
    setTimeout(() => navigator.sendBeacon(url, realData), 0);
  }
}

function viaImg(data) {
  if (typeof data === 'object') {
    var img = new Image();
    img.onerror = () => radar('kaktam', 'error');
    img.onload = () => radar('kaktam', 'load');
    var params = [];
    for (var i in data) {
      params.push(`${i}=${data[i]}`);
    }
    var uri = `${url}?${params.join('&')}`;
    setTimeout(() => img.src = uri.substr(0, 2000), 0);
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
  if (ua.match(/windows|win32/i)) {
    return 'win';
  } else if (ua.match(/macintosh|mac os x/i)) {
    return 'mac';
  } else if (ua.match(/linux/i)) {
    return 'linux';
  } else if (ua.match(/adobeair/i)) {
    return 'adobeair';
  } else if (ua.match(/Android/i)) {
    return 'android';
  } else if (ua.match(/PlayStation/i)) {
    return 'playstation';
  } else if (ua.match(/Nintendo/i)) {
    return 'nintendo';
  } else if (ua.match(/Symbian|SymbOS/i)) {
    return 'symbian';
  } else if (ua.match(/Nokia/i)) {
    return 'nokia';
  } else if (ua.match(/Opera Mini/i)) {
    return 'operamini';
  } else if (ua.match(/Mobile/i)) {
    return 'mobile';
  } else {
    return 'unknown';
  }
}


function AppError(message, data) {
  var err = new Error();
  if (err.stack) {
    // remove one stack level:
    if (typeof (Components) != 'undefined') {
      // Mozilla:
      this.stack = err.stack.substring(err.stack.indexOf('\n') + 1);
    } else if (typeof (chrome) != 'undefined' || typeof (process) != 'undefined') {
      // Google Chrome/Node.js:
      this.stack = err.stack.replace(/\n[^\n]*/, '');
    } else {
      this.stack = err.stack;
    }
  }
  if (typeof data === 'object') {
    if (!message) {
      message = '';
    }
    message += ` : ${JSON.stringify(data)}`;
  }
  this.message = message === undefined ? err.message : message;
  this.fileName = err.fileName;
  this.lineNumber = err.lineNumber;
}

AppError.prototype = new Error();
AppError.prototype.constructor = AppError;
AppError.prototype.name = 'AppError';

