const _ = require('lodash');
const fs = require('fs');
const toml = require('toml');

const watches = require('./indicatorModellingConfig');
const nimbusRoot = __dirname + '/../../../';
const base = require('../../routes/baseConfig');

const scan = require('../../../core/workers/indicatorModelling/parent');

const parts = {
  paperTrader: 'config/plugins/paperTrader.toml',
  paperPerformanceAnalyzer: 'config/plugins/paperPerformanceAnalyzer.toml',
}

function getStrategies() {
  const strategyDir = fs.readdirSync(nimbusRoot + 'strategies');
  const strats = strategyDir
    .filter(f => _.last(f, 3).join('') === '.js')
    .map(f => {
      return { name: f.slice(0, -3) }
    });

  // for every strat, check if there is a config file and add it
  const stratConfigPath = nimbusRoot + 'config/strategies';
  const strategyParamsDir = fs.readdirSync(stratConfigPath);

  for(let i = 0; i < strats.length; i++) {
    let strat = strats[i];
    if(strategyParamsDir.indexOf(strat.name + '.toml') !== -1)
      strat.params = fs.readFileSync(stratConfigPath + '/' + strat.name + '.toml', 'utf8')
    else
      strat.params = '';
  }

  return strats;
}

function baseConfig() {
  let paperTrader = toml.parse(fs.readFileSync(nimbusRoot + parts.paperTrader, 'utf8'));
  paperTrader.reportRoundtrips = true;
  paperTrader.enabled = true;

  let paperPerformanceAnalyzer = toml.parse(fs.readFileSync(nimbusRoot + parts.paperPerformanceAnalyzer, 'utf8'));
  paperPerformanceAnalyzer.enabled = true;

  let config = {};

  Object.assign(
    config,
    base,
    { silent: false, debug: false },
    { paperTrader: paperTrader },
    { paperPerformanceAnalyzer: paperPerformanceAnalyzer },
    // { watch: { exchange: XXX, currency: XXX, asset: XXX } },
    // tradingAdvisor: {
    //    enabled: true,
    //    method: stratName,
    //    candleSize: candleSize * 60,
    //    historySize: 10
    // },
    // stratName: {
    //    ...stratParams, // or __empty: true
    //    long: XX,
    //    short: XX,
    //    signal: XX,
    // }
    // {
    //      backtest: {
    //          daterange: { from: XX, to: XX }
    //      }
    // },
  );

  return config;
}

module.exports = async function() {
  scan(watches, getStrategies(), baseConfig());
}
