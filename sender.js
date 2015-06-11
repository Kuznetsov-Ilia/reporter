import {isObject} from 'misc/utils';

var SEND = 'sendBeacon' in navigator ?
  function (url, data) {
    var _url, _data;
    if (isObject(url)) {
      _url = url.url;
      _data = url.data;
    } else {
      _url = url;
      _data = data;
    }
    if (isObject(_data)) {
      var formData = new FormData();
      for (var key in _data) {
        formData.append(key, _data[key]);
      }
      _data = formData;
    }
    setTimeout(function () {
      navigator.sendBeacon(_url, _data);
    }, 0);
  } :
  function (url, data) {
    var _url, _data, _uri;
    if (isObject(url)) {
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
        (new Image()).src = _uri;
      }, 0);
    }
  };

export default SEND;
