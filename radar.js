exports.__esModule = true;

var _utils = require('misc/utils');

exports.default = Radar;

function Radar(project, host, customTransform, releaseID) {
  this.project = project;
  this.host = host;
  this.customTransform = customTransform;
  this.releaseID = releaseID;
}
(0, _utils.extend)(Radar.prototype, {
  get: function get(input) {
    var data = {};
    data.p = input.p || this.project;
    data.t = input.t || '';
    data.v = input.v || 1;
    if (input.n) {
      var i = input.n;
      if ((0, _utils.isString)(i) || (0, _utils.isNumber)(i)) {
        i += ':1';
      } else if ((0, _utils.isArray)(i) && !(0, _utils.isObject)(i[0])) {
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
        if ((0, _utils.isObject)(input.d)) {
          msg.push(JSON.stringify(input.d));
        } else if ((0, _utils.isString)(input.d)) {
          msg.push(input.d);
        } else if ((0, _utils.isArray)(input.d)) {
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
  if ((0, _utils.isObject)(value)) {
    var _v = value.v;
    var _k = value.k;
    return _k + ':' + encodeURIComponent(_v);
  } else {
    return key + ':' + encodeURIComponent(value);
  }
}