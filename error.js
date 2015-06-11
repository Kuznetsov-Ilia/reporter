import REPORTER from './index';
import {isArray} from 'misc/utils';
// grep -v 'Permission denied to access property' fuckup-in-debugger.log | grep -v 'Недостаточно памяти' | grep -v 'Uncaught illegal access' | grep -v 'out of memory' | less
var isNotValid = function(value) {
  return value === undefined ? true : [
      null, true, false, '', 0, '0', 1, '1', 'null', 'undefined', 'true', 'false'
    ].indexOf(value) !== -1;
};
var internalFileNamePattern;

var errMap;
export default function(_internalFileNamePattern, _errMap) {
  internalFileNamePattern = _internalFileNamePattern;
  errMap = _errMap;
  window.onerror = onerrorHandler;
}

function handleFilename(filename, names) {
  var rlog;
  if (internalFileNamePattern.test(filename)) {
    if (filename.includes(window.location.host)) {
      rlog = 'internal';
      names.push('internal');
    } else {
      rlog = 'portal';
      names.push('portal');
    }
  } else {
    rlog = 'external';
    names.push('external');
  }
  return rlog;
}

function matches (stack) {
  return function (conf) {
    if (conf.includes) {
      if (isArray(conf.includes)) {
        return conf.includes.some((inc) => stack.includes(inc));
      } else {
        return stack.includes(conf.includes);
      }
    } else if (conf.excludes) {
      return !stack.includes(conf.excludes);
    } else if (conf.test) {
      return conf.test.test(stack);
    }
  };
}

function handleError(error, names) {
  var rlog;
  var addMgs = '';
  var stack = '';
  if (isNotValid(error.stack)) {
    names.push('no-stack');
  } else {
    names.push('msg');
    stack = error.stack.trim();
    var matched = errMap.find(matches(stack));
    if (matched) {
      rlog = matched.filename;
      names = names.concat(matched.tags);
      addMgs = matched.info ? matched.info() : '';
      if (matched.ftags) {
        names.push(matched.ftags(stack));
      }
    } else {
      rlog = 'other';
      names.push('other');
    }
    if (!stack.includes('.js')) {
      if (names.includes('internal')) {
        names.splice(names.indexOf('internal'), 1);
      }
      names.push('not-handlable');
      rlog = 'not-handlable';
    }
  }
  var msg = addMgs + stack;
  return [rlog, msg];
}

function onerrorHandler(message, filename, lineno, colno, error) {
  var msg = '';
  var rlog;
  var names = [];
  try {
    if (isNotValid(message)) {
      names.push('no-error-message');
    } else {
      msg += message;
    }
    if (isNotValid(filename)) {
      names.push('no-error-filename');
    } else {
      if (navigator.userAgent.search('Firefox') != -1 && message === 'Error loading script') {
        // Firefox generates this error when leaving a page before all scripts have finished loading
        names.push('ff-Error-loading-script', 'script-not-loaded');
      } else if (message === 'Script error') {
        names.push('script-error', 'script-not-loaded');
        
        /*
         Script error
         Error loading script
         SyntaxError 
         ReferenceError 
         TypeError 
         DOM Exception 
         is not a constructor 
         Invalid procedure call or argument 
         is null or not an object 
         Объект не поддерживает это свойство или метод 
         Object doesn't support this property or method
         Uncaught SyntaxError: Unexpected token d

        */
      } else if (message === 'Uncaught SyntaxError: Unexpected token d') {
        names.push('Unexpected-token-d');
        rlog = 'logger';
      } else {
        rlog = handleFilename(filename, names)
      }
      msg += ' f:' + filename;
    }
    if (isNotValid(lineno)) {
      names.push('no-error-lineno');
    } else {
      msg += ' l:' + lineno;
    }
    if (isNotValid(colno)) {
      names.push('no-error-colno');
    } else {
      msg += ' c:' + colno;
    }
    if (isNotValid(error)) {
      names.push('no-error-object');
      if (names.includes('internal')) {
        if (isNotValid(lineno) || isNotValid(colno) || !message.includes('.js')) {// can`t deal with it
          names.splice(names.indexOf('internal'), 1);
        } else { // deal with it
          msg = message + ' ' + [filename, lineno, colno].join(':')
        }
      }
    } else {
      if (names.includes('internal')) {
        // доп фильтрация в handleError
        names.splice(names.indexOf('internal'), 1);
        var he = handleError(error, names);
        rlog = he[0];
        msg = he[1] ? he[1] : msg;
      }
      // хз может и нада куда-нить логировать портальные ошибки
    }
  } catch (e) {
    rlog = 'fuckup-in-debugger';
    names.push('fuckup-in-debugger');
    msg = String(e).trim();
  } finally {
    if (names.includes('internal')) {
      $.ua.getBro();
      names.push($.ua.bro, $.ua.platform);
      if ($.ua.ver) {
        names.push($.ua.ver);
      }
    }
    REPORTER.send({
      t: 'debug',
      n: names,
      d: msg,
      f: rlog
    });
  }
}
