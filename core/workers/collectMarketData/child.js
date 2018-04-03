const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const promisify = require('tiny-promisify');

var util = require('../../util');
var dirs = util.dirs();

const pipelineRunner = promisify(require(dirs.core + 'workers/pipeline/parent'));

function importPair(param, base, cb) {
  let mode = 'importer',
      config = {},
      errored = false;

  _.merge(config, base, param);
  console.log("workers/collectMarketData/child/importPair: ", config.watch);
  
  pipelineRunner(mode, config, (err, event) => {
    if (errored) {
      return;
    }

    if (err) {
      errored = true;
      cb(err);
    }
    
    if (event && event.done) {
      cb(null, { success: true });
    }
  });
}

var start = (collectConfig, baseConfig, current) => {
  _.each(collectConfig, exchange => {
    async.mapSeries(exchange.pairs, function({ currency, asset }, cb) {
      const importParam = {
        "watch": {
          "exchange": exchange.exchange,
          "currency": currency,
          "asset": asset
        },
        "importer": {
          "daterange": {
            "from": moment(current).add(-24, 'hours').format('YYYY-MM-DD HH:mm'),
            "to": moment(current).format('YYYY-MM-DD HH:mm')
          }
        },
        "candleWriter": {
          "enabled": true
        }
      };

      importPair(importParam, baseConfig, cb);
    }, function(err, results) {
      console.log("workers/collectMarketData/child: ", `Finished collecting market data for ${moment().format('YYYY-MM-DD')}.`);
      process.send({ type: 'complete'});
    });
  });
}

process.send({ type: 'ready' });

process.on('message', function(m) {
  if (m.type === 'start') {
    start(m.collectConfig, m.baseConfig, m.current);
  } else if (m.type === 'exit') {
    process.exit(0);
  }
});

process.on('disconnect', function() {
  process.exit(-1);
});
