'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { ArgumentsRequired, AuthenticationError, ExchangeError, InsufficientFunds, InvalidOrder, BadSymbol, NotSupported} = require ('./base/errors');
const { ROUND } = require ('./base/functions/number');

//  ---------------------------------------------------------------------------

const CASH = 'cash';
const MARGIN = 'margin';
const FUTURES = 'futures';

const ALL_ACCOUNTS = [CASH, MARGIN, FUTURES];

module.exports = class bitmax extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bitmax',
            'name': 'BitMax',
            'countries': [ 'CN' ], // China
            'rateLimit': 500,
            'certified': false,
            // new metainfo interface
            'has': {
                'CORS': false,
                'fetchAccounts': true,
                'fetchTickers': true,
                'fetchOHLCV': true,
                'fetchMyTrades': false,
                'fetchOrder': true,
                'fetchOrders': true,
                'fetchOpenOrders': true,
                'fetchOrderTrades': false,
                'fetchClosedOrders': true,
                'fetchTransactions': false,
                'fetchCurrencies': true,
                'cancelAllOrders': true,
                'fetchDepositAddress': true,
            },
            'timeframes': {
                '1m': '1',
                '3m': '3',
                '5m': '5',
                '15m': '15',
                '30m': '30',
                '1h': '60',
                '2h': '120',
                '4h': '240',
                '6h': '360',
                '12h': '720',
                '1d': '1d',
                '1w': '1w',
                '1M': '1m',
            },
            'version': 'v1',
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/66820319-19710880-ef49-11e9-8fbe-16be62a11992.jpg',
                'api': 'https://bitmax.io',
                'test': 'https://bitmax-test.io/api',
                'www': 'https://bitmax.io',
                'doc': [
                    'https://bitmax-exchange.github.io/bitmax-pro-api/#rest-apis',
                ],
                'fees': 'https://bitmax.io/#/feeRate/tradeRate',
                'referral': 'https://bitmax.io/#/register?inviteCode=T6J9R0EB',
            },
            'api': {
                'public': {
                    'get': [
                        'assets',
                        'barhist',
                        'barhist/info',
                        'cash/assets',
                        'cash/products',
                        'depth',
                        'fees',
                        'futures/collateral',
                        'futures/contracts',
                        'depth',
                        'margin/assets',
                        'margin/products',
                        'margin/ref-price',
                        'trades',
                        'products',
                        'ticker',
                    ],
                },
                'private': {
                    'get': [
                        'cash/balance',
                        'cash/order/hist/current',
                        'cash/order/open',
                        'cash/order/status',
                        'futures/balance',
                        'futures/order/hist/current',
                        'futures/order/open',
                        'futures/order/status',
                        'margin/balance',
                        'margin/order/hist/current',
                        'margin/order/open',
                        'margin/order/status',
                        'margin/risk',
                        'order/hist',
                        'transaction',
                        'info',
                        'wallet/deposit/address',
                    ],
                    'post': [
                        'cash/order',
                        'cash/order/batch',
                        'futures/order',
                        'futures/order/batch',
                        'margin/order',
                        'margin/order/batch',
                    ],
                    'delete': [
                        'cash/order',
                        'cash/order/all',
                        'cash/order/batch',
                        'margin/order',
                        'margin/order/all',
                        'margin/order/batch',
                        'futures/order',
                        'futures/order/all',
                        'futures/order/batch',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'taker': 0.001,
                    'maker': 0.001,
                },
            },
            'options': {
                'accountGroup': undefined,
                'parseOrderToPrecision': false,
            },
            'exceptions': {
                'exact': {
                    // TODO: fix error code mapping
                    '2100': AuthenticationError, // {"code":2100,"message":"ApiKeyFailure"}
                    '5002': BadSymbol, // {"code":5002,"message":"Invalid Symbol"}
                    '6010': InsufficientFunds, // {'code': 6010, 'message': 'Not enough balance.'}
                    '60060': InvalidOrder, // { 'code': 60060, 'message': 'The order is already filled or canceled.' }
                    '600503': InvalidOrder, // {"code":600503,"message":"Notional is too small."}
                },
                'broad': {},
            },
        });
    }

    getAccount(params = {}) {
        const account = safeValue (params, 'account', this.options['account']);
        return account.charAt(0).toUpperCase() + account.slice(1).toLowerCase();
    }

    setAccount(account) {
        this.options['account'] = account;
    }

    getFuturesCollateral(params={}):
        response = await this.publicGetFuturesCollateral (params);
        return this.safeValue (response, 'data', []);

    async fetchCurrencies (params = {}) {
        const response = await this.publicGetAssets (params);
        //
        //{
        //    "code": 0,
        //    "data": [
        //        {
        //            "assetCode": "ONG",
        //            "assetName": "ONG",
        //            "precisionScale": 9,
        //            "nativeScale": 3,
        //            "withdrawalFee": "1.0",
        //            "minWithdrawalAmt": "2.0",
        //            "status": "Normal"
        //        }
        //    ]
        //}
        //
        const result = {};

        if (this.safeValue (response, 'code', -1) != 0)
            return result;

        const records = this.safeValue (response, 'data', []);

        for (let i = 0; i < records.length; i++) {
            const currency = records[i];
            const id = this.safeString (currency, 'assetCode');
            // todo: will need to rethink the fees
            // to add support for multiple withdrawal/deposit methods and
            // differentiated fees for each particular method
            const code = this.safeCurrencyCode (id);
            const precision = this.safeInteger (currency, 'precisionScale');
            const fee = this.safeFloat (currency, 'withdrawalFee'); // todo: redesign
            const status = this.safeString (currency, 'status');
            const active = (status === 'Normal');
            result[code] = {
                'id': id,
                'code': code,
                'info': currency,
                'type': undefined,
                'name': this.safeString (currency, 'assetName'),
                'active': active,
                // Todo: tiered fee make fee calculation complicated now. To provide separate fee related method.
                'fee': fee,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': Math.pow (10, -precision),
                        'max': undefined,
                    },
                    'price': {
                        'min': Math.pow (10, -precision),
                        'max': undefined,
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'withdraw': {
                        'min': this.safeFloat (currency, 'minWithdrawalAmt'),
                        'max': undefined,
                    },
                },
            };
        }
        return result;
    }

    async fetchMarkets (params = {}) {
        const response = await this.publicGetProducts (params);
        //
        //{
        //    "code": 0,
        //    "data": [
        //        {
        //            "symbol": "DAD/USDT",
        //            "baseAsset": "DAD",
        //            "quoteAsset": "USDT",
        //            "status": "Normal",
        //            "minNotional": "5",
        //            "maxNotional": "50000",
        //            "marginTradable": False,
        //            "commissionType": "Quote",
        //            "commissionReserveRate": "0.001",
        //            "tickSize": "0.00001",
        //            "lotSize": "1"
        //        }
        //    ]
        //}
        //
        const result = [];

        if (this.safeValue (response, 'code', -1) != 0)
            return result;

        const records = this.safeValue (response, 'data', []);

        for (let i = 0; i < records.length; i++) {
            const market = records[i];
            const id = this.safeString (market, 'symbol');
            const baseId = this.safeString (market, 'baseAsset');
            const quoteId = this.safeString (market, 'quoteAsset');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = symbol // base + '/' + quote;
            const precision = {
                'amount': this.precisionFromString (this.safeString (market, 'lotSize')),
                'price': this.precisionFromString (this.safeString (market, 'tickSize')),
            };
            const status = this.safeString (market, 'status');
            const active = (status === 'Normal');
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'info': market,
                'active': active,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': this.safeFloat (market, 'lotSize'),
                        'max': undefined,
                    },
                    'price': {
                        'min': this.safeFloat (market, 'tickSize'),
                        'max': undefined
                    },
                    'cost': {
                        'min': this.safeFloat (market, 'minNotional'),
                        'max': this.safeFloat (market, 'maxNotional'),
                    },
                },
            });
        }
        return result;
    }

    // TODO: fee calculation here is incorrect, we need to support tiered fee calculation.
    calculateFee (symbol, type, side, amount, price, takerOrMaker = 'taker', params = {}) {
        const market = this.markets[symbol];
        let key = 'quote';
        const rate = market[takerOrMaker];
        let cost = amount * rate;
        let precision = market['precision']['price'];
        if (side === 'sell') {
            cost *= price;
        } else {
            key = 'base';
            precision = market['precision']['amount'];
        }
        cost = this.decimalToPrecision (cost, ROUND, precision, this.precisionMode);
        return {
            'type': takerOrMaker,
            'currency': market[key],
            'rate': rate,
            'cost': parseFloat (cost),
        };
    }

    async fetchAccounts (params = {}) {
        let accountGroup = this.safeString (this.options, 'accountGroup');
        let records = undefined;
        if (accountGroup === undefined) {
            response = await this.privateGetInfo (params);
            //
            //{'code': 0,
            // 'data': {'email': 'xxxcc@gmail.com',
            //          'accountGroup': 5,
            //          'viewPermission': True,
            //          'tradePermission': True,
            //          'transferPermission': True,
            //          'withdrawPermission': True,
            //          'cashAccount': ['xxxxxxxxxxxxxxxxxxxxxxxxxx'],
            //          'marginAccount': ['yyyyyyyyyyyyyyyyyyyyyyyyy'],
            //          'futuresAccount': ['zzzzzzzzzzzzzzzzzzzzzzzzz'],
            //          'userUID': 'U123456789'}
            // }
            //
            if (response['code'] === 0) {
                records = response['data']
                accountGroup = this.safeString (records, 'accountGroup')
                this.options['accountGroup'] = accountGroup
             }
        }
        return [
            {
                'id': accountGroup,
                'type': undefined,
                'currency': undefined,
                'info': records,
            },
        ];
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const response = await this.privateGetBalance (params);
        //
        //{
        //    'code': 0,
        //    'data':
        //        [
        //            {
        //                'asset': 'BCHSV',
        //                'totalBalance': '64.298000048',
        //                'availableBalance': '64.298000048'
        //            },
        //         ]
        //}
        //
        const result = { 'info': response };
        const balances = this.safeValue (response, 'data', []);
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const code = this.safeCurrencyCode (this.safeString (balance, 'asset'));
            const account = this.account ();
            account['free'] = this.safeFloat (balance, 'availableAmount');
            account['total'] = this.safeFloat (balance, 'totalAmount');
            account['used'] = account['total'] - account['free'];
            result[code] = account;
        }
        return this.parseBalance (result);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['n'] = limit; // default = maximum = 100
        }
        const response = await this.publicGetDepth (this.extend (request, params));
        //
        //{
        //    "code": 0,
        //    "data": {
        //        "m": "depth-snapshot",
        //        "symbol": "BTC/USDT",
        //        "data": {
        //            "ts": 1583558793465,
        //            "seqnum": 8273359781,
        //            "asks": [
        //                [
        //                    "9082.73",
        //                    "1.31752"
        //                ],
        //                [
        //                    "9082.76",
        //                    "0.00342"
        //                ]
        //            ],
        //            "bid": [
        //                [
        //                    "5532.27",
        //                    "0.00606"
        //                ],
        //                [
        //                    "4858.54",
        //                    "0.02789"
        //                ]
        //            ]
        //        }
        //    }
        //}
        //
        const timestamp = this.safeInteger (response, 'ts');
        const result = this.parseOrderBook (response, timestamp);
        result['nonce'] = this.safeInteger (response, 'seqnum');
        return result;
    }

    parseTicker (ticker, market = undefined) {
        //
        //{
        //    'symbol': 'BTC/USDT',
        //    'open': '8086.63',
        //    'close': '7846.16',
        //    'high': '7846.16',
        //    'low': '7846.16',
        //    'volume': '8100.10864',
        //    'ask': ['7847.7', '0.52882'],
        //    'bid': ['7846.87', '3.9718']
        //}
        //
        let timestamp = this.milliseconds ();
        timestamp = timestamp - timestamp % 60000;
        let symbol = undefined;
        const marketId = this.safeString (ticker, 'symbol');
        if (marketId in this.markets_by_id) {
            market = this.markets_by_id[marketId];
        } else if (marketId !== undefined) {
            const [ baseId, quoteId ] = marketId.split ('/');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            symbol = base + '/' + quote;
        }
        if ((symbol === undefined) && (market !== undefined)) {
            symbol = market['symbol'];
        }
        const last = this.safeFloat (ticker, 'close');
        const bid = this.safeValue (ticker, 'bid', [undefined, undefined]);
        const ask = this.safeValue (ticker, 'ask', [undefined, undefined]);
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeFloat (ticker, 'high'),
            'low': this.safeFloat (ticker, 'low'),
            'bid': bid[0],
            'bidVolume': bid[1],
            'ask': ask[0],
            'askVolume': ask[1],
            'vwap': undefined,
            'open': this.safeFloat (ticker, 'open'),
            'close': last,
            'last': last,
            'previousClose': undefined, // previous day close
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': this.safeFloat (ticker, 'volume'),
            'quoteVolume': undefined,
            'info': ticker,
        };
    }

    parseTickers (rawTickers, symbols = undefined) {
        const tickers = [];
        for (let i = 0; i < rawTickers.length; i++) {
            tickers.push (this.parseTicker (rawTickers[i]));
        }
        return this.filterByArray (tickers, 'symbol', symbols);
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.publicGetTicker (this.extend (request, params));
        //
        //{
        //    'code': 0,
        //    'data':
        //        {
        //            'symbol': 'BTC/USDT',
        //            'open': '8086.63',
        //            'close': '7846.16',
        //            'high': '7846.16',
        //            'low': '7846.16',
        //            'volume': '8100.10864',
        //            'ask': ['7847.7', '0.52882'],
        //            'bid': ['7846.87', '3.9718']
        //        }
        //}
        //
        return this.parseTicker (this.safeValue (response, 'data', {}), market);
    }

    async fetchTickers (symbols = undefined, params = {}) {
        await this.loadMarkets ();
        const response = await this.publicGetTicker (params);
        return this.parseTickers (response, symbols);
    }

    parseOHLCV (ohlcvMsg, market = undefined, timeframe = '1m', since = undefined, limit = undefined) {
        //
        //{
        //    'm': 'bar',
        //    's': 'BTC/USDT',
        //    'data':
        //        {
        //            'i': '1',
        //            'ts': 1583901000000,
        //            'o': '7924.98',
        //            'c': '7926.80',
        //            'h': '7926.80',
        //            'l': '7924.98',
        //            'v': '0.32144'
        //        }
        //}
        //
        const ohlcv = this.safeValue (ohlcvMsg, 'data', {});
        return [
            this.safeInteger (ohlcv, 'ts'),
            this.safeFloat (ohlcv, 'o'),
            this.safeFloat (ohlcv, 'h'),
            this.safeFloat (ohlcv, 'l'),
            this.safeFloat (ohlcv, 'c'),
            this.safeFloat (ohlcv, 'v'),
        ];
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'interval': this.timeframes[timeframe],
        };
        // if since and limit are not specified
        // the exchange will return just 1 last candle by default
        const duration = this.parseTimeframe (timeframe);
        if (since !== undefined) {
            request['from'] = since;
            if (limit !== undefined) {
                request['to'] = this.sum (since, limit * duration * 1000, 1);
            }
        } else if (limit !== undefined) {
            request['to'] = this.milliseconds ();
            request['from'] = request['to'] - limit * duration * 1000 - 1;
        }
        const response = await this.publicGetBarhist (this.extend (request, params));
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    parseTrade (trade, market = undefined) {
        //
        // public fetchTrades
        //
        //     {
        //         "p": "13.75", // price
        //         "q": "6.68", // quantity
        //         "ts": 1528988084944, // timestamp
        //         "bm": False, // if true, the buyer is the market maker, we only use this field to "define the side" of a public trade
        //     }
        //
        // privateGetCashOrderStatus / privateGetMarginOrderStatus / privateGetFuturesOrderStatus
        //
        //{
        //    'seqNum': 4208248561,
        //    'orderId': 'r170adcc717eU123456789bbtmabc3P',
        //    'symbol': 'BTMX/USDT',
        //    'orderType': 'Limit',
        //    'lastExecTime': 1583463823205,
        //    'price': '0.06043',
        //    'orderQty': '100',
        //    'side': 'Buy',
        //    'status': 'Filled',
        //    'avgPx': '0.06043',
        //    'cumFilledQty': '100',
        //    'stopPrice': '',
        //    'errorCode': '',
        //    'cumFee': '0.006043',
        //    'feeAsset': 'USDT',
        //    'execInst': 'NULL_VAL'
        //}
        //
        const timestamp = this.safeInteger (trade, 'ts');
        const price = this.safeFloat (trade, 'price') || this.safeFloat (trade, 'p');
        const amount = this.safeFloat (trade, 'orderQty') || this.safeFloat (trade, 'q');
        let cost = undefined;
        if ((price !== undefined) && (amount !== undefined)) {
            cost = price * amount;
        }
        const buyerIsMaker = this.safeValue (trade, 'bm');
        let makerOrTaker = undefined;

        if (buyerIsMaker != undefined){
            if (buyerIsMaker) {
                makerOrTaker = 'maker';
            } else {
                makerOrTaker = 'taker';
            }
        }
        let symbol = undefined;
        const marketId = this.safeString (trade, 's');
        if (marketId !== undefined) {
            if (marketId in this.markets_by_id) {
                market = this.markets_by_id[marketId];
                symbol = market['symbol'];
            } else {
                const [ baseId, quoteId ] = market.split ('/');
                const base = this.safeCurrencyCode (baseId);
                const quote = this.safeCurrencyCode (quoteId);
                symbol = base + '/' + quote;
            }
        }
        if ((symbol === undefined) && (market !== undefined)) {
            symbol = market['symbol'];
        }
        let fee = undefined;
        const feeCost = this.safeFloat (trade, 'cumFee');
        if (feeCost !== undefined) {
            const feeCurrencyId = this.safeString (trade, 'feeAsset');
            const feeCurrencyCode = this.safeCurrencyCode (feeCurrencyId);
            fee = {
                'cost': feeCost,
                'currency': feeCurrencyCode,
            };
        }
        const orderId = this.safeString (trade, 'orderId');
        let side = this.safeStringLower (trade, 'side');
        if ((side === undefined) && (buyerIsMaker !== undefined)) {
            side = buyerIsMaker ? 'buy' : 'sell';
        }
        const type = this.safeStringLower (trade, 'orderType');
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'id': undefined,
            'order': orderId,
            'type': type,
            'takerOrMaker': makerOrTaker,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['n'] = limit; // currently limited to 100 or fewer
        }
        const response = await this.publicGetTrades (this.extend (request, params));
        //
        //{'code': 0,
        // 'data': {'m': 'trades',
        //          'symbol': 'BTC/USDT',
        //          'data': [{'p': '7812.61',
        //                    'q': '0.01998',
        //                    'ts': 1583760687790,
        //                    'bm': False, # if True, the buyer is the market maker
        //                    'seqnum': 72057603463162642}]
        //          }
        // }
        //
        const records = this.safeValue (response, 'data', []);
        const trades = this.safeValue (records, 'data', []);
        return this.parseTrades (trades, market, since, limit);
    }

    parseOrderStatus (status) {
        const statuses = {
            'PendingNew': 'open',
            'New': 'open',
            'PartiallyFilled': 'open',
            'Filled': 'closed',
            'Canceled': 'canceled',
            'Rejected': 'rejected',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined) {
        //
        //createOrder
        //
        //{
        //    'symbol': 'BTC/USDT',
        //    'orderType': 'Limit',
        //    'action': 'new',
        //    'timestamp': 1583812256973,
        //    'id': '0e602eb4337d4aebbe3c438f6cc41aee',
        //    'orderId': 'a170c29124378418641348f6cc41aee'
        //}
        //
        //fetchOrder, fetchOpenOrders, fetchClosedOrders
        //
        //{
        //    'avgPx': '9126.75',
        //    'cumFee': '0.002738025',
        //    'cumFilledQty': '0.0005',
        //    'errorCode': '',
        //    'execInst': 'NULL_VAL',
        //    'feeAsset': 'USDT',
        //    'lastExecTime': 1583443804918,
        //    'orderId': 'r170ac9b032cU9490877774sbtcpeAAb',
        //    'orderQty': '0.0005',
        //    'orderType': 'Market',
        //    'price': '8853',
        //    'seqNum': 4204789616,
        //    'side': 'Sell',
        //    'status': 'Filled',
        //    'stopPrice': '',
        //    'symbol': 'BTC-PERP'
        //}
        //
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const marketId = this.safeString (order, 'symbol');
        let symbol = undefined;
        if (marketId !== undefined) {
            if (marketId in this.markets_by_id) {
                market = this.markets_by_id[marketId];
            } else {
                const [ baseId, quoteId ] = marketId.split ('/');
                const base = this.safeCurrencyCode (baseId);
                const quote = this.safeCurrencyCode (quoteId);
                symbol = base + '/' + quote;
            }
        }
        if ((symbol === undefined) && (market !== undefined)) {
            symbol = market['symbol'];
        }
        const timestamp = this.safeInteger (order, 'lastExecTime') || this.safeInteger (order, 'timestamp');
        let price = this.safeFloat (order, 'price');
        const amount = this.safeFloat (order, 'orderQty');
        const avgFillPx = this.safeFloat (order, 'avgPx');
        const filled = this.safeFloat (order, 'cumFilledQty');
        let remaining = undefined;
        const cost = (avgFillPx || 0) * (filled || 0);
        const id = this.safeString (order, 'orderId');
        let type = this.safeString (order, 'orderType');
        if (type !== undefined) {
            type = type.toLowerCase ();
            if (type === 'market') {
                if (price === 0.0) {
                    if ((cost !== undefined) && (filled !== undefined)) {
                        if ((cost > 0) && (filled > 0)) {
                            price = cost / filled;
                        }
                    }
                }
            }
        }
        const side = this.safeStringLower (order, 'side');
        const fee = {
            'cost': this.safeFloat (order, 'cumFee'),
            'currency': this.safeString (order, 'feeAsset'),
        };
        return {
            'info': order,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'symbol': symbol,
            'type': type,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'average': avgFillPx,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': fee,
            'trades': undefined,
        };
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const market = this.market (symbol);
        const request = {
            'id': this.coid (), // optional, a unique identifier of length 32
            // 'time': this.milliseconds (), // milliseconds since UNIX epoch in UTC, this is filled in the private section of the sign() method below
            'symbol': market['id'],
            'orderPrice': this.priceToPrecision (symbol, price || 0), // optional, limit price of the order. This field is required for limit orders and stop limit orders
            'stopPrice': this.priceToPrecision (symbol, this.safeValue (params, 'stopPrice', 0.0)), // optional, stopPrice of the order. This field is required for stop_market orders and stop limit orders
            'orderQty': this.amountToPrecision (symbol, amount),
            'orderType': type, // order type, you shall specify one of the following: "limit", "market", "stop_market", "stop_limit"
            'side': side, // "buy" or "sell"
            'postOnly': this.safeValue (params, 'postOnly', false), // optional, if true, the order will either be posted to the limit order book or be cancelled, i.e. the order cannot take liquidity, default is false
            'timeInForce': this.safeString (params, 'timeInForce', 'GTC'), // optional, supports "GTC" good-till-canceled, "IOC" immediate-or-cancel, and "FOK" for fill-or-kill
        };
        if ((type === 'limit') || (type === 'stop_limit')) {
            request['orderPrice'] = this.priceToPrecision (symbol, price);
        }
        const method = 'privatePost' + this.getAccount (params) + 'Order';
        const response = await this[method] (this.extend (request, params));
        //
        //{
        //'code': 0,
        // 'data': {'ac': 'CASH',
        //          'accountId': 'hongyu.wang',
        //          'action': 'place-order',
        //          'info': {'id': 'JhAAjOoTY6EINXC8QcOL18HoXw89FU0u',
        //                   'orderId': 'a170d000346b5450276356oXw89FU0u',
        //                   'orderType': 'Limit',
        //                   'symbol': 'BTMX/USDT',
        //                   'timestamp': 1584037640014},
        //          'status': 'Ack'}
        //          }
        //
        const data = this.safeValue (response, 'data', {});
        const info = this.extend (this.safeValue (data, 'info'), {'status': undefined});
        return this.parseOrder (info, market);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const request = {
            'orderId': id,
        };
        const method = 'privateGet' + this.getAccount (params) + 'OrderStatus';
        const response = await this[method] (this.extend (request, params));
        //
        //{'code': 0,
        // 'accountId': 'ABCDEFGHIJKLMNOPQRSTUVWXYZABC',
        // 'ac': 'CASH',
        // 'data': {'seqNum': 4208248561,
        //          'orderId': 'r170adcc717eU123456789bbtmabc3P',
        //          'symbol': 'BTMX/USDT',
        //          'orderType': 'Limit',
        //          'lastExecTime': 1583463823205,
        //          'price': '0.06043',
        //          'orderQty': '100',
        //          'side': 'Buy',
        //          'status': 'Filled',
        //          'avgPx': '0.06043',
        //          'cumFilledQty': '100',
        //          'stopPrice': '',
        //          'errorCode': '',
        //          'cumFee': '0.006043',
        //          'feeAsset': 'USDT',
        //          'execInst': 'NULL_VAL'
        //          }
        // }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseOrder (data, market);
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        let market = undefined;
        const request = {
            // 'symbol': 'ETH/BTC', // optional
            // 'category': 'CASH', // optional, string
            // 'orderType': 'Market', // optional, string
            // 'page': 1, // optional, integer type, starts at 1
            // 'pageSize': 100, // optional, integer type
            // 'side': 'buy', // or 'sell', optional, case insensitive.
            // 'startTime': 1566091628227, // optional, integer milliseconds since UNIX epoch representing the start of the range
            // 'endTime': 1566091628227, // optional, integer milliseconds since UNIX epoch representing the end of the range
            // 'status': 'Filled', // optional, can only be one of "Filled", "Canceled", "Rejected"
        };
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['n'] = limit; // default 15, max 50
        }
        request['executedOnly'] = this.safeValue (params, 'executedOnly', false);
        const method = 'privateGet' + this.getAccount (params) + "OrderHistCurrent";
        const response = await this[method] (this.extend (request, params));
        //
        //{
        //    'code': 0,
        //    'accountId': 'test1@xxxxx.io',
        //    'ac': 'CASH',
        //    'data': [
        //        {
        //            'seqNum': 30181890,
        //            'orderId': 'a170c4f6cae084186413483b0e984fe',
        //            'symbol': 'BTC/USDT',
        //            'orderType': 'Limit',
        //            'lastExecTime': 1583852473185,
        //            'price': '8500',
        //            'orderQty': '0.01',
        //            'side': 'Buy',
        //            'status': 'Filled',
        //            'avgPx': '8032.04',
        //            'cumFilledQty': '0.01',
        //            'stopPrice': '',
        //            'errorCode': '',
        //            'cumFee': '0.065862728',
        //            'feeAsset': 'USDT',
        //            'execInst': 'NULL_VAL'
        //        }]
        // }
        //

        const orders = this.safeValue (response, 'data', []);
        return this.parseOrders (orders, market, since, limit);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        let market = undefined;
        const request = {
            // 'symbol': 'symbol'  optional
        };
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        const method = 'privateGet' + this.getAccount (params) + 'OrderOpen';
        const response = await this[method] (this.extend (request, params));
        //
        //{
        //    'code': 0,
        //    'accountId': 'MPXFNEYEJIJ93CREXT3LTCIDIJPCFNIX',
        //    'ac': 'CASH',
        //    'data':
        //        [{
        //            'seqNum': 4305977824,
        //            'orderId': 'a170c9e191a7U9490877774397007e73',
        //            'symbol': 'BTMX/USDT',
        //            'orderType': 'Limit',
        //            'lastExecTime': 1583934968446,
        //            'price': '0.045',
        //            'orderQty': '200',
        //            'side': 'Buy',
        //            'status': 'New',
        //            'avgPx': '0',
        //            'cumFilledQty': '0',
        //            'stopPrice': '',
        //            'errorCode': '',
        //            'cumFee': '0',
        //            'feeAsset': 'USDT',
        //            'execInst': 'NULL_VAL'
        //        }]
        //}
        //
        const data = this.safeValue (response, 'data', []);
        return this.parseOrders (data, market, since, limit);
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        let market = undefined;
        const request = {
            // 'symbol': 'ETH/BTC', // optional
            // 'category': 'CASH'/'MARGIN'/"FUTURES', // optional, string
            // 'orderType': 'Market', // optional, string
            // 'page': 1, // optional, integer type, starts at 1
            // 'pageSize': 100, // optional, integer type
            // 'side': 'buy', // or 'sell', optional, case insensitive.
            // 'startTime': 1566091628227, // optional, integer milliseconds since UNIX epoch representing the start of the range
            // 'endTime': 1566091628227, // optional, integer milliseconds since UNIX epoch representing the end of the range
            // 'status': 'Filled', // optional, can only be one of "Filled", "Canceled", "Rejected"
        };
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['n'] = limit; // default 15, max 50
        }
        const response = await this.privateGetOrderHist (this.extend (request, params));
        //
        //{
        //    'code': 0,
        //    'data':
        //        {
        //            'page': 1,
        //            'pageSize': 20,
        //            'limit': 500,
        //            'hasNext': True,
        //            'data': [
        //                {
        //                    'ac': 'CASH',
        //                    'accountId': 'ABCDEFGHIJKLMOPQRSTUVWXYZABC',
        //                    'avgPx': '0',
        //                    'cumFee': '0',
        //                    'cumQty': '0',
        //                    'errorCode': 'NULL_VAL',
        //                    'feeAsset': 'USDT',
        //                    'lastExecTime': 1583894311925,
        //                    'orderId': 'r170c77528bdU9490877774bbtcu9DwL',
        //                    'orderQty': '0.001', 'orderType': 'Limit',
        //                    'price': '7912.88',
        //                    'sendingTime': 1583894310880,
        //                    'seqNum': 4297339552,
        //                    'side': 'Buy',
        //                    'status': 'Canceled',
        //                    'stopPrice': '',
        //                    'symbol': 'BTC/USDT',
        //                    'execInst': 'NULL_VAL'
        //                }
        //            ]
        //        }
        //}
        //
        const data = this.safeValue (response, 'data', {});
        const orders = this.safeValue (data, 'data', []);
        return this.parseOrders (orders, market, since, limit);
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrder requires a symbol argument');
        }
        await this.loadMarkets ();
        await this.loadAccounts ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'id': this.coid (), // optional
            'orderId': id,
            // 'time': this.milliseconds (), // this is filled in the private section of the sign() method below
        };
        const method = 'privateDelete' + this.getAccount (params) + 'Order';
        const response = await this.privateDeleteOrder (this.extend (request, params));
        //
        //{
        //    'code': 0,
        //    'data':
        //        {
        //            'accountId': 'test1@xxxxx.io',
        //            'ac': 'CASH',
        //            'action': 'cancel-order',
        //            'status': 'Ack',
        //            'info': {
        //                'symbol': 'BTC/USDT',
        //                'orderType': '',
        //                'timestamp': 1583868590663,
        //                'id': 'de4f5a7c5df2433cbe427da14d8f84d5',
        //                'orderId': 'a170c5136edb8418641348575f38457'}
        //        }
        //}
        //
        const order = this.safeValue (response, 'data', {});
        return this.parseOrder (order);
    }

    async cancelAllOrders (symbol = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const request = {
        };
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id']; // optional
        }
        const method = 'privateDelete' + this.getAccount (params) + 'OrderAll';
        const response = await this[method] (this.extend (request, params));
        //
        //     ?
        //
        return response;
    }

    coid () {
        const uuid = this.uuid ();
        const parts = uuid.split ('-');
        const clientOrderId = parts.join ('');
        const coid = clientOrderId.slice (0, 32);
        return coid;
    }

    async fetchDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const currency = this.currency (code);
        const request = {
            'requestId': this.coid (),
            // 'time': this.milliseconds (), // this is filled in the private section of the sign() method below
            'asset': currency['id'],
        };
        const response = await this.privateGetWalletDepositAddress (this.extend (request, params));
        //
        //
        //{
        //    'code': 0,
        //    'data':
        //        {
        //            'asset': 'BTC',
        //            'assetName': 'Bitcoin',
        //            'address':
        //                [
        //                    {
        //                        'address': '3P5e8M6nQaGPB6zYJ447uGJKCJN2ZkEDLB',
        //                        'destTag': '',
        //                        'tagType': '',
        //                        'tagId': '',
        //                        'chainName': 'Bitcoin',
        //                        'numConfirmations': 3,
        //                        'withdrawalFee': 0.0005,
        //                        'nativeScale': 8,
        //                        'tips': []
        //                    }
        //                ]
        //        }
        //}
        //
        let data = this.safeValue (response, 'data', {});
        let addressData = this.safeValue (data, 'address', []);
        if (Array.isArray (addressData)) {
            addressData = this.safeValue (addressData, 0, {});
        }
        const address = this.safeString (addressData, 'address');
        const tag = this.safeString (addressData, 'destTag');
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'tag': tag,
            'info': response,
        };
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = '/api/pro/' + this.version + '/' + this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        if (api === 'public') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else {
            this.checkRequiredCredentials ();
            if (this.safeValue (params, 'isCommonApi', false) !== false) {
                let accountGroup = this.safeString (this.options, 'accountGroup');
                if (accountGroup === undefined) {
                    if (this.accounts !== undefined) {
                        accountGroup = this.accounts[0]['id'];
                    }
                }
                if (accountGroup !== undefined) {
                    url = '/' + accountGroup + url;
                }
            }
            query['time'] = this.milliseconds ().toString ();
            let auth = query['time'] + '+' + path.replace ('/{orderId}', ''); // fix sign error
            headers = {
                'x-auth-key': this.apiKey,
                'x-auth-timestamp': query['time'],
                'Content-Type': 'application/json',
            };
            const signature = this.hmac (this.encode (auth), this.encode (this.secret), 'sha256', 'base64');
            headers['x-auth-signature'] = signature;
            if (method === 'GET') {
                if (Object.keys (query).length) {
                    url += '?' + this.urlencode (query);
                }
            } else {
                body = this.json (query);
            }
        }
        url = this.urls['api'] + url;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (httpCode, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return; // fallback to default error handler
        }
        //
        //     {"code":2100,"message":"ApiKeyFailure"}
        //     {'code': 6010, 'message': 'Not enough balance.'}
        //     {'code': 60060, 'message': 'The order is already filled or canceled.'}
        //
        const code = this.safeString (response, 'code');
        const message = this.safeString (response, 'message');
        const error = (code !== undefined) && (code !== '0');
        if (error || (message !== undefined)) {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], code, feedback);
            this.throwExactlyMatchedException (this.exceptions['exact'], message, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            throw new ExchangeError (feedback); // unknown message
        }
    }
};
