"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Road = /** @class */ (function () {
    function Road(from, to) {
        this.from = from;
        this.to = to;
        this.id = this.hash(from, to);
    }
    Road.prototype.hash = function (from, to) {
        var smaller = from.id < to.id ? from.id : to.id;
        var bigger = from.id < to.id ? to.id : from.id;
        var seed = smaller.toString() + '-' + bigger.toString();
        var hash = 0, i, chr;
        if (seed.length === 0)
            return hash;
        for (i = 0; i < seed.length; i++) {
            chr = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
    return Road;
}());
exports.Road = Road;
var Cell = /** @class */ (function () {
    function Cell(x, y) {
        this.x = x;
        this.y = y;
        this.id = this.hash(x, y);
    }
    Cell.prototype.hash = function (x, y) {
        var seed = x.toString() + '-' + y.toString();
        var hash = 0, i, chr;
        if (seed.length === 0)
            return hash;
        for (i = 0; i < seed.length; i++) {
            chr = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
    return Cell;
}());
exports.Cell = Cell;
//# sourceMappingURL=Cells.js.map