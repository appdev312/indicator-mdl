var _ = require('lodash');
var mongojs = require('mongojs');

var config = require('../../web/routes/baseConfig');
const util = require(__dirname + '/../../core/util');
var dirs = util.dirs();
var handle = require('./handle');

var NimbusStore = function(collectionName) {
  _.bindAll(this);

  this.db = handle;
  this.nimbusCollection = this.db.collection('nimbus_bots');
}

NimbusStore.prototype.writeNimbus = function(nimbus) {
  this.nimbusCollection.insert({
    nimbusId: nimbus.id,
    nimbus: JSON.stringify(nimbus)
  }, function(err) {
    if (err) {
      console.log("writeNimbus:", err);
    }
  });
}

NimbusStore.prototype.updateNimbus = function(nimbus) {
  this.nimbusCollection.update(
    { nimbusId: nimbus.id },
    { $set: { nimbus: JSON.stringify(nimbus) } },
    function(err) {
      if (err) {
        console.log("updateNimbus:", err);
      }
    }
  );
}

NimbusStore.prototype.deleteNimbus = function(id) {
  this.nimbusCollection.remove(
    { nimbusId: id },
    function(err) {
      if (err) {
        console.log("deleteNimbus:", err);
      }
    }
  );
}

NimbusStore.prototype.getAllNimbus = function(cb) {
  this.nimbusCollection.find(function (err, nimbusBots) {
    if (err) {
      return cb([]);
    }

    cb(nimbusBots);
  });
}

module.exports = NimbusStore;