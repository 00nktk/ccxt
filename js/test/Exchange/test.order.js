'use strict';

const assert = require ('assert');

function testOrder (exchange, order, symbol, now) {
    assert (order);
    assert (typeof order['id'] === 'string');
    assert (typeof order['timestamp'] === 'number');
    assert (order['timestamp'] > 1230940800000); // 03 Jan 2009 - first block
    assert (order['timestamp'] < now);
    assert ('lastTradeTimestamp' in order);
    assert (order['datetime'] === exchange.iso8601 (order['timestamp']));
    assert ((order['status'] === 'open') || (order['status'] === 'closed') || (order['status'] === 'canceled'));
    assert (order['symbol'] === symbol);
    assert (typeof order['type'] === 'string');
    assert ((order['side'] === 'buy') || (order['side'] === 'sell'));
    assert (typeof order['price'] === 'number');
    assert (order['price'] > 0);
    assert (typeof order['amount'] === 'number');
    assert (order['amount'] >= 0);
    if (order['filled']) {
        assert (typeof order['filled'] === 'number');
        assert ((order['filled'] >= 0) && (order['filled'] <= order['amount']));
    }
    if (order['remaining']) {
        assert (typeof order['remaining'] === 'number');
        assert ((order['remaining'] >= 0) && (order['remaining'] <= order['amount']));
    }
    if (order['trades']) {
        assert (Array.isArray (order['trades']));
    }
    const fee = order['fee'];
    if (fee) {
        assert (typeof fee['cost'] === 'number');
        if (fee['cost'] !== 0) {
            assert (typeof fee['currency'] === 'string');
        }
    }
    assert (order['info']);
}

module.exports = testOrder;
