"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cells_1 = require("./Cells");
var Car = /** @class */ (function () {
    function Car(board) {
        this.board = board;
        this.pos = new Cells_1.Cell(0, 0);
        this.radius = 3;
        this.speed = 0.0;
        this.topSpeed = 7.0;
        this.acceleration = 0.03;
        this.style = 'rgb(' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ')';
    }
    Car.prototype.chooseFinalDest = function (current) {
        var options = this.board.findCellsInGroup(current);
        return options[Math.ceil(Math.random() * options.length) - 1];
    };
    Car.prototype.aStar = function (from, to) {
        var closedSet = [];
        var openSet = [from];
        var cameFrom = {};
        // For each node, the cost of getting from the start node to that node.
        var distFromStart = {};
        distFromStart[from.id] = 0;
        // Straight line distance as a heuristic
        function heuristicEstimate(a, b) {
            return a.distToCell(b);
        }
        function reconstructPath(cameFrom, current) {
            var totalPath = [current];
            while (Object.keys(cameFrom).indexOf(current.id.toString()) > -1) {
                current = cameFrom[current.id];
                totalPath.push(current);
            }
            return totalPath;
        }
        // For each node, the total cost of getting from the start node to the goal
        // by passing by that node. That value is partly known, partly heuristic.
        var estTotalLengthVia = {};
        estTotalLengthVia[from.id] = heuristicEstimate(from, to);
        while (openSet.length > 0) {
            // Current is the lowest fScore
            var current = void 0;
            current = openSet.sort(function (a, b) { return estTotalLengthVia[a.id] - estTotalLengthVia[b.id]; })[0];
            // If we've reached the target
            if (current.id === to.id) {
                return reconstructPath(cameFrom, current);
            }
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);
            var neighbours = this.board.findRoadsWithCell(current).options;
            for (var i = 0; i < neighbours.length; i++) {
                var neighbour = neighbours[i];
                if (closedSet.map(function (el) { return el.id; }).indexOf(neighbour.id) === -1) {
                    if (openSet.map(function (el) { return el.id; }).indexOf(neighbour.id) === -1) {
                        openSet.push(neighbour);
                    }
                    var possibleGScore = distFromStart[current.id] + current.distToCell(neighbour);
                    if (!distFromStart[neighbour.id] || possibleGScore < distFromStart[neighbour.id]) {
                        distFromStart[neighbour.id] = possibleGScore;
                        cameFrom[neighbour.id] = current;
                        estTotalLengthVia[neighbour.id] = distFromStart[neighbour.id] + heuristicEstimate(neighbour, to);
                    }
                }
            }
        }
        // Failed to find route
        return null;
    };
    // Get available options and set destination queue
    Car.prototype.chooseRoute = function () {
        var finalDest = this.chooseFinalDest(this.lastIntVisited);
        this.destinationQueue = this.aStar(this.lastIntVisited, finalDest).reverse();
    };
    Car.prototype.move = function () {
        if (this.destinationQueue.length > 0) {
            var distX = this.destinationQueue[0].x - this.pos.x;
            var distY = this.destinationQueue[0].y - this.pos.y;
            var totalDist = Math.abs(distX) + Math.abs(distY);
            // Calculate when you need to slow down
            // s = v^2 / 2*a
            // v = ((v0^2)-2*a*s)^(1/2)
            var stoppingDist = Math.pow(this.speed, 2) / (2.0 * this.acceleration);
            var maxStoppingSpeed = Math.sqrt(Math.pow(this.speed, 2) + (2 * this.acceleration * totalDist));
            // Accel, decel
            if (totalDist > stoppingDist) {
                this.speed += this.acceleration;
            }
            else if (totalDist <= stoppingDist) {
                this.speed -= this.acceleration;
            }
            this.speed = Math.min(maxStoppingSpeed, Math.min(this.topSpeed, Math.max(0.0, this.speed)));
            if (totalDist >= 1) {
                var angleToDest = Math.atan2(distY, distX);
                this.pos.x += this.speed * Math.cos(angleToDest);
                this.pos.y += this.speed * Math.sin(angleToDest);
            }
            else {
                this.pos.x = this.destinationQueue[0].x;
                this.pos.y = this.destinationQueue[0].y;
                this.speed = 0;
                this.lastIntVisited = this.destinationQueue[0];
                this.destinationQueue.splice(0, 1);
            }
        }
        else {
            // this.chooseFinalDest(this.lastIntVisited);
            this.chooseRoute();
            //this.move(); // Move without hesitation
        }
    };
    Car.prototype.render = function (ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.style;
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        // this.destinationQueue.forEach(cell => {
        //     ctx.beginPath();
        //     ctx.fillStyle = this.style;
        //     ctx.arc(cell.x, cell.y, 4, 0, 2 * Math.PI, false);
        //     ctx.fill();
        // });
        // ctx.beginPath();
        // ctx.fillStyle = this.style;
        // ctx.arc(this.destinationQueue[this.destinationQueue.length - 1].x, this.destinationQueue[this.destinationQueue.length - 1].y, 7, 0, 2 * Math.PI, false);
        // ctx.fill();
    };
    return Car;
}());
exports.Car = Car;
//# sourceMappingURL=Car.js.map