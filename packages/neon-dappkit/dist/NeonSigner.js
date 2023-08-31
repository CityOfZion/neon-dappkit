"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeonSigner = exports.SignMessageVersion = void 0;
const neon_dappkit_types_1 = require("@cityofzion/neon-dappkit-types");
Object.defineProperty(exports, "SignMessageVersion", { enumerable: true, get: function () { return neon_dappkit_types_1.SignMessageVersion; } });
const neon_core_1 = require("@cityofzion/neon-core");
const randombytes_1 = __importDefault(require("randombytes"));
const elliptic = __importStar(require("elliptic"));
const crypto = __importStar(require("crypto"));
class NeonSigner {
    constructor(account) {
        this.account = account;
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.account) {
                throw new Error('No account provided');
            }
            if (message.version === neon_dappkit_types_1.SignMessageVersion.CLASSIC) {
                return this.signMessageClassic(message.message);
            }
            else if (message.version === neon_dappkit_types_1.SignMessageVersion.WITHOUT_SALT) {
                return this.signMessageWithoutSalt(message.message);
            }
            else {
                return this.signMessageDefault(message.message);
            }
        });
    }
    signMessageClassic(message) {
        const salt = (0, randombytes_1.default)(16).toString('hex');
        const messageHex = this.classicFormat(`${salt}${message}`);
        return {
            publicKey: this.account.publicKey,
            data: neon_core_1.wallet.sign(messageHex, this.account.privateKey),
            salt,
            messageHex
        };
    }
    signMessageDefault(message) {
        const salt = (0, randombytes_1.default)(16).toString('hex');
        const messageHex = neon_core_1.u.str2hexstring(message);
        return {
            publicKey: this.account.publicKey,
            data: neon_core_1.wallet.sign(messageHex, this.account.privateKey, salt),
            salt,
            messageHex
        };
    }
    signMessageWithoutSalt(message) {
        const messageHex = this.classicFormat(message);
        return {
            publicKey: this.account.publicKey,
            data: neon_core_1.wallet.sign(messageHex, this.account.privateKey),
            messageHex,
        };
    }
    classicFormat(message) {
        const parameterHexString = neon_core_1.u.str2hexstring(message);
        const lengthHex = neon_core_1.u.num2VarInt(parameterHexString.length / 2);
        return `010001f0${lengthHex}${parameterHexString}0000`;
    }
    verifyMessage(verifyArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            return neon_core_1.wallet.verify(verifyArgs.messageHex, verifyArgs.data, verifyArgs.publicKey);
        });
    }
    /**
     * returns the address of the account
     */
    getAccountAddress() {
        var _a, _b;
        return (_b = (_a = this.account) === null || _a === void 0 ? void 0 : _a.address) !== null && _b !== void 0 ? _b : null;
    }
    encrypt(message, publicKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            const curve = new elliptic.ec('p256');
            const messageBuffer = new TextEncoder().encode(message);
            return publicKeys.map((publicKey) => {
                const pub = curve.keyFromPublic(publicKey, 'hex').getPublic();
                const ephem = curve.genKeyPair();
                const ephemPublicKey = ephem.getPublic(true, 'hex');
                // create the shared ECHD secret
                const px = ephem.derive(pub);
                // hash the secret
                const hash = crypto.createHash('sha512').update(px.toString('hex')).digest();
                // define the initiation vector
                const iv = crypto.randomBytes(16);
                const encryptionKey = hash.subarray(0, 32);
                const macKey = hash.subarray(32);
                const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
                const firstChunk = cipher.update(messageBuffer);
                const secondChunk = cipher.final();
                const ciphertext = Buffer.concat([firstChunk, secondChunk]);
                const dataToMac = Buffer.concat([iv, Buffer.from(ephemPublicKey, 'hex'), ciphertext]);
                const hmacSha = crypto.createHmac('sha256', macKey).update(dataToMac).digest();
                const mac = Buffer.from(hmacSha);
                return {
                    randomVector: iv.toString('hex'),
                    cipherText: ciphertext.toString('hex'),
                    dataTag: mac.toString('hex'),
                    ephemPublicKey
                };
            });
        });
    }
    decrypt(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.account) {
                throw new Error('No account provided');
            }
            const curve = new elliptic.ec('p256');
            const ephemPublicKey = curve.keyFromPublic(payload.ephemPublicKey, 'hex');
            const privKey = curve.keyFromPrivate(this.account.privateKey, 'hex');
            const px = privKey.derive(ephemPublicKey.getPublic());
            const hash = crypto.createHash('sha512').update(px.toString('hex')).digest();
            const encryptionKey = hash.subarray(0, 32);
            // verify the hmac
            const macKey = hash.subarray(32);
            const dataToMac = Buffer.concat([Buffer.from(payload.randomVector, 'hex'), Buffer.from(payload.ephemPublicKey, 'hex'), Buffer.from(payload.cipherText, 'hex')]);
            const realMac = crypto.createHmac('sha256', macKey).update(dataToMac).digest();
            if (payload.dataTag !== realMac.toString('hex')) {
                throw new Error('invalid payload: hmac misalignment');
            }
            const cipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, Buffer.from(payload.randomVector, 'hex'));
            const firstChunk = cipher.update(Buffer.from(payload.cipherText, 'hex'));
            const secondChunk = cipher.final();
            return new TextDecoder().decode(Buffer.concat([firstChunk, secondChunk]));
        });
    }
    decryptFromArray(payloads) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let [index, payload] of payloads.entries()) {
                try {
                    const message = yield this.decrypt(payload);
                    return { message, keyIndex: index };
                }
                catch (e) {
                    // do nothing
                }
            }
            throw new Error('Could not decrypt message from array');
        });
    }
}
exports.NeonSigner = NeonSigner;
