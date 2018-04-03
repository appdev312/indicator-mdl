var _ = require('lodash');
var sqlite3 = require('sqlite3');

var config = require('../../web/routes/baseConfig');
var util = require('../../core/util.js');
var dirs = util.dirs();

var NimbusStore = function(name) {
  _.bindAll(this);

  this.db = this.openDB(name);
  this.upsertTable();
}

NimbusStore.prototype.openDB = function(name) {
  var journalMode = config.sqlite.journalMode || 'PERSIST';
  var syncMode = journalMode === 'WAL' ? 'NORMAL' : 'FULL';
  var version = config.sqlite.version;
  var fullPath = dirs.gekko + config.sqlite.dataDirectory + '/' + name + '_' + version + '.db';

  var db = new sqlite3.Database(fullPath);
  db.run('PRAGMA synchronous = ' + syncMode);
  db.run('PRAGMA journal_mode = ' + journalMode);
  db.configure('busyTimeout', 1500);

  return db;
}

NimbusStore.prototype.upsertTable = function() {
  var createTable = function() {
    this.db.run(
      `
        CREATE TABLE IF NOT EXISTS
        nimbus (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nimbusId TEXT NOT NULL,
          nimbus TEXT NOT NULL
        );
      `
    );
  };

  this.db.serialize(_.bind(createTable, this));
}

NimbusStore.prototype.writeNimbus = function(nimbus) {
  var writeRecord = function() {
    var stmt = this.db.prepare(`INSERT OR IGNORE INTO nimbus VALUES (?,?,?)`, function(err, row) {
      if (err) {
        return;
      }
    });

    stmt.run(
      null,
      nimbus.id,
      JSON.stringify(nimbus)
    );

    stmt.finalize();
  };

  this.db.serialize(_.bind(writeRecord, this));
}

NimbusStore.prototype.updateNimbus = function(nimbus) {
  var updateRecord = function() {
    var stmt = this.db.prepare(`UPDATE nimbus SET nimbus=? where nimbusId=?`, function(err, row) {
      if (err) {
        return;
      }
    });

    stmt.run(JSON.stringify(nimbus), nimbus.id);
    stmt.finalize();
  };

  this.db.serialize(_.bind(updateRecord, this));
}

NimbusStore.prototype.deleteNimbus = function(id) {
  var deleteRecord = function() {
    var stmt = this.db.prepare(`DELETE from nimbus where nimbusId=?`, function(err, row) {
      if (err) {
        return;
      }
    });

    stmt.run(id);
    stmt.finalize();
  };

  this.db.serialize(_.bind(deleteRecord, this));
}

NimbusStore.prototype.getAllNimbus = function(cb) {
  var getAllRecords = function() {
    this.db.all(`SELECT * FROM nimbus`, function(err, rows) {
      if (err) {
        return cb([]);
      }

      cb(rows);
    });
  };

  this.db.serialize(_.bind(getAllRecords, this));
}

module.exports = NimbusStore;
