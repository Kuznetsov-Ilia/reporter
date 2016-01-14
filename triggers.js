var $ = require('$');
var REPORTER = require('reporter');
$.on('all', function (name, data) {
  REPORTER.log({
    t: 'trigger',
    n: name,
    d: data
  });
});