import window from 'global';
const now = Date.now === undefined ? () => Number(new Date()) : Date.now;
export default function _logger() {
  this.log = [];
  window.on('log:show', () => this.show());
}
_logger.prototype.set = function(group, name, data) {
  if (this.log.length > 998) {
    this.log.shift();
  }
  var d = '';
  if (typeof data === 'object' && data !== null && !data.originalEvent &&
    !data.context &&
    ['[object Object]', '[object Array]'].indexOf(data.toString() !== -1)
  ) {
    try {
      d = JSON.stringify(data, null, ' ');
    } catch(e) {
      window.radar('debug', 'JSONstringify', {
        stringify: JSON.stringify({
          ht: now() - window.HEAD_TIME,
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
_logger.prototype.show = function() {
  var strUrl = '/debugger.html';
  var winName = 'debugger' + Math.random();
  var logs = this.log;
  var wdegugger = window.open(strUrl, winName);
  setTimeout(sendLogs, 300);
  function sendLogs() {
    if (wdegugger) {
      wdegugger.renderLogs(logs);
    } else {
      setTimeout(sendLogs, 300);
    }
  }
};
