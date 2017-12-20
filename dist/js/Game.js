"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx = require("rxjs");
var Board_1 = require("./Board");
var Car_1 = require("./Car");
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.numClicks = 0;
        this.play = function () {
            requestAnimationFrame(_this.play);
            _this.board.render();
            if (_this.mouse) {
                _this.board.onHover(_this.mouse.clientX, _this.mouse.clientY);
            }
            _this.vehicles.forEach(function (vehicle) {
                vehicle.move();
                vehicle.render(_this.ctx);
            });
        };
        this.canvas = document.getElementById("cnvs");
        this.ctx = this.canvas.getContext("2d");
        this.board = new Board_1.Board(this.canvas, this.ctx);
        this.vehicles = [];
        Rx.Observable.fromEvent(this.canvas, 'mousemove')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(function (e) {
            _this.mouse = e;
        });
        Rx.Observable.fromEvent(this.canvas, 'click')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(function (e) {
            var event = e;
            var x = event.clientX;
            var y = event.clientY;
            _this.numClicks++;
            _this.board.planNewRoad(x, y);
            if (_this.board.roads.length > 0 && _this.numClicks % 2 === 0) {
                _this.addVehicle();
            }
        });
    }
    Game.prototype.addVehicle = function () {
        var newVehicle = new Car_1.Car(this.board);
        newVehicle.pos.x = this.board.roads[0].from.x;
        newVehicle.pos.y = this.board.roads[0].from.y;
        newVehicle.destinationQueue = [this.board.roads[0].to];
        this.vehicles.push(newVehicle);
    };
    return Game;
}());
exports.Game = Game;
//# sourceMappingURL=Game.js.map