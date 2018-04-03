const collectConfig = require('./collectMarketDataConfig');
const scan = require('../../../core/workers/collectMarketData/parent');
const base = require('../../routes/baseConfig');

module.exports = function() {
  scan(collectConfig, base);
}
