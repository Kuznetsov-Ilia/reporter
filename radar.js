import {isObject, isString, isArray} from 'misc/utils';
export default class Radar {
  constructor (project, host, customTransform) {
    this.project = project;
    this.host = host;
    this.customTransform = customTransform;
  }

  get (input) {
    var data = {};
    data.p = input.p || this.project;
    data.t = input.t || '';
    data.v = input.v || 1;

    if (input.n) {
      var i = input.n;
      if (isString(i)) {
        i += ':1';
      } else if (isArray(i) && !isObject(i[0])) {
        i = i.join(':1,') + ':1';
      } else {
        i = i.map(encode).join(',');
      }
      data.i = i;
    }

    if (input.f) {
      var msg = [];
      if (data.i) {
        msg.push(data.i);
      }
      if (input.d) {
        if (isObject(input.d)) {
          msg.push(JSON.stringify(input.d));
        } else if (isString(input.d)) {
          msg.push(input.d);
        } else if(isArray(input.d)) {
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
}

function encode (value, key) {
  if (isObject(value)) {
    var _v = value.v;
    var _k = value.k;
    return _k + ':' + encodeURIComponent(_v);
  } else {
    return key + ':' + encodeURIComponent(value);
  }
}
