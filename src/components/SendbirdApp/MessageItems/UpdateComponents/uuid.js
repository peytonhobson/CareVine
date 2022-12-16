Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv4 = void 0;
exports.uuidv4 = function () { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    var v = (c === 'x') ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
}); };
exports.default = exports.uuidv4;
