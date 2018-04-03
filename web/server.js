const cache = require('./state/cache');
const ListManager = require('./state/listManager');

// initialize lists and dump into cache
cache.set('imports', new ListManager);
cache.set('apiKeyManager', require('./apiKeyManager'));

const collectMarketData = require('./bootstrap/collectMarketData');
const indicatorModelling = require('./bootstrap/indicatorModelling');

collectMarketData();
indicatorModelling();
