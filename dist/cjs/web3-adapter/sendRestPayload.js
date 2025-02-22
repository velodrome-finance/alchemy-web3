"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRestPayloadSender = void 0;
var tslib_1 = require("tslib");
var fetch_ponyfill_1 = tslib_1.__importDefault(require("fetch-ponyfill"));
var urijs_1 = tslib_1.__importDefault(require("urijs"));
var promises_1 = require("../util/promises");
function makeRestPayloadSender(_a) {
    var _this = this;
    var url = _a.url, config = _a.config;
    // The rest payload sender only works for alchemy.com http endpoints.
    var error;
    if (/^wss?:\/\//.test(url)) {
        error = "Alchemy rest endpoints are not available via websockets";
    }
    if (!url.includes("alchemy")) {
        error =
            "Alchemy specific rest endpoints are not available with a non Alchemy provider.";
    }
    if (url.includes("alchemyapi.io") && !url.includes("eth-")) {
        error =
            "Alchemy specific rest endpoints on L2 networks are not available with our legacy endpoints on alchemyapi.io. Please switch over to alchemy.com";
    }
    // Don't use the native `URL` class for this. It doesn't work in React Native.
    var urlObject = new urijs_1.default(url);
    var origin = urlObject.origin();
    var pathname = urlObject.path();
    var apiKey = pathname.substring(pathname.lastIndexOf("/") + 1);
    var fetch = fetch_ponyfill_1.default().fetch;
    var sendRestPayload = function (path, payload) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var maxRetries, retryInterval, retryJitter, endpoint, i, response, status_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (error) {
                        throw new Error(error);
                    }
                    maxRetries = config.maxRetries, retryInterval = config.retryInterval, retryJitter = config.retryJitter;
                    if (!(origin && apiKey)) return [3 /*break*/, 6];
                    endpoint = new urijs_1.default(origin)
                        .search(payload)
                        .path(apiKey + path)
                        .toString();
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < maxRetries + 1)) return [3 /*break*/, 5];
                    return [4 /*yield*/, fetch(endpoint)];
                case 2:
                    response = _a.sent();
                    status_1 = response.status;
                    switch (status_1) {
                        case 200:
                            return [2 /*return*/, response.json()];
                        case 429:
                            break;
                        default:
                            throw new Error(response.status + ":" + response.statusText);
                    }
                    return [4 /*yield*/, promises_1.delay(retryInterval + ((retryJitter * Math.random()) | 0))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: throw new Error("Rate limited for " + (maxRetries + 1) + " consecutive attempts.");
                case 6: return [2 /*return*/, Promise.resolve()];
            }
        });
    }); };
    return {
        sendRestPayload: sendRestPayload,
    };
}
exports.makeRestPayloadSender = makeRestPayloadSender;
