const fork = require('child_process').fork;
const moment = require('moment');

function startScan(collectConfig, baseConfig, current) {
  var child = fork(__dirname + '/child');

  child.on('message', function(m) {
    if (m.type === 'ready') {
      return child.send({ type: 'start', collectConfig: collectConfig, baseConfig: baseConfig, current: current.valueOf() });
    } else if (m.type === 'complete') {
      child.send({ type: 'exit' });

      var exitMoment = moment();
      setTimeout(() => {
        startScan(collectConfig, baseConfig, moment());
      }, 23 * 60 * 60 * 1000 - (exitMoment.valueOf() - current.valueOf()));

      return;
    }
  });
}

module.exports = function(collectConfig, baseConfig) {
  startScan(collectConfig, baseConfig, moment());
}
