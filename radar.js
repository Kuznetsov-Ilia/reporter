'use strict';

exports.__esModule = true;

var _miscUtils = require('misc/utils');

exports['default'] = Radar;

function Radar(project, host, customTransform, releaseID) {
  this.project = project;
  this.host = host;
  this.customTransform = customTransform;
  this.releaseID = releaseID;
}
_miscUtils.extend(Radar.prototype, {
  get: function get(input) {
    var data = {};
    data.p = input.p || this.project;
    data.t = input.t || '';
    data.v = input.v || 1;

    if (input.n) {
      var i = input.n;
      if (_miscUtils.isString(i)) {
        i += ':1';
      } else if (_miscUtils.isArray(i) && !_miscUtils.isObject(i[0])) {
        i = i.join(':1,') + ':1';
      } else {
        i = i.map(encode).join(',');
      }
      data.i = i;
    }

    if (input.f) {
      var msg = [];
      if (this.releaseID) {
        msg.push(this.releaseID);
      }
      if (data.i) {
        msg.push(data.i);
      }
      if (input.d) {
        if (_miscUtils.isObject(input.d)) {
          msg.push(JSON.stringify(input.d));
        } else if (_miscUtils.isString(input.d)) {
          msg.push(input.d);
        } else if (_miscUtils.isArray(input.d)) {
          msg.push(input.d.join(','));
        }
        data.rlog_message = msg;

        if (this.customTransform) {
          this.customTransform(data, input);
        }
      }
    }
    return {
      url: this.host,
      data: data
    };
  }
});

function encode(value, key) {
  if (_miscUtils.isObject(value)) {
    var _v = value.v;
    var _k = value.k;
    return _k + ':' + encodeURIComponent(_v);
  } else {
    return key + ':' + encodeURIComponent(value);
  }
}
module.exports = exports['default'];