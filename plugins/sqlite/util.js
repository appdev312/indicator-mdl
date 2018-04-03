var util = require('../../core/util.js');
var config = util.getConfig();
console.log("plugins/sqlite/util: ", util.getConfig().watch);
var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyPath: config.sqlite.dataDirectory
}

module.exports = {
  settings: settings,
  table: function(name) {
    return [name, settings.pair.join('_')].join('_');
  }
}