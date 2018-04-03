var _ = require('lodash');
var mongojs = require('mongojs');
var moment = require('moment');

var config = require('../../web/routes/baseConfig');
const util = require(__dirname + '/../../core/util');
util.setConfig(config);
var handle = require('./handle');

var IndicatorStore = function(collectionName) {
  _.bindAll(this);

  this.db = handle;
  this.indicatorCollection = this.db.collection('indicators');
}

IndicatorStore.prototype.writeIndicator = function(indicator) {
  var mIndicator = {
    exchange: indicator.exchange,
    currency: indicator.currency,
    asset: indicator.asset,
    params: indicator.params,
    created: moment().unix(),
  };

  this.indicatorCollection.findAndModify({
    query: {
      exchange: mIndicator.exchange,
      currency: mIndicator.currency,
      asset: mIndicator.asset,
    },
    update:{ $set: mIndicator },
    upsert: true
  }, function(err) {
    if (err) {
      console.log("writeIndicator:", err);
    }
  });
}

IndicatorStore.prototype.getAllIndicators = function(cb) {
  this.indicatorCollection.find(function (err, indicators) {
    if (err) {
      return cb([]);
    }

    if (cb) {
      cb(null, indicators);
    }

    return indicators;
  });
}

module.exports = IndicatorStore;
