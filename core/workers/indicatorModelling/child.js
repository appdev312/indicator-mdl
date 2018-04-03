const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const toml = require('toml');
const promisify = require('tiny-promisify');

const indicatorStore = require('../../../plugins/mongodb/indicator');
const indicatorDB = new indicatorStore();
const pipelineRunner = promisify(require('../pipeline/parent'));
const dateRangeScan = require('../dateRangeScan/parent');

function cartesianProductOf() {
  return _.reduce(arguments, function(a, b) {
      return _.flatten(_.map(a, function(x) {
          return _.map(b, function(y) {
              return x.concat([y]);
          });
      }), true);
  }, [ [] ]);
}

function strategyNames(strategies) {
  return _.map(strategies, 'name');
}

function getBackTestResultForStrat(watch, stratName, candleSize, short, long, signal, next) {
  next(null, { result: null });
}

var start = (watches, strategies, baseConfig) => {
  const combinationsPerWatch = cartesianProductOf(
    strategyNames(strategies),
    _.range(1, 5), // candle size
    _.range(3, 16), // short
    _.range(14, 41), // long
    _.range(6, 13) // signal
  );
  const UNDEFINED_REPROFIT = -1000000;

  /**
   * build config for performing backtest
   */
  const getConfig = (combination, watch) => {
    let config = {};

    Object.assign(
      config,
      baseConfig,
      { watch: watch },
      {
        tradingAdvisor: {
          enabled: true,
          method: combination[0],
          candleSize: combination[1] * 60,
          historySize: 10
        }
      },
    );

    let strat = _.find(strategies, { name: combination[0] }),
      stratParams = {};

    try {
      stratParams = toml.parse(strat.params);
    } catch(e) { }

    if (strat.empty) {
      config[combination[0]] = { __empty: true };
    }
    else {
      config[combination[0]] = stratParams;
    }

    config[combination[0]].long = combination[3];
    config[combination[0]].short = combination[2];
    config[combination[0]].signal = combination[4];

    return config;
  }

  /**
   * perform backtest
   */
  const performBacktest = async (index, watch, maxCombination, prevMaxProfit, next) => {  
    if (index < combinationsPerWatch.length) {
      const config = getConfig(combinationsPerWatch[index], watch);

      dateRangeScan(config, async (err, ranges) => {
        if (err || ranges.length === 0) {
          setTimeout(() => {
            performBacktest(index + 1, watch, maxCombination, prevMaxProfit, next);
          }, 0);
          return;
        }

        // set proper range
        Object.assign(
          config,
          {
            backtest: {
              daterange: { from: moment.unix(ranges[0].from).utc().format(), to: moment.unix(ranges[0].to).utc().format() },
              batchSize: 50,
            }
          }
        );
        const backtestResult = await pipelineRunner('backtest', config);

        // to get past maximum call stack size limitation
        setTimeout(() => {
          let tmpCombination = combinationsPerWatch[index];
          let tmpProfit = backtestResult.report.relativeProfit;

          if (backtestResult.report.relativeProfit < prevMaxProfit) {
            tmpCombination = maxCombination;
            tmpProfit = prevMaxProfit;
          }

          performBacktest(index + 1, watch, tmpCombination, tmpProfit, next);
        }, 0);
      });      
    } else {
      indicatorDB.writeIndicator({
        exchange: watch.exchange,
        currency: watch.currency,
        asset: watch.asset,
        params: {
          strategy: maxCombination[0],
          long: maxCombination[3],
          short: maxCombination[2],
          signal: maxCombination[4],
        }
      });

      next();
    }
  }

  async.mapSeries(
    watches,
    (watch, nextWatch) => {
      // watch: { exchange: XXX, currency: XXX, asset: XXX }
      performBacktest(0, watch, null, -1000000, nextWatch);
    },
    function(err, results) {
      process.send({ type: 'complete'});
    }
  );
}

process.send({ type: 'ready' });

process.on('message', function(m) {
  if (m.type === 'start') {
    start(m.watches, m.strategies, m.baseConfig);
  } else if (m.type === 'exit') {
    process.exit(0);
  }
});

process.on('disconnect', function() {
  process.exit(-1);
});
