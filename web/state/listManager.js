// manages a list of things that change over time
// used for:
// - The currently running imports
// - The currently running market watchers
// - The live nimbus bots
// - etc..
const _ = require('lodash');

const base = require('../routes/baseConfig');
const util = require(__dirname + '/../../core/util');
util.setConfig(base);
const NimbusStore = require('../../plugins/mongodb/nimbus');

/**
 * Initialize ListManager
 * @param syncDB bool - if set to true, it saves listmanager data to SQLite database
 * @param name string - the name of SQLite table
 */
var ListManager = function(syncDB = false, name = 'nimbus') {
  this._list = [];
  this._syncDB = syncDB;

  if (this._syncDB)
    this._nimbusDB = new NimbusStore(name);
}

// sync to SQLite DB
ListManager.prototype._syncToDB = function(action, id) {
  if (!this._syncDB)
    return;

  let item = null;

  switch (action) {
    case 'add':
      item = this._list.find(i => i.id === id);
      this._nimbusDB.writeNimbus(item);
      
      break;
    case 'update':
      item = this._list.find(i => i.id === id);
      this._nimbusDB.updateNimbus(item);

      break;
    case 'delete':
      this._nimbusDB.deleteNimbus(id);
      
      break;
  }
}

// load list from DB
ListManager.prototype.load = function(cb) {
  const that = this;
  this._list = [];

  this._nimbusDB.getAllNimbus(function(rows) {
    _.each(rows, row => {
      that._list.push(_.clone(JSON.parse(row.nimbus)));
    });

    cb();
  });
}

// add an item to the list
ListManager.prototype.add = function(obj) {
  if(!obj.id)
    return false;
  this._list.push(_.clone(obj));
  
  this._syncToDB('add', obj.id);
  return true;
}

// update some properties on an item
ListManager.prototype.update = function(id, updates) {
  let item = this._list.find(i => i.id === id);
  if(!item)
    return false;

  // no need to update `startAt`
  delete updates.startAt;
  _.merge(item, updates);
  
  this._syncToDB('update', id);
  return true;
}

// update one property on an item
ListManager.prototype.updateProperty = function(id, prop, value) {
  let item = this._list.find(i => i.id === id);
  if(!item)
    return false;

  item[prop] = value;
  
  this._syncToDB('update', id);
  return true;
}

// push a value to a array proprty of an item
ListManager.prototype.push = function(id, prop, value) {
  let item = this._list.find(i => i.id === id);
  if(!item)
    return false;

  item[prop].push(value);
  
  this._syncToDB('update', id);
  return true;
}

// delete an item from the list
ListManager.prototype.get = function(id) {
  return this._list.find(i => i.id === id);
}

// delete an item from the list
ListManager.prototype.delete = function(id) {
  let wasThere = this._list.find(i => i.id === id);
  this._list = this._list.filter(i => i.id !== id);

  this._syncToDB('delete', id);  
  if (wasThere)
    return true;
  else
    return false;
}

// getter
ListManager.prototype.list = function() {
  return this._list;
}

module.exports = ListManager;
