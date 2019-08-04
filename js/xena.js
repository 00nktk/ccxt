'use strict';

const Exchange = require ('./base/Exchange');
const { ExchangeError, ArgumentsRequired, BadRequest, InsufficientFunds, InvalidAddress } = require ('./base/errors');

module.exports = class liqui extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'xena',
            'name': 'Xena Exchange',
            'countries': [ 'VC', 'UK' ],
            'rateLimit': 500,
            'has': {
                'CORS': false,
                'fetchOrderBook': false,
                'fetchTicker': false,
                'fetchTickers': false,
                'fetchTrades': false,
                'createOrder': false,
                'createMarketOrder': false,
                'createDepositAddress': true,
                'fetchDepositAddress': true,
                'fetchMyTrades': true,
                'fetchCurrencies': true,
                'withdraw': true,
                'fetchWithdrawals': true,
                'fetchDeposits': true,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27982022-75aea828-63a0-11e7-9511-ca584a8edd74.jpg',
                'api': {
                    'public': 'https://trading.xena.exchange/api',
                    'private': 'https://api.xena.exchange',
                },
                'www': 'https://xena.exchange',
                'doc': 'https://support.xena.exchange/support/solutions/articles/44000222066-introduction-to-xena-api',
                'fees': 'https://trading.xena.exchange/en/platform-specification/fee-schedule',
            },
            'timeframes': {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '4h': '4h',
                '12h': '12h',
                '1d': '1d',
                '1w': '1w',
            },
            'api': {
                'public': {
                    'get': [
                        'market-data/candles/{marketId}/{timeframe}',
                        'common/currencies',
                        'common/instruments',
                        'common/features',
                        'common/commissions',
                        'common/news',
                    ],
                },
                'private': {
                    'get': [
                        'trading/accounts',
                        'trading/accounts/{accountId}/balance',
                        'trading/accounts/{accountId}/trade-history',
                        // 'trading/accounts/{accountId}/trade-history?symbol=BTC/USDT&client_order_id=EMBB8Veke&trade_id=220143254',
                        'transfers/accounts',
                        'transfers/accounts/{accountId}',
                        'transfers/accounts/{accountId}/deposit-address/{currency}',
                        'transfers/accounts/{accountId}/deposits',
                        'transfers/accounts/{accountId}/trusted-addresses',
                        'transfers/accounts/{accountId}/withdrawals',
                        'transfers/accounts/{accountId}/balance-history',
                        // 'transfers/accounts/{accountId}/balance-history?currency={currency}&from={time}&to={time}&kind={kind}&kind={kind}',
                        // 'transfers/accounts/{accountId}/balance-history?page={page}&limit={limit}',
                        // 'transfers/accounts/{accountId}/balance-history?txid=3e1db982c4eed2d6355e276c5bae01a52a27c9cef61574b0e8c67ee05fc26ccf',
                    ],
                    'post': [
                        'transfers/accounts/{accountId}/withdrawals',
                        'transfers/accounts/{accountId}/deposit-address/{currency}',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'maker': 0.0005,
                    'taker': 0.001,
                    'tierBased': true,
                    'percentage': true,
                },
                'funding': {
                    'tierBased': false,
                    'percentage': false,
                    'withdraw': {},
                    'deposit': {},
                },
            },
            'exceptions': {
                'exact': {
                    'Validation failed': BadRequest,
                },
                'broad': {
                    'address': InvalidAddress,
                    'Money not enough': InsufficientFunds,
                },
            },
            'options': {
                'defaultType': 'spot', // 'margin',
                'accountId': undefined, // '1012838157',
            },
        });
    }

    async fetchMarkets (params = {}) {
        const response = await this.publicGetCommonInstruments (params);
        //
        //     [
        //         {
        //             "id":"100",
        //             "type":"Spot",
        //             "symbol":"BTC/USDT",
        //             "baseCurrency":"BTC",
        //             "quoteCurrency":"USDT",
        //             "settlCurrency":"USDT",
        //             "tickSize":1,
        //             "minOrderQuantity":"0.001",
        //             "orderQtyStep":"0.001",
        //             "limitOrderMaxDistance":"0",
        //             "priceInputMask":"00000.0",
        //             "enabled":true
        //         },
        //         {
        //             "id":"1000",
        //             "type":"Margin",
        //             "symbol":"XBTUSD",
        //             "baseCurrency":"BTC",
        //             "quoteCurrency":"USD",
        //             "settlCurrency":"BTC",
        //             "tickSize":1,
        //             "minOrderQuantity":"1",
        //             "orderQtyStep":"1",
        //             "limitOrderMaxDistance":"10",
        //             "priceInputMask":"00000.0",
        //             "indexes":[".BTC3_TWAP"],
        //             "enabled":true,
        //             "liquidationMaxDistance":"0.01",
        //             "contractValue":"1",
        //             "contractCurrency":"USD",
        //             "lotSize":"1",
        //             "tickValue":"0",
        //             "maxOrderQty":"500000",
        //             "maxPosVolume":"10000000",
        //             "mark":".BTC3_TWAP",
        //             "floatingPL":"BidAsk",
        //             "addUvmToFreeMargin":"ProfitAndLoss",
        //             "minLeverage":"0",
        //             "maxLeverage":"20",
        //             "margin":{
        //                 "netting":"PositionsAndOrders",
        //                 "rates":[
        //                     { "maxVolume":"500000", "initialRate":"0.05", "maintenanceRate":"0.0125"},
        //                     { "maxVolume":"1000000", "initialRate":"0.1", "maintenanceRate":"0.025"},
        //                     { "maxVolume":"1500000", "initialRate":"0.2", "maintenanceRate":"0.05"},
        //                     { "maxVolume":"2000000", "initialRate":"0.3", "maintenanceRate":"0.075"},
        //                     { "maxVolume":"3000000", "initialRate":"0.4", "maintenanceRate":"0.1"},
        //                     { "maxVolume":"4000000", "initialRate":"0.5", "maintenanceRate":"0.125"},
        //                     { "maxVolume":"5000000", "initialRate":"1", "maintenanceRate":"0.25"}
        //                 ],
        //                 "rateMultipliers":{
        //                     "LimitBuy":"1",
        //                     "LimitSell":"1",
        //                     "Long":"1",
        //                     "MarketBuy":"1",
        //                     "MarketSell":"1",
        //                     "Short":"1",
        //                     "StopBuy":"0",
        //                     "StopSell":"0"
        //                 }
        //             },
        //             "clearing":{ "enabled":true, "index":".BTC3_TWAP"},
        //             "premium":{ "enabled":true, "index":".XBTUSD_Premium_IR_Corrected"},
        //             "riskAdjustment":{ "enabled":true, "index":".RiskAdjustment_IR"},
        //             "pricePrecision":2,
        //             "priceRange":{
        //                 "enabled":true,
        //                 "distance":"0.2",
        //                 "movingBoundary":"0.2",
        //                 "movingTime":60000000000,
        //                 "lowIndex":".XBTUSD_LOWRANGE",
        //                 "highIndex":".XBTUSD_HIGHRANGE"
        //             },
        //             "priceLimits":{ "enabled":true, "distance":"0.2", "lowIndex":".XBTUSD_LOWLIMIT", "highIndex":".XBTUSD_HIGHLIMIT" },
        //             "inverse":true,
        //             "tradingStartDate":"0001-01-01 00:00:00",
        //             "expiryDate":"0001-01-01 00:00:00"
        //         },
        //         { "type":"Index", "symbol":".ETHUSD_Asks", "tickSize":3, "enabled":true, "basis":365},
        //     ]
        //
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const market = response[i];
            const type = this.safeStringLower (market, 'type');
            const margin = (type === 'margin');
            const spot = (type === 'spot');
            if (spot || margin) {
                const id = this.safeString (market, 'symbol');
                const numericId = this.safeInteger (market, 'id');
                const baseId = this.safeString (market, 'baseCurrency');
                const quoteId = this.safeString (market, 'quoteCurrency');
                const base = this.safeCurrencyCode (baseId);
                const quote = this.safeCurrencyCode (quoteId);
                const symbol = (base && quote) ? (base + '/' + quote) : id;
                const maxCost = this.safeFloat (market, 'maxOrderQty');
                const minCost = this.safeFloat (market, 'minOrderQuantity');
                const pricePrecision = this.safeInteger2 (market, 'tickSize', 'pricePrecision');
                const tickValue = this.safeString (market, 'orderQtyStep');
                const amountPrecision = (tickValue === undefined) ? undefined : this.precisionFromString (tickValue);
                const precision = {
                    'price': pricePrecision,
                    'amount': amountPrecision,
                };
                const limits = {
                    'amount': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'price': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'cost': {
                        'min': minCost,
                        'max': maxCost,
                    },
                };
                const active = this.safeValue (market, 'enabled');
                result.push ({
                    'id': id,
                    'symbol': symbol,
                    'base': base,
                    'quote': quote,
                    'baseId': baseId,
                    'quoteId': quoteId,
                    'numericId': numericId,
                    'active': active,
                    'type': type,
                    'spot': spot,
                    'margin': margin,
                    'precision': precision,
                    'limits': limits,
                    'info': market,
                });
            }
        }
        return result;
    }

    async fetchCurrencies (params = {}) {
        const response = await this.publicGetCommonCurrencies (params);
        //
        //     {
        //         "BAB": {
        //             "name":"BAB",
        //             "title":"Bitcoin ABC",
        //             "blockchain":{
        //                 "name":"BAB",
        //                 "title":"Bitcoin ABC",
        //                 "deposit":{"confirmations":6},
        //                 "withdraw":{"confirmations":1},
        //                 "addressReuseAllowed":false,
        //                 "view":{
        //                     "uriTemplate":"bitcoinabc:%s?message=Xena Exchange",
        //                     "recommendedFee":"0.00001",
        //                     "transactionUrl":"https://blockchair.com/bitcoin-cash/transaction/${txId}",
        //                     "walletUrl":"https://blockchair.com/bitcoin-cash/address/${walletId}"
        //                 }
        //             },
        //             "precision":5,
        //             "withdraw":{"minAmount":"0.01","commission":"0.001"},
        //             "view":{
        //                 "color":"#DC7C08",
        //                 "site":"https://www.bitcoinabc.org"
        //             },
        //             "enabled":true
        //         },
        //     }
        const ids = Object.keys (response);
        const result = {};
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const currency = response[id];
            // todo: will need to rethink the fees
            // see: https://support.kraken.com/hc/en-us/articles/201893608-What-are-the-withdrawal-fees-
            // to add support for multiple withdrawal/deposit methods and
            // differentiated fees for each particular method
            const code = this.safeCurrencyCode (id);
            const name = this.safeString (currency, 'title');
            const precision = this.safeInteger (currency, 'precision');
            // assumes all currencies are active except those listed above
            const enabled = this.safeValue (currency, 'enabled');
            const active = enabled === true;
            const withdraw = this.safeValue (currency, 'withdraw', {});
            const minWithdrawAmount = this.safeFloat (withdraw, 'minAmount');
            const fee = this.safeFloat (withdraw, 'commission');
            result[code] = {
                'id': id,
                'code': code,
                'info': currency,
                'name': name,
                'active': active,
                'fee': fee,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': Math.pow (10, -precision),
                        'max': Math.pow (10, precision),
                    },
                    'price': {
                        'min': Math.pow (10, -precision),
                        'max': Math.pow (10, precision),
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'withdraw': {
                        'min': minWithdrawAmount,
                        'max': Math.pow (10, precision),
                    },
                },
            };
        }
        return result;
    }

    async fetchAccounts (params = {}) {
        const response = await this.privateGetTradingAccounts (params);
        //
        //     {
        //         "accounts": [
        //             { "id":8273231, "kind": "Spot" },
        //             { "id":10012833469, "kind": "Margin", "currency": "BTC" }
        //         ]
        //     }
        //
        const accounts = this.safeValue (response, 'accounts');
        const result = [];
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const accountId = this.safeString (account, 'id');
            const currencyId = this.safeString (account, 'currency');
            const code = this.safeCurrencyCode (currencyId);
            const type = this.safeStringLower (account, 'kind');
            result.push ({
                'id': accountId,
                'type': type,
                'currency': code,
                'info': account,
            });
        }
        return result;
    }

    async findAccountByType (type) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountsByType = this.groupBy (this.accounts, 'type');
        const accounts = this.safeValue (accountsByType, type);
        if (accounts === undefined) {
            throw new ExchangeError (this.id + " findAccountByType() could not find an accountId with type " + type + ", specify the 'accountId' parameter instead"); // eslint-disable-line quotes
        }
        const numAccounts = accounts.length;
        if (numAccounts > 1) {
            throw new ExchangeError (this.id + " findAccountByType() found more than one accountId with type " + type + ", specify the 'accountId' parameter instead"); // eslint-disable-line quotes
        }
        return accounts[0];
    }

    async getAccountId (params) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const defaultAccountId = this.safeString (this.options, 'accountId');
        const accountId = this.safeString (params, 'accountId', defaultAccountId);
        if (accountId !== undefined) {
            return accountId;
        }
        const defaultType = this.safeString2 (this.options, 'fetchBalance', 'defaultType', 'spot');
        const type = this.safeString (params, 'type', defaultType);
        params = this.omit (params, 'type');
        if (type === undefined) {
            throw new ArgumentsRequired (this.id + " fetchBalance() requires an 'accountId' parameter or a 'type' parameter ('spot' or 'margin')");
        }
        const account = await this.findAccountByType (type);
        return account['id'];
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountId = await this.getAccountId (params);
        const request = {
            'accountId': accountId,
        };
        const response = await this.privateGetTradingAccountsAccountIdBalance (this.extend (request, params));
        //
        //     {
        //         "balances": [
        //             {"available":"0","onHold":"0","settled":"0","equity":"0","currency":"BAB","lastUpdated":1564811790485125345},
        //             {"available":"0","onHold":"0","settled":"0","equity":"0","currency":"BSV","lastUpdated":1564811790485125345},
        //             {"available":"0","onHold":"0","settled":"0","equity":"0","currency":"BTC","lastUpdated":1564811790485125345},
        //         ]
        //     }
        //
        const result = { 'info': response };
        const balances = this.safeValue (response, 'balances', []);
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString (balance, 'currency');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeFloat (balance, 'available');
            account['used'] = this.safeFloat (balance, 'onHold');
            result[code] = account;
        }
        return this.parseBalance (result);
    }

    parseTrade (trade, market = undefined) {
        //
        // fetchMyTrades
        //
        //     {
        //         "account":8263118,
        //         "clOrdId":"Kw9664m22",
        //         "orderId":"7aa7f445-89be-47ec-b649-e0671e238609",
        //         "symbol":"BTC/USDT",
        //         "ordType":"Limit",
        //         "price":"8000",
        //         "transactTime":1557916859727908000,
        //         "execId":"9aa20f1f-5c73-408d-909d-07f74f04edfd",
        //         "tradeId":"220143240",
        //         "side":"Sell",
        //         "orderQty":"1",
        //         "leavesQty":"0",
        //         "cumQty":"1",
        //         "lastQty":"1",
        //         "lastPx":"8000",
        //         "avgPx":"0",
        //         "calculatedCcyLastQty":"8000",
        //         "netMoney":"8000",
        //         "commission":"0",
        //         "commCurrency":"USDT",
        //         "positionEffect":"UnknownPositionEffect"
        //     }
        //
        const id = this.safeString (trade, 'tradeId');
        let timestamp = this.safeInteger (trade, 'transactTime');
        if (timestamp !== undefined) {
            timestamp = parseInt (timestamp / 1e6);
        }
        const type = this.safeStringLower (trade, 'ordType');
        const side = this.safeStringLower (trade, 'side');
        const orderId = this.safeString (trade, 'orderId');
        let symbol = undefined;
        const marketId = this.safeString (trade, 'symbol');
        if (marketId !== undefined) {
            if (marketId in this.markets_by_id) {
                market = this.markets_by_id[symbol];
                symbol = market['id'];
            } else {
                const [ baseId, quoteId ] = marketId.split ('/');
                const base = this.safeCurrencyCode (baseId);
                const quote = this.safeCurrencyCode (quoteId);
                symbol = base + '/' + quote;
            }
        }
        const price = this.safeFloat (trade, 'price');
        const amount = this.safeFloat (trade, 'cumQty');
        let cost = this.safeFloat (trade, 'netMoney');
        if (cost === undefined) {
            if (price !== undefined) {
                if (amount !== undefined) {
                    cost = price * amount;
                }
            }
        }
        let fee = undefined;
        if ('fee_amount' in trade) {
            const feeCost = this.safeFloat (trade, 'commission');
            const feeCurrencyId = this.safeString (trade, 'commCurrency');
            const feeCurrencyCode = this.safeCurrencyCode (feeCurrencyId);
            fee = {
                'cost': feeCost,
                'currency': feeCurrencyCode,
            };
        }
        return {
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'type': type,
            'order': orderId,
            'side': side,
            'takerOrMaker': undefined,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        };
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountId = await this.getAccountId (params);
        const request = {
            'accountId': accountId,
            // 'page': 1,
            // 'limit': integer,
            // 'from': time,
            // 'to': time,
            // 'symbol': currency['id'],
            // 'trade_id': id,
            // 'client_order_id': id,
        };
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['from'] = since * 1e6;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetTradingAccountsAccountIdTradeHistory (this.extend (request, params));
        //
        //     [
        //         {
        //             "account":8263118,
        //             "clOrdId":"Kw9664m22",
        //             "orderId":"7aa7f445-89be-47ec-b649-e0671e238609",
        //             "symbol":"BTC/USDT",
        //             "ordType":"Limit",
        //             "price":"8000",
        //             "transactTime":1557916859727908000,
        //             "execId":"9aa20f1f-5c73-408d-909d-07f74f04edfd",
        //             "tradeId":"220143240",
        //             "side":"Sell",
        //             "orderQty":"1",
        //             "leavesQty":"0",
        //             "cumQty":"1",
        //             "lastQty":"1",
        //             "lastPx":"8000",
        //             "avgPx":"0",
        //             "calculatedCcyLastQty":"8000",
        //             "netMoney":"8000",
        //             "commission":"0",
        //             "commCurrency":"USDT",
        //             "positionEffect":"UnknownPositionEffect"
        //         },
        //         {
        //             "account":8263118,
        //             "clOrdId":"8yk33JO4b",
        //             "orderId":"fcd4d7c2-31c9-4e4b-96bc-bb241ddb392d",
        //             "symbol":"BTC/USDT",
        //             "ordType":"Limit",
        //             "price":"8000",
        //             "transactTime":1557912994901110000,
        //             "execId":"cef664d4-f438-4ad5-a7ad-279f725380d3",
        //             "tradeId":"220143239",
        //             "side":"Sell",
        //             "orderQty":"1",
        //             "leavesQty":"0",
        //             "cumQty":"1",
        //             "lastQty":"1",
        //             "lastPx":"8000",
        //             "avgPx":"0",
        //             "calculatedCcyLastQty":"8000",
        //             "netMoney":"8000",
        //             "commission":"0",
        //             "commCurrency":"USDT",
        //             "positionEffect":"UnknownPositionEffect"
        //         }
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    parseOHLCV (ohlcv, market = undefined, timeframe = '1m', since = undefined, limit = undefined) {
        let timestamp = this.safeInteger (ohlcv, '60');
        if (timestamp !== undefined) {
            timestamp = parseInt (timestamp / 1e6);
        }
        return [
            timestamp,
            this.safeFloat (ohlcv, '31'),
            this.safeFloat (ohlcv, '332'),
            this.safeFloat (ohlcv, '333'),
            this.safeFloat (ohlcv, '1025'),
            this.safeFloat (ohlcv, '330'),
        ];
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'marketId': market['id'],
            'timeframe': this.timeframes[timeframe],
        };
        if (since !== undefined) {
            request['from'] = since * 1e6;
        }
        const response = await this.publicGetMarketDataCandlesMarketIdTimeframe (this.extend (request, params));
        const candles = this.safeValue (response, '268', []);
        return this.parseOHLCVs (candles, market, timeframe, since, limit);
    }

    async createDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountId = await this.getAccountId (params);
        const currency = this.currency (code);
        const request = {
            'accountId': accountId,
            'currency': currency['id'],
        };
        const response = await this.privatePostTransfersAccountsAccountIdDepositAddressCurrency (this.extend (request, params));
        //
        //     {
        //         "address": "mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9",
        //         "uri": "bitcoin:mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9?message=Xena Exchange",
        //         "allowsRenewal": true
        //     }
        //
        const address = this.safeValue (response, 'address');
        const tag = undefined;
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'tag': tag,
            'info': response,
        };
    }

    async fetchDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountId = await this.getAccountId (params);
        const currency = this.currency (code);
        const request = {
            'accountId': accountId,
            'currency': currency['id'],
        };
        const response = await this.privateGetTransfersAccountsAccountIdDepositAddressCurrency (this.extend (request, params));
        //
        //     {
        //         "address": "mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9",
        //         "uri": "bitcoin:mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9?message=Xena Exchange",
        //         "allowsRenewal": true
        //     }
        //
        const address = this.safeValue (response, 'address');
        const tag = undefined;
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'tag': tag,
            'info': response,
        };
    }

    async fetchTransactionsByType (type, code = undefined, since = undefined, limit = undefined, params = {}) {
        if (code === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchTransactions() requires a currency `code` argument');
        }
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
        };
        if (since !== undefined) {
            request['since'] = parseInt (since / 1000);
        }
        const method = 'privateGetTransfersAccountsAccountId' + this.capitalize (type);
        const response = await this[method] (this.extend (request, params));
        //
        //     {
        //         "withdrawals": [
        //             {
        //                 "withdrawalRequestId": 47383243,
        //                 "externalId": "...",    // external ID submitted by the client when creating the request
        //                 "status": 1,
        //                 "statusMessage": "Pending confirmation",
        //                 "amount": "10.2",
        //                 "currency": "BTC",
        //                 "lastUpdated": <UNIX nanoseconds>,
        //                 "blockchain": "Bitcoin",
        //                 "address": "mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9",
        //                 "txId": "0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98"
        //             }
        //         ]
        //     }
        //
        //     {
        //         "deposits": [
        //             {
        //                 "currency": "BTC",
        //                 "amount": "1.2",
        //                 "status": 1,
        //                 "statusMessage": "Processing",
        //                 "blockchain": "Bitcoin",
        //                 "txId": "0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98",
        //                 "address": "mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9",
        //                 "lastUpdated": <UNIX nanoseconds>
        //                 "confirmations": 2,
        //                 "requiredConfirmations": 6
        //             }
        //         ]
        //     }
        //
        //
        const transactions = this.safeValue (response, 'withdrawals', []);
        return this.parseTransactions (transactions, currency, since, limit);
    }

    async fetchWithdrawals (code = undefined, since = undefined, limit = undefined, params = {}) {
        return await this.fetchTransactionsByType ('withdrawals', code, since, limit, params);
    }

    async fetchDeposits (code = undefined, since = undefined, limit = undefined, params = {}) {
        return await this.fetchTransactionsByType ('deposits', code, since, limit, params);
    }

    parseTransaction (transaction, currency = undefined) {
        //
        // withdraw()
        //
        //     {
        //         "withdrawalRequestId": 47383243,
        //         "status": 1,
        //         "statusMessage": "Pending confirmation"
        //     }
        //
        // fetchWithdrawals
        //
        //     {
        //         "withdrawalRequestId": 47383243,
        //         "externalId": "...",    // external ID submitted by the client when creating the request
        //         "status": 1,
        //         "statusMessage": "Pending confirmation",
        //         "amount": "10.2",
        //         "currency": "BTC",
        //         "lastUpdated": <UNIX nanoseconds>,
        //         "blockchain": "Bitcoin",
        //         "address": "mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9",
        //         "txId": "0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98"
        //     }
        //
        // fetchDeposits
        //
        //     {
        //         "currency": "BTC",
        //         "amount": "1.2",
        //         "status": 1,
        //         "statusMessage": "Processing",
        //         "blockchain": "Bitcoin",
        //         "txId": "0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98",
        //         "address": "mu5GceHFAG38mGRYCFqafe5ZiNKLX3rKk9",
        //         "lastUpdated": <UNIX nanoseconds>
        //         "confirmations": 2,
        //         "requiredConfirmations": 6
        //     }
        //
        const id = this.safeString (transaction, 'withdrawalRequestId');
        const type = (id === undefined) ? 'deposit' : 'withdrawal';
        let updated = this.safeInteger (transaction, 'lastUpdated');
        if (updated !== undefined) {
            updated = parseInt (updated / 1e6);
        }
        const timestamp = undefined;
        const txid = this.safeString (transaction, 'txId');
        const currencyId = this.safeString (transaction, 'currency');
        let code = this.safeCurrencyCode (currencyId, currency);
        const address = this.safeString (transaction, 'address');
        let addressFrom = undefined;
        let addressTo = undefined;
        if (type === 'deposit') {
            addressFrom = address;
        } else {
            addressTo = address;
        }
        const amount = this.safeFloat (transaction, 'amount');
        const status = this.parseTransactionStatus (this.safeString (transaction, 'status'));
        const fee = undefined;
        return {
            'info': transaction,
            'id': id,
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'addressFrom': addressFrom,
            'addressTo': addressTo,
            'address': address,
            'tagFrom': undefined,
            'tagTo': undefined,
            'tag': undefined,
            'type': type,
            'amount': amount,
            'currency': code,
            'status': status,
            'updated': updated,
            'fee': fee,
        };
    }

    parseTransactionStatus (status) {
        const statuses = {
            '1': 'pending', // new
            '2': 'ok', // completed
            '3': 'failed', // duplicate
            '4': 'failed', // not enough money
            '5': 'pending', // waiting for manual approval from XENA
            '100': 'pending', // request is being processed
            '101': 'pending', // request is being processed
            '102': 'pending', // request is being processed
            '103': 'pending', // request is being processed
        };
        return this.safeString (statuses, status, status);
    }

    async withdraw (code, amount, address, tag = undefined, params = {}) {
        this.checkAddress (address);
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountId = await this.getAccountId (params);
        const currency = this.currency (code);
        let uuid = this.uuid ();
        uuid = uuid.split ('-');
        uuid = uuid.join ('');
        const request = {
            'currency': currency['id'],
            'accountId': accountId,
            'amount': this.currencyToPrecision (code, amount),
            'address': address,
            'id': uuid, // mandatory external ID (string), used by the client to identify his request
        };
        const response = await this.privatePostTransfersAccountsAccountIdWithdrawals (this.extend (request, params));
        //
        //     {
        //         "withdrawalRequestId": 47383243,
        //         "status": 1,
        //         "statusMessage": "Pending confirmation"
        //     }
        //
        return this.parseTransaction (response, currency);
    }

    parseLedgerEntryType (type) {
        const types = {
            'deposit': 'transaction',
            'withdrawal': 'transaction',
            'internal deposit': 'transfer',
            'internal withdrawal': 'transfer',
            'rebate': 'rebate',
            'reward': 'reward',
        };
        return this.safeString (types, type, type);
    }

    parseLedgerEntry (item, currency = undefined) {
        //
        //     {
        //         "accountId":8263118,
        //         "ts":1551974415000000000,
        //         "amount":"-1",
        //         "currency":"BTC",
        //         "kind":"internal withdrawal",
        //         "commission":"0",
        //         "id":96
        //     }
        //
        const id = this.safeString (item, 'id');
        let direction = undefined;
        const account = this.safeString (item, 'accountId');
        const referenceId = undefined;
        const referenceAccount = undefined;
        const type = this.parseLedgerEntryType (this.safeString (item, 'kind'));
        const code = this.safeCurrencyCode (this.safeString (item, 'currency'), currency);
        let amount = this.safeFloat (item, 'amount');
        if (amount < 0) {
            direction = 'out';
            amount = Math.abs (amount);
        } else {
            direction = 'in';
        }
        let timestamp = this.safeInteger (item, 'ts');
        if (timestamp !== undefined) {
            timestamp = parseInt (timestamp / 1e6);
        }
        const fee = {
            'cost': this.safeFloat (item, 'commission'),
            'currency': code,
        };
        const before = undefined;
        const after = this.safeFloat (item, 'balance');
        const status = 'ok';
        return {
            'info': item,
            'id': id,
            'direction': direction,
            'account': account,
            'referenceId': referenceId,
            'referenceAccount': referenceAccount,
            'type': type,
            'currency': code,
            'amount': amount,
            'before': before,
            'after': after,
            'status': status,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'fee': fee,
        };
    }

    async fetchLedger (code = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        await this.loadAccounts ();
        const accountId = await this.getAccountId (params);
        const request = {
            'accountId': accountId,
            // 'page': 1,
            // 'limit': 5000, // max 5000
            // 'from': time,
            // 'to': time,
            // 'symbol': currency['id'],
            // 'trade_id': id,
            // 'client_order_id': id,
            // 'txid': txid,
            // 'kind': 'deposit', // 'withdrawal, 'internal deposit', 'internal withdrawal', 'rebate', 'reward'
        };
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
            request['symbol'] = currency['id'];
        }
        if (since !== undefined) {
            request['from'] = since * 1e6;
        }
        if (limit !== undefined) {
            request['limit'] = limit; // max 5000
        }
        const response = await this.privateGetTransfersAccountsAccountIdBalanceHistory (this.extend (request, params));
        //
        //     [
        //         {
        //             "accountId":8263118,
        //             "ts":1551974415000000000,
        //             "amount":"-1",
        //             "currency":"BTC",
        //             "kind":"internal withdrawal",
        //             "commission":"0",
        //             "id":96
        //         },
        //         {
        //             "accountId":8263118,
        //             "ts":1551964677000000000,
        //             "amount":"-1",
        //             "currency":"BTC",
        //             "kind":"internal deposit",
        //             "commission":"0",
        //             "id":95
        //         }
        //     ]
        //
        return this.parseLedger (response, currency, since, limit);
    }

    nonce () {
        return this.milliseconds ();
    }

    ecdsa (message, secret) {
        const EC = require ('elliptic').ec;
        const ecdsa = new EC ('p256');
        const privateKey = secret.slice (14, 78);
        const signature = ecdsa.sign (message, privateKey, { 'canonical': true });
        const sig = signature.r.toString (16) + signature.s.toString (16);
        return sig;
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'][api] + '/' + this.implodeParams (path, params);
        let query = this.omit (params, this.extractParams (path));
        if (api === 'public') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else if (api === 'private') {
            this.checkRequiredCredentials ();
            let nonce = this.nonce ();
            nonce *= 1e6;
            nonce = nonce.toString ();
            const payload = 'AUTH' + nonce;
            const hash = this.hash (this.encode (payload), 'sha256');
            const signature = this.ecdsa (this.encode (hash), this.encode (this.secret));
            headers = {
                'X-AUTH-API-KEY': this.apiKey,
                'X-AUTH-API-PAYLOAD': payload,
                'X-AUTH-API-SIGNATURE': signature,
                'X-AUTH-API-NONCE': nonce,
            };
            if (method === 'GET') {
                if (Object.keys (query).length) {
                    url += '?' + this.urlencode (query);
                }
            } else if (method === 'POST') {
                body = this.json (query);
                headers['Content-Type'] = 'application/json';
            }
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response) {
        if (response === undefined) {
            return;
        }
        //
        //     {"error":"Validation failed","fields":["address"]}
        //     {"error":"Money not enough. You have only: 0 ETH","fields":["amount"]}
        //
        if (code >= 400) {
            const feedback = this.id + ' ' + this.json (response);
            const message = this.safeString (response, 'error');
            const exact = this.exceptions['exact'];
            if (message in exact) {
                throw new exact[message] (feedback);
            }
            const broad = this.exceptions['broad'];
            const broadKey = this.findBroadlyMatchedKey (broad, message);
            if (broadKey !== undefined) {
                throw new broad[broadKey] (feedback);
            }
            throw new ExchangeError (feedback); // unknown message
        }
    }
};
