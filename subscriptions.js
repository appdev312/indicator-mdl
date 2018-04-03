// 
// Subscriptions glue plugins to events
// flowing through the Nimbus.
// 

var subscriptions = [
  {
    emitter: 'market',
    event: 'candle',
    handler: 'processCandle'
  },
  {
    emitter: 'market',
    event: 'history',
    handler: 'processHistory'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'advice',
    handler: 'processAdvice'
  },
  {
    emitter: 'trader',
    event: 'trade',
    handler: 'processTrade'
  },
  {
    emitter: 'trader',
    event: 'portfolioUpdate',
    handler: 'processPortfolioUpdate'
  },
  {
    emitter: 'paperTrader',
    event: 'paperTrade',
    handler: 'paperProcessTrade'
  },
  {
    emitter: 'paperTrader',
    event: 'paperPortfolioUpdate',
    handler: 'paperProcessPortfolioUpdate'
  },
];

module.exports = subscriptions;