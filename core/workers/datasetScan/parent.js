var fork = require('child_process').fork;

var util = require('../../util');
var dirs = util.dirs();

var startScan = (config, callback, done) => {
  var adapter = config[config.adapter];
  var scan = require(dirs.gekko + adapter.path + '/scanner');

  scan((err, markets) => {
    if (err) {
      return done(err);
    }

    var child = fork(__dirname + '/child');
    child.on('message', function(m) {
      if (m.type === 'ready') {
        return child.send({ type: 'markets', markets: markets, config: config });
      } else if (m.type === 'dataset' && m.signal === 'complete') {
        child.send({ type: 'exit' });

        // re-launch after 10 minutes
        setTimeout(() => {
          startScan(config, callback, done);
        }, 10 * 60 * 1000);
        return;
      } else {
        callback(m);
      }
    });

    done(null, markets);
  });
}

module.exports = function(config, callback, done) {
  util.setConfig(config);
  startScan(config, callback, done);
}
