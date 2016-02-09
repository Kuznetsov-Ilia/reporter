exports.__esModule = true;
exports.default = _logger;

var _global = require('global');

var _global2 = _interopRequireDefault(_global);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var now = Date.now === undefined ? function () {
  return Number(new Date());
} : Date.now;
function _logger() {
  var _this = this;

  this.log = [];
  _global2.default.on('log:show', function () {
    return _this.show();
  });
}
_logger.prototype.set = function (group, name, data) {
  if (this.log.length > 998) {
    this.log.shift();
  }
  var d = '';
  if (typeof data === 'object' && data !== null && !data.originalEvent && !data.context && ['[object Object]', '[object Array]'].indexOf(data.toString() !== -1)) {
    try {
      d = JSON.stringify(data, null, ' ');
    } catch (e) {
      _global2.default.radar('debug', 'JSONstringify', {
        stringify: JSON.stringify({
          ht: now() - _global2.default.HEAD_TIME,
          keys: Object.keys(data),
          e: String(e)
        })
      });
    }
  }
  this.log.push({
    group: String(group),
    name: String(name),
    date: now(),
    data: d
  });
};
_logger.prototype.show = function () {
  var strUrl = '/debugger.html';
  var winName = 'debugger' + Math.random();
  var logs = this.log;
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