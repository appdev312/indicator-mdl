const fork = require('child_process').fork;
const moment = require('moment');

function startScan(watches, strategies, baseConfig) {
  const child = fork(__dirname + '/child');

  child.on('message', function(m) {
    if (m.type === 'ready') {
      return child.send({ type: 'start', watches: watches, strategies: strategies, baseConfig: baseConfig });
    } else if (m.type === 'complete') {
      child.send({ type: 'exit' });

      setTimeout(() => {
        startScan(watches, strategies, baseConfig, moment());
      }, 12 * 60 * 60 * 1000);

      return;
    }
  });
}

module.exports = function(watches, strategies, baseConfig) {
  startScan(watches, strategies, baseConfig);
}
