import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root)

# ----------------------------------------------------------------------------

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

# ----------------------------------------------------------------------------

import numbers  # noqa: E402
try:
    basestring  # basestring was removed in Python 3
except NameError:
    basestring = str


def test_order(exchange, order, symbol, now):
    assert order
    assert isinstance(order['id'], basestring)
    assert isinstance(order['timestamp'], numbers.Real)
    assert order['timestamp'] > 1230940800000  # 03 Jan 2009 - first block
    assert order['timestamp'] < now
    assert 'lastTradeTimestamp' in order
    assert order['datetime'] == exchange.iso8601(order['timestamp'])
    assert(order['status'] == 'open') or (order['status'] == 'closed') or (order['status'] == 'canceled')
    assert order['symbol'] == symbol
    assert isinstance(order['type'], basestring)
    assert(order['side'] == 'buy') or (order['side'] == 'sell')
    assert isinstance(order['price'], numbers.Real)
    assert order['price'] > 0
    assert isinstance(order['amount'], numbers.Real)
    assert order['amount'] >= 0
    if order['filled']:
        assert isinstance(order['filled'], numbers.Real)
        assert(order['filled'] >= 0) and (order['filled'] <= order['amount'])

    if order['remaining']:
        assert isinstance(order['remaining'], numbers.Real)
        assert(order['remaining'] >= 0) and (order['remaining'] <= order['amount'])

    if order['trades']:
        assert isinstance(order['trades'], list)

    fee = order['fee']
    if fee:
        assert isinstance(fee['cost'], numbers.Real)
        if fee['cost'] != 0:
            assert isinstance(fee['currency'], basestring)

    assert order['info']
