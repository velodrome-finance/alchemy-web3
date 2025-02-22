"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJsonRpcHttpSender = void 0;
var tslib_1 = require("tslib");
var fetch_ponyfill_1 = tslib_1.__importDefault(require("fetch-ponyfill"));
var _a = fetch_ponyfill_1.default(), fetch = _a.fetch, Headers = _a.Headers;
var ALCHEMY_HEADERS = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
});
var RATE_LIMIT_STATUS = 429;
function makeJsonRpcHttpSender(url) {
    var _this = this;
    return function (request) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var response, status, _a;
        var _b, _c;
        var _d;
        return tslib_1.__generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, fetch(url, {
                        method: "POST",
                        headers: ALCHEMY_HEADERS,
                        body: JSON.stringify(request),
                    })];
                case 1:
                    response = _e.sent();
                    status = response.status;
                    _a = status;
                    switch (_a) {
                        case 200: return [3 /*break*/, 2];
                        case RATE_LIMIT_STATUS: return [3 /*break*/, 4];
                        case 0: return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 6];
                case 2:
                    _b = { type: "jsonrpc" };
                    return [4 /*yield*/, response.json()];
                case 3: return [2 /*return*/, (_b.response = _e.sent(), _b)];
                case 4: return [2 /*return*/, { type: "rateLimit" }];
                case 5: return [2 /*return*/, {
                        type: "networkError",
                        status: 0,
                        message: "Connection failed.",
                    }];
                case 6:
                    _c = {
                        status: status,
                        type: "networkError"
                    };
                    return [4 /*yield*/, response.json()];
                case 7: return [2 /*return*/, (_c.message = (_d = (_e.sent()).error) === null || _d === void 0 ? void 0 : _d.message,
                        _c)];
            }
        });
    }); };
}
exports.makeJsonRpcHttpSender = makeJsonRpcHttpSender;
