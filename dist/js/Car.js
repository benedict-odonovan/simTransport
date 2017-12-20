"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cells_1 = require("./Cells");
var Car = /** @class */ (function () {
    function Car(board) {
        this.board = board;
        this.pos = new Cells_1.Cell(0, 0);
        this.radius = 3;
        this.speed = 5;
        this.style = 'rgb(' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ')';
    }
    // Get available options and set destination queue
    Car.prototype.chooseRoute = function () {
        var options = this.board.findRoadsWithCell(this.currentCell).options;
        this.destinationQueue = [];
        var chosenOption = options[Math.ceil(Math.random() * options.length) - 1];
        this.destinationQueue.push(chosenOption);
        return this.destinationQueue[0];
    };
    Car.prototype.move = function () {
        // Either move to the destination exactly or clear the destination
        if (this.destinationQueue.length > 0) {
            var distX = this.destinationQueue[0].x - this.pos.x;
            var distY = this.destinationQueue[0].y - this.pos.y;
            this.direction = Math.atan2(distY, distX);
            if (Math.abs(distX) > this.speed + 2 || Math.abs(distY) > this.speed + 2) {
                this.pos.x += this.speed * Math.cos(this.direction);
                this.pos.y += this.speed * Math.sin(this.direction);
            }
            else {
                this.pos.x = this.destinationQueue[0].x;
                this.pos.y = this.destinationQueue[0].y;
                this.currentCell = this.destinationQueue[0];
                this.destinationQueue.splice(0, 1);
            }
        }
        else {
            this.chooseRoute();
            this.move();
        }
    };
    Car.prototype.render = function (ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.style;
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fill();
    };
    return Car;
}());
exports.Car = Car;
//# sourceMappingURL=Car.js.map