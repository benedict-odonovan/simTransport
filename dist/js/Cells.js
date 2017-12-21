"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Road = /** @class */ (function () {
    function Road(from, to) {
        this.from = from;
        this.to = to;
        this.style = 'rgba(0,0,0,0.5)';
        this.roadWidth = 10;
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
    Road.prototype.halfway = function () {
        var hX = (this.from.x + this.to.x) / 2;
        var hY = (this.from.y + this.to.y) / 2;
        return new Cell(hX, hY);
    };
    Road.prototype.length = function () {
        return this.to.distToCell(this.from);
    };
    Road.prototype.render = function (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.style;
        ctx.lineWidth = this.roadWidth;
        ctx.lineCap = 'round';
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
        // ctx.beginPath();
        // ctx.font = "14px Arial";
        // ctx.fillStyle = "rgb(0,100,255)";
        // const halfway = this.halfway();
        // ctx.fillText(this.id.toString(), halfway.x, halfway.y);
        // ctx.fill();
    };
    return Road;
}());
exports.Road = Road;
var Cell = /** @class */ (function () {
    function Cell(x, y) {
        this.x = x;
        this.y = y;
        x = Math.round(x);
        y = Math.round(y);
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
    Cell.prototype.distToCell = function (b) {
        return Math.abs(this.x - b.x) + Math.abs(this.y - b.y);
    };
    return Cell;
}());
exports.Cell = Cell;
//# sourceMappingURL=Cells.js.map