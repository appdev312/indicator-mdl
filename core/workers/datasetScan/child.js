var _ = require('lodash');
var async = require('async');

var dateRangeScan = require('../dateRangeScan/parent');

var start = (config, markets) => {
  async.mapSeries(markets, (market, next) => {

    let marketConfig = _.clone(config);
    marketConfig.watch = market;

    dateRangeScan(marketConfig, (err, ranges) => {
      if (err) {
        process.send({ type: 'dataset', signal: 'error', error: err });
        return next();
      }

      market.ranges = ranges;
      process.send({ type: 'dataset', signal: 'market', market: market });
      
      next();
    });

  }, err => {
    process.send({ type: 'dataset', signal: 'complete' });
  });
}

process.send({ type: 'ready' });

process.on('message', function(m) {
  if (m.type === 'markets') {
    start(m.config, m.markets);
  } else if (m.type === 'exit') {
    process.exit(0);
  }
});

process.on('disconnect', function() {
  process.exit(-1);
});
