var _global = require('global');

var _global2 = _interopRequireDefault(_global);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api = { stillLoading: 1 };
if (_global2.default.performance && _global2.default.performance.timing) {
  var TIMING = _global2.default.performance.timing;
  // All times are relative times to the start time within the
  // same objects
  var firstPaint = 0;
  var CHROME = _global2.default.chrome;

  if (TIMING.loadEventEnd - TIMING.navigationStart < 0) {
    //Page is still loading - please try again when page is loaded
    api.stillLoading = 1;
  } else {
    delete api.stillLoading;
  }

  // Chrome
  if (CHROME && CHROME.loadTimes) {
    var loadTimes = CHROME.loadTimes();
    // Convert to ms
    firstPaint = loadTimes.firstPaintTime * 1000;
    api.firstPaintTime = firstPaint - loadTimes.startLoadTime * 1000;
  }
  // IE
  else if (typeof TIMING.msFirstPaint === 'number') {
      api.firstPaintTime = TIMING.msFirstPaint - TIMING.navigationStart;
    }
  // Firefox
  // This will use the first times after MozAfterPaint fires
  /*else if (TIMING.navigationStart && typeof InstallTrigger !== 'undefined') {
   api.firstPaint = TIMING.navigationStart;
   api.firstPaintTime = mozFirstPaintTime - TIMING.navigationStart;
  }*/
  api.firstPaint = firstPaint;
  /*
    если один из ресурсов не может быть загружен (забанен в хостах/плагинах) то:
      "domComplete"           0
      "loadEventStart"        0
      "loadEventEnd"          0
  */
  var domComplete = TIMING.domComplete || TIMING.domContentLoadedEventEnd;
  var loadEventStart = TIMING.loadEventStart || TIMING.domContentLoadedEventEnd;
  var loadEventEnd = TIMING.loadEventEnd || TIMING.domContentLoadedEventEnd;

  // Total time from start to load
  api.loadTime = loadEventEnd - TIMING.navigationStart;
  // Time consumed prepaing the new page
  api.readyStart = TIMING.fetchStart - TIMING.navigationStart;
  // Time spent during redirection
  api.redirectTime = TIMING.redirectEnd - TIMING.redirectStart;
  // AppCache
  api.appcacheTime = TIMING.domainLookupStart - TIMING.fetchStart;
  // Time spent unloading documents
  api.unloadEventTime = TIMING.unloadEventEnd - TIMING.unloadEventStart;
  // DNS query time
  api.lookupDomainTime = TIMING.domainLookupEnd - TIMING.domainLookupStart;
  // TCP connection time
  api.connectTime = TIMING.connectEnd - TIMING.connectStart;
  // Time spent during the request
  api.requestTime = TIMING.responseEnd - TIMING.requestStart;
  // Request to completion of the DOM loading
  api.initDomTreeTime = TIMING.domInteractive - TIMING.responseEnd;
  // Load event time
  api.loadEventTime = loadEventEnd - loadEventStart;
  // Dom content loading
  api.domContentLoading = TIMING.domContentLoadedEventStart - TIMING.domLoading;
  //
  api.domProcessing = domComplete - TIMING.domLoading;
  // Time spent constructing the DOM tree
  api.domReadyTime = domComplete - TIMING.domInteractive;
  //
  api.timeToFirstByte = TIMING.responseStart - TIMING.navigationStart;
}

module.exports = api;