"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fluent_logger_1 = __importDefault(require("fluent-logger"));
var os_1 = __importDefault(require("os"));
var defaultId = process.env.HOSTNAME || os_1.default.hostname() || 'unknown';
var defaultFluentHost = 'localhost';
var defaultFluentPort = 24224;
var defaultFluentTimeout = 3.0;
var defaultRequireAckResponse = false;
var defaultReconnectInterval = 30000;
var defaultTls = false;
function createFluentTransport(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.host, host = _c === void 0 ? defaultFluentHost : _c, _d = _b.port, port = _d === void 0 ? defaultFluentPort : _d, _e = _b.timeout, timeout = _e === void 0 ? defaultFluentTimeout : _e, _f = _b.requireAckResponse, requireAckResponse = _f === void 0 ? defaultRequireAckResponse : _f, security = _b.security, tls = _b.tls, tlsOptions = _b.tlsOptions;
    var fluentTransport = fluent_logger_1.default.support.winstonTransport();
    return new fluentTransport({
        host: host,
        port: port,
        requireAckResponse: requireAckResponse,
        security: security,
        timeout: timeout,
        tls: tls,
        tlsOptions: tlsOptions,
    });
}
exports.createFluentTransport = createFluentTransport;
//# sourceMappingURL=fluent.js.map