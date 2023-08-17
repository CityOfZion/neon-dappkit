"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
/**
 * A version enum that indicates how a message should be signed
 */
var Version;
(function (Version) {
    Version[Version["LEGACY"] = 1] = "LEGACY";
    Version[Version["DEFAULT"] = 2] = "DEFAULT";
    Version[Version["WITHOUT_SALT"] = 3] = "WITHOUT_SALT";
})(Version = exports.Version || (exports.Version = {}));
