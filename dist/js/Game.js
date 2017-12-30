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
            // AA fix
            _this.ctx.translate(0.5, 0.5);
            requestAnimationFrame(_this.play);
            _this.board.render();
            if (_this.mouse) {
                var rect = _this.canvas.getBoundingClientRect();
                _this.board.onHover(_this.mouse.clientX - rect.left, _this.mouse.clientY - rect.top);
            }
            _this.vehicles.forEach(function (vehicle) {
                vehicle.move();
                vehicle.render(_this.ctx);
            });
            // AA fix reset
            _this.ctx.translate(-0.5, -0.5);
        };
        this.canvas = document.getElementById("cnvs");
        this.ctx = this.canvas.getContext("2d");
        this.board = new Board_1.Board(this.canvas, this.ctx, 3);
        this.vehicles = [];
        var mouseDown = false;
        var startX = 0;
        var startY = 0;
        Rx.Observable.fromEvent(this.canvas, 'mousedown').subscribe(function (e) {
            mouseDown = true;
            var m = e;
            startX = m.clientX;
            startY = m.clientY;
        });
        Rx.Observable.fromEvent(this.canvas, 'mousemove').subscribe(function (e) {
            _this.mouse = e;
            // If it's a drag 
            if (mouseDown && Math.abs(_this.mouse.clientX - startX) + Math.abs(_this.mouse.clientY - startY) > 10) {
                mouseDown = false;
                var rect = _this.canvas.getBoundingClientRect();
                _this.numClicks++;
                _this.board.planNewRoad(startX - rect.left, startY - rect.top);
            }
        });
        Rx.Observable.fromEvent(this.canvas, 'mouseup')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(function (e) {
            mouseDown = false;
            var event = e;
            var rect = _this.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
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