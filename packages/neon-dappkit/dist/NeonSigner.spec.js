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
const index_1 = require("./index");
const Neon = __importStar(require("@cityofzion/neon-core"));
const assert_1 = __importDefault(require("assert"));
describe('NeonSigner', function () {
    it("can sign and verify", () => __awaiter(this, void 0, void 0, function* () {
        const acc = new Neon.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014');
        const signer = new index_1.NeonSigner(acc);
        const signed = yield signer.signMessage({
            version: index_1.SignMessageVersion.DEFAULT,
            message: 'my random message'
        });
        (0, assert_1.default)(signed.salt.length > 0);
        (0, assert_1.default)(signed.messageHex.length > 0);
        (0, assert_1.default)(signed.data.length > 0);
        (0, assert_1.default)(signed.publicKey.length > 0);
        const verified = yield signer.verifyMessage(signed);
        (0, assert_1.default)(verified);
    }));
    it("can sign using classic version and verify", () => __awaiter(this, void 0, void 0, function* () {
        const acc = new Neon.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014');
        const signer = new index_1.NeonSigner(acc);
        const signed = yield signer.signMessage({
            version: index_1.SignMessageVersion.CLASSIC,
            message: 'my random message'
        });
        (0, assert_1.default)(signed.salt.length > 0);
        (0, assert_1.default)(signed.messageHex.length > 0);
        (0, assert_1.default)(signed.data.length > 0);
        (0, assert_1.default)(signed.publicKey.length > 0);
        const verified = yield signer.verifyMessage(signed);
        (0, assert_1.default)(verified);
    }));
    it("can sign with no salt and verify", () => __awaiter(this, void 0, void 0, function* () {
        const acc = new Neon.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014');
        const signer = new index_1.NeonSigner(acc);
        const signed = yield signer.signMessage({
            version: index_1.SignMessageVersion.WITHOUT_SALT,
            message: 'my random message'
        });
        (0, assert_1.default)(signed.salt === undefined);
        (0, assert_1.default)(signed.messageHex.length > 0);
        (0, assert_1.default)(signed.data.length > 0);
        (0, assert_1.default)(signed.publicKey.length > 0);
        const verified = yield signer.verifyMessage(signed);
        (0, assert_1.default)(verified);
    }));
    it("can verify", () => __awaiter(this, void 0, void 0, function* () {
        const signer = new index_1.NeonSigner();
        const verified = yield signer.verifyMessage({
            publicKey: '031757edb62014dea820a0b33a156f6a59fc12bd966202f0e49357c81f26f5de34',
            data: 'aeb234ed1639e9fcc95a102633b1c70ca9f9b97e9592cc74bfc40cbc7fefdb19ae8c6b49ebd410dbcbeec6b5906e503d528e34cd5098cc7929dbcbbaf23c5d77',
            salt: '052a55a8d56b73b342a8e41da3050b09',
            messageHex: '010001f0a0303532613535613864353662373362333432613865343164613330353062303965794a68624763694f694a49557a49314e694973496e523563434936496b705856434a392e65794a6c654841694f6a45324e444d304e7a63324e6a4d73496d6c68644349364d5459304d7a4d354d5449324d33302e7253315f73735230364c426778744831504862774c306d7a6557563950686d5448477a324849524f4a4f340000'
        });
        (0, assert_1.default)(verified);
    }));
    it("can verify when failing", () => __awaiter(this, void 0, void 0, function* () {
        const signer = new index_1.NeonSigner();
        const verified = yield signer.verifyMessage({
            publicKey: '031757edb62014dea820a0b33a156f6a59fc12bd966202f0e49357c81f26f5de34',
            data: '4fe1b478cf76564b2133bdff9ba97d8a360ce36d0511918931cda207c2ce589dfc07ec5d8b93ce7c3b70fc88b676cc9e08f9811bf0d5b5710a20f10c58191bfb',
            salt: '733ceb4d4e8ffdc83ecc6e35c4498999',
            messageHex: '010001f05c3733336365623464346538666664633833656363366533356334343938393939436172616c686f2c206d756c65712c206f2062616775697520656820697373756d65726d6f2074616978206c696761646f206e61206d697373e36f3f0000'
        });
        (0, assert_1.default)(!verified);
    }));
    it("can encrypt and decrypt messages from the corresponding public key", () => __awaiter(this, void 0, void 0, function* () {
        const account = new Neon.wallet.Account();
        const signer = new index_1.NeonSigner(account);
        const messageOriginal = "Some plaintext for encryption";
        const messageEncrypted = yield signer.encrypt(messageOriginal, [account.publicKey]);
        const messageDecrypted = yield signer.decrypt(messageEncrypted[0]);
        for (const value of Object.values(messageEncrypted[0])) {
            (0, assert_1.default)(!messageOriginal.includes(value));
        }
        (0, assert_1.default)(messageDecrypted === messageOriginal);
    }));
    it("can NOT encrypt and decrypt messages from different public keys", () => __awaiter(this, void 0, void 0, function* () {
        const account = new Neon.wallet.Account();
        const anotherAccount = new Neon.wallet.Account();
        const signer = new index_1.NeonSigner(account);
        const messageOriginal = "Some plaintext for encryption";
        const messageEncrypted = signer.encrypt(messageOriginal, [anotherAccount.publicKey]);
        assert_1.default.rejects(() => __awaiter(this, void 0, void 0, function* () { return yield signer.decrypt(messageEncrypted[0]); }), /Decrypt failed. Event not found in string result/, 'Decrypt failed');
    }));
    it("can encrypt and decrypt messages from an array that has the corresponding public key", () => __awaiter(this, void 0, void 0, function* () {
        const account = new Neon.wallet.Account();
        const anotherAccount1 = new Neon.wallet.Account();
        const anotherAccount2 = new Neon.wallet.Account();
        const anotherAccount3 = new Neon.wallet.Account();
        const signer = new index_1.NeonSigner(account);
        const messageOriginal = "Some plaintext for encryption";
        const publicKeys = [anotherAccount3.publicKey, anotherAccount2.publicKey, anotherAccount1.publicKey, account.publicKey];
        const messageEncrypted = yield signer.encrypt(messageOriginal, publicKeys);
        const messageDecrypted = yield signer.decryptFromArray(messageEncrypted);
        (0, assert_1.default)(messageDecrypted.message === messageOriginal);
        (0, assert_1.default)(messageDecrypted.keyIndex === publicKeys.length - 1);
        const anotherSigner = new index_1.NeonSigner(anotherAccount1);
        const anotherMessageDecrypted = yield anotherSigner.decryptFromArray(messageEncrypted);
        (0, assert_1.default)(anotherMessageDecrypted.message === messageOriginal);
        (0, assert_1.default)(anotherMessageDecrypted.keyIndex !== messageDecrypted.keyIndex);
        (0, assert_1.default)(anotherMessageDecrypted.keyIndex === publicKeys.length - 2);
    }));
    it("can NOT encrypt and decrypt messages from an array that doesn't have the corresponding public key", () => __awaiter(this, void 0, void 0, function* () {
        const account = new Neon.wallet.Account();
        const anotherAccount1 = new Neon.wallet.Account();
        const anotherAccount2 = new Neon.wallet.Account();
        const anotherAccount3 = new Neon.wallet.Account();
        const signer = new index_1.NeonSigner(account);
        const messageOriginal = "Some plaintext for encryption";
        const publicKeys = [anotherAccount3.publicKey, anotherAccount2.publicKey, anotherAccount1.publicKey];
        const messageEncrypted = yield signer.encrypt(messageOriginal, publicKeys);
        assert_1.default.rejects(() => __awaiter(this, void 0, void 0, function* () { return yield signer.decryptFromArray(messageEncrypted); }), /Decrypt failed. Event not found in decryptFromArray result/, 'Decrypt failed');
    }));
});
