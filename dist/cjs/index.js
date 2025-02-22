"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlchemyWeb3 = void 0;
var tslib_1 = require("tslib");
var web3_1 = tslib_1.__importDefault(require("web3"));
var web3_core_subscriptions_1 = tslib_1.__importDefault(require("web3-core-subscriptions"));
var web3_eth_abi_1 = tslib_1.__importDefault(require("web3-eth-abi"));
var web3_utils_1 = require("web3-utils");
var hex_1 = require("./util/hex");
var promises_1 = require("./util/promises");
var alchemyContext_1 = require("./web3-adapter/alchemyContext");
var customRPC_1 = require("./web3-adapter/customRPC");
var eth_maxPriorityFeePerGas_1 = require("./web3-adapter/eth_maxPriorityFeePerGas");
var eth_PrivateTransactions_1 = require("./web3-adapter/eth_PrivateTransactions");
tslib_1.__exportStar(require("./alchemy-apis/types"), exports);
var DEFAULT_MAX_RETRIES = 3;
var DEFAULT_RETRY_INTERVAL = 1000;
var DEFAULT_RETRY_JITTER = 250;
var DEFAULT_CONTRACT_ADDRESS = "DEFAULT_TOKENS";
function createAlchemyWeb3(alchemyUrl, config) {
    var fullConfig = fillInConfigDefaults(config);
    var _a = alchemyContext_1.makeAlchemyContext(alchemyUrl, fullConfig), provider = _a.provider, jsonRpcSenders = _a.jsonRpcSenders, restSender = _a.restSender, setWriteProvider = _a.setWriteProvider;
    var alchemyWeb3 = new web3_1.default(provider);
    alchemyWeb3.setProvider = function () {
        throw new Error("setProvider is not supported in Alchemy Web3. To change the provider used for writes, use setWriteProvider() instead.");
    };
    alchemyWeb3.setWriteProvider = setWriteProvider;
    function getNfts(params, callback) {
        return callAlchemyRestEndpoint({
            restSender: restSender,
            callback: callback,
            params: params,
            path: "/v1/getNFTs/",
        });
    }
    alchemyWeb3.alchemy = {
        getTokenAllowance: function (params, callback) {
            return callAlchemyJsonRpcMethod({
                jsonRpcSenders: jsonRpcSenders,
                callback: callback,
                method: "alchemy_getTokenAllowance",
                params: [params],
            });
        },
        getTokenBalances: function (address, contractAddresses, callback) {
            return callAlchemyJsonRpcMethod({
                jsonRpcSenders: jsonRpcSenders,
                callback: callback,
                method: "alchemy_getTokenBalances",
                params: [address, contractAddresses || DEFAULT_CONTRACT_ADDRESS],
                processResponse: processTokenBalanceResponse,
            });
        },
        getTokenMetadata: function (address, callback) {
            return callAlchemyJsonRpcMethod({
                jsonRpcSenders: jsonRpcSenders,
                callback: callback,
                params: [address],
                method: "alchemy_getTokenMetadata",
            });
        },
        getAssetTransfers: function (params, callback) {
            return callAlchemyJsonRpcMethod({
                jsonRpcSenders: jsonRpcSenders,
                callback: callback,
                params: [
                    tslib_1.__assign(tslib_1.__assign({}, params), { fromBlock: params.fromBlock != null
                            ? hex_1.formatBlock(params.fromBlock)
                            : undefined, toBlock: params.toBlock != null ? hex_1.formatBlock(params.toBlock) : undefined, maxCount: params.maxCount != null ? web3_utils_1.toHex(params.maxCount) : undefined }),
                ],
                method: "alchemy_getAssetTransfers",
            });
        },
        getNftMetadata: function (params, callback) {
            return callAlchemyRestEndpoint({
                restSender: restSender,
                callback: callback,
                params: params,
                path: "/v1/getNFTMetadata/",
            });
        },
        getNfts: getNfts,
        getTransactionReceipts: function (params, callback) {
            return callAlchemyJsonRpcMethod({
                jsonRpcSenders: jsonRpcSenders,
                callback: callback,
                method: "alchemy_getTransactionReceipts",
                params: [params],
            });
        },
    };
    patchSubscriptions(alchemyWeb3);
    customRPC_1.patchEnableCustomRPC(alchemyWeb3);
    eth_maxPriorityFeePerGas_1.patchEthMaxPriorityFeePerGasMethod(alchemyWeb3);
    eth_PrivateTransactions_1.patchEthPrivateTransactionMethods(alchemyWeb3);
    return alchemyWeb3;
}
exports.createAlchemyWeb3 = createAlchemyWeb3;
function fillInConfigDefaults(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.writeProvider, writeProvider = _c === void 0 ? getWindowProvider() : _c, _d = _b.jsonRpcSenderMiddlewares, jsonRpcSenderMiddlewares = _d === void 0 ? [] : _d, _e = _b.maxRetries, maxRetries = _e === void 0 ? DEFAULT_MAX_RETRIES : _e, _f = _b.retryInterval, retryInterval = _f === void 0 ? DEFAULT_RETRY_INTERVAL : _f, _g = _b.retryJitter, retryJitter = _g === void 0 ? DEFAULT_RETRY_JITTER : _g;
    return {
        writeProvider: writeProvider,
        jsonRpcSenderMiddlewares: jsonRpcSenderMiddlewares,
        maxRetries: maxRetries,
        retryInterval: retryInterval,
        retryJitter: retryJitter,
    };
}
function getWindowProvider() {
    return typeof window !== "undefined" ? window.ethereum : null;
}
function callAlchemyJsonRpcMethod(_a) {
    var _this = this;
    var jsonRpcSenders = _a.jsonRpcSenders, method = _a.method, params = _a.params, _b = _a.callback, callback = _b === void 0 ? noop : _b, _c = _a.processResponse, processResponse = _c === void 0 ? identity : _c;
    var promise = (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, jsonRpcSenders.send(method, params)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, processResponse(result)];
            }
        });
    }); })();
    promises_1.callWhenDone(promise, callback);
    return promise;
}
function callAlchemyRestEndpoint(_a) {
    var _this = this;
    var restSender = _a.restSender, path = _a.path, params = _a.params, _b = _a.callback, callback = _b === void 0 ? noop : _b, _c = _a.processResponse, processResponse = _c === void 0 ? identity : _c;
    var fixedParams = fixArrayQueryParams(params);
    var promise = (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, restSender.sendRestPayload(path, fixedParams)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, processResponse(result)];
            }
        });
    }); })();
    promises_1.callWhenDone(promise, callback);
    return promise;
}
function processTokenBalanceResponse(rawResponse) {
    // Convert token balance fields from hex-string to decimal-string.
    var fixedTokenBalances = rawResponse.tokenBalances.map(function (balance) {
        return balance.tokenBalance != null
            ? tslib_1.__assign(tslib_1.__assign({}, balance), { tokenBalance: web3_eth_abi_1.default.decodeParameter("uint256", balance.tokenBalance) }) : balance;
    });
    return tslib_1.__assign(tslib_1.__assign({}, rawResponse), { tokenBalances: fixedTokenBalances });
}
/**
 * Updates Web3's internal subscription architecture to also handle Alchemy
 * specific subscriptions. This is to handle alternate namings of the existing
 * subscription endpoints, but the officially documented interfaces are
 * specified in the AlchemyEth interface.
 */
function patchSubscriptions(web3) {
    var eth = web3.eth;
    var oldSubscribe = eth.subscribe.bind(eth);
    eth.subscribe = (function (type) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        if (type === "alchemy_fullPendingTransactions" ||
            type === "alchemy_newFullPendingTransactions") {
            console.warn("This method is now deprecated. Please use `alchemy_pendingTransactions` instead.");
            return suppressNoSubscriptionExistsWarning(function () {
                return oldSubscribe.apply(void 0, tslib_1.__spreadArray(["alchemy_newFullPendingTransactions"], tslib_1.__read(rest)));
            });
        }
        if (type === "alchemy_filteredNewFullPendingTransactions" ||
            type === "alchemy_filteredPendingTransactions" ||
            type === "alchemy_filteredFullPendingTransactions") {
            console.warn("This method is now deprecated. Please use `alchemy_pendingTransactions` instead.");
            return suppressNoSubscriptionExistsWarning(function () {
                return oldSubscribe.apply(void 0, tslib_1.__spreadArray(["alchemy_filteredNewFullPendingTransactions"], tslib_1.__read(rest)));
            });
        }
        if (type === "alchemy_pendingTransactions") {
            return suppressNoSubscriptionExistsWarning(function () {
                return oldSubscribe.apply(void 0, tslib_1.__spreadArray(["alchemy_pendingTransactions"], tslib_1.__read(rest)));
            });
        }
        return oldSubscribe.apply(void 0, tslib_1.__spreadArray([type], tslib_1.__read(rest)));
    });
}
/**
 * VERY hacky wrapper to suppress a spurious warning when subscribing to an
 * Alchemy subscription that isn't built into Web3.
 */
function suppressNoSubscriptionExistsWarning(f) {
    var oldConsoleWarn = console.warn;
    console.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (typeof args[0] === "string" &&
            args[0].includes(" doesn't exist. Subscribing anyway.")) {
            return;
        }
        return oldConsoleWarn.apply(console, args);
    };
    try {
        return f();
    }
    finally {
        console.warn = oldConsoleWarn;
    }
}
/**
 * Another VERY hacky monkeypatch to make sure that we can take extra parameters to certain alchemy subscriptions
 * I hate doing this, but the other option is to fork web3-core and I think for now this is better
 */
var subscription = web3_core_subscriptions_1.default.subscription;
var oldSubscriptionPrototypeValidateArgs = subscription.prototype._validateArgs;
subscription.prototype._validateArgs = function (args) {
    if ([
        "alchemy_filteredNewFullPendingTransactions",
        "alchemy_filteredPendingTransactions",
        "alchemy_filteredFullPendingTransactions",
        "alchemy_pendingTransactions",
    ].includes(this.subscriptionMethod)) {
        // This particular subscription type is allowed to have additional parameters
    }
    else {
        if ([
            "alchemy_fullPendingTransactions",
            "alchemy_newFullPendingTransactions",
        ].includes(this.subscriptionMethod)) {
            if (this.options.subscription) {
                this.options.subscription.subscriptionName = this.subscriptionMethod;
            }
        }
        var validator = oldSubscriptionPrototypeValidateArgs.bind(this);
        validator(args);
    }
};
function noop() {
    // Nothing.
}
function identity(x) {
    return x;
}
/**
 * Alchemy's APIs receive multivalued params via keys with `[]` at the end.
 * Update any query params whose values are arrays to match this convention.
 */
function fixArrayQueryParams(params) {
    var result = {};
    Object.keys(params).forEach(function (key) {
        var value = params[key];
        var fixedKey = Array.isArray(value) ? toArrayKey(key) : key;
        result[fixedKey] = value;
    });
    return result;
}
function toArrayKey(key) {
    return endsWith(key, "[]") ? key : key + "[]";
}
/**
 * Like `String#endsWith`, for older environments.
 */
function endsWith(s, ending) {
    var index = s.lastIndexOf(ending);
    return index >= 0 && index === s.length - ending.length;
}
