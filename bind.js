var logKeys = [0, 0, 0, 0];
var kombos;
var LOG;
export default function (_LOG, keys) {
  kombos = keys;
  LOG = _LOG;
  /*kombo.push(keys.join(''));
  keys.forEach(function(key){

  })*/
 // document.on('keydown', keyDownHandler);
}

function keyDownHandler (e) {
  logKeys.shift();
  logKeys.push(e.which);
  setTimeout(function () {
    logKeys.shift();
    logKeys.push(0);
  }, 1000);
  if (kombos.indexOf(logKeys.join('')) !== -1) {
    console.log('comming soon');
    LOG.show();
  }
}
