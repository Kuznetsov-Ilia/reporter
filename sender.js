'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _global = require('global');

var _global2 = _interopRequireDefault(_global);

var _miscUtils = require('misc/utils');

var SEND = 'sendBeacon' in _global2['default'] ? function (url, data) {
  var _url, _data;
  if (_miscUtils.isObject(url)) {
    _url = url.url;
    _data = url.data;
  } else {
    _url = url;
    _data = data;
  }
  if (_miscUtils.isObject(_data)) {
    var formData = new FormData();
    for (var key in _data) {
      formData.append(key, _data[key]);
    }
    _data = formData;
  }
  setTimeout(function () {
    _global2['default'].sendBeacon(_url, _data);
  }, 0);
} : function (url, data) {
  var _url, _data, _uri;
  if (_miscUtils.isObject(url)) {
    _url = url.url;
    _data = url.data;
  } else {
    _url = url;
    _data = data;
  }
  if (_data) {
    var aParams = [];
    for (var i in _data) {
      aParams.push([i, _data[i]].join('='));
    }
    var params = aParams.join('&');
    _uri = [_url, params].join('?');
  } else {
    _uri = _url;
  }
  if (_uri) {
    setTimeout(function () {
      new Image().src = _uri;
    }, 0);
  }
};

exports['default'] = SEND;
module.exports = exports['default'];