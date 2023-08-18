"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignMessageVersion = void 0;
/**
 * A version enum that indicates how a message should be signed
 */
var SignMessageVersion;
(function (SignMessageVersion) {
    SignMessageVersion[SignMessageVersion["CLASSIC"] = 1] = "CLASSIC";
    SignMessageVersion[SignMessageVersion["DEFAULT"] = 2] = "DEFAULT";
    SignMessageVersion[SignMessageVersion["WITHOUT_SALT"] = 3] = "WITHOUT_SALT";
})(SignMessageVersion = exports.SignMessageVersion || (exports.SignMessageVersion = {}));
