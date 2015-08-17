export default function(cb) {
  return function (event, xhr, settings, exception) {
    var data = {};
    if (exception) {
      data.exception = exception;
    }
    if (settings) {
      if (settings.url) {
        data.url = settings.url;
      }
      if (settings.type) {
        data.type = settings.type;
      }
    }
    if (xhr) {
      if (xhr.status) {
        data.status = xhr.status;
      }
      data.responseText = String(xhr.responseText);
    }
    cb(data);
  };
}
