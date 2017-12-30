"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cells_1 = require("./Cells");
var Board = /** @class */ (function () {
    function Board(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        // Grid
        this.gridSize = 5; // Pixels
        this.lastHovered = { x: 0, y: 0 };
        // Roads
        this.roads = [];
        this.roadSnapDistance = 20;
        this.roadWidth = 10;
        // Intersections
        this.intersections = [];
        this.intSnapDistance = 30;
        this.intRadius = 10;
        this.connectedInts = [];
        // Styles
        this.gridColor = 'rgb(240,240,240)';
        this.hoverColor = 'rgb(0,0,0)';
        this.pendingRoadColor = 'rgba(0,0,0,0.2)';
        this.intersectionColor = 'rgb(0,120,120)';
        this.fillPageWithCanvas();
        //this.initGrid();
    }
    // Grid creation
    Board.prototype.initGrid = function () {
        this.cells = [];
        var i = 0;
        this.ctx.lineWidth = 1;
        for (var x = 0; x < window.innerWidth; x += this.gridSize) {
            this.cells.push([]);
            for (var y = 0; y < window.innerHeight; y += this.gridSize) {
                var cell = new Cells_1.Cell(x, y);
                this.cells[x / this.gridSize].push(cell);
                i++;
            }
        }
        this.drawGrid();
    };
    // Road Creation
    Board.prototype.planNewRoad = function (x, y) {
        // Connect to nearest road
        var nearestRoadEnd = this.autoConnect(x, y);
        x = nearestRoadEnd.x;
        y = nearestRoadEnd.y;
        // Only add road on the second click
        if (!this.roadStart) {
            this.roadStart = new Cells_1.Cell(x, y);
        }
        else {
            var newRoad_1 = new Cells_1.Road(this.roadStart, new Cells_1.Cell(x, y));
            // No duplicates
            if (this.roads.every(function (road) { return road.id !== newRoad_1.id; })) {
                this.createNewRoad(newRoad_1);
            }
            this.roadStart = null;
        }
    };
    Board.prototype.getPointToRoadDist = function (point, road) {
        function sqr(x) { return x * x; }
        function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
        function distToSegment(point, from, to) {
            var roadLength = dist2(from, to);
            // If the road is just a point then return the point to point distance
            if (roadLength == 0)
                return { dist: Math.sqrt(dist2(point, from)), x: point.x, y: point.y };
            // % of the way down the line
            var t = ((point.x - from.x) * (to.x - from.x) + (point.y - from.y) * (to.y - from.y)) / roadLength;
            t = Math.max(0, Math.min(1, t));
            var intX = from.x + t * (to.x - from.x);
            var intY = from.y + t * (to.y - from.y);
            return {
                dist: Math.sqrt(dist2(point, new Cells_1.Cell(intX, intY))),
                x: intX,
                y: intY
            };
        }
        return distToSegment(point, road.from, road.to);
    };
    Board.prototype.getIntersection = function (road1, road2) {
        var line1StartX = road1.from.x;
        var line1StartY = road1.from.y;
        var line1EndX = road1.to.x;
        var line1EndY = road1.to.y;
        var line2StartX = road2.from.x;
        var line2StartY = road2.from.y;
        var line2EndX = road2.to.x;
        var line2EndY = road2.to.y;
        var slope = function (x1, y1, x2, y2) {
            if (x1 == x2)
                return false;
            return (y1 - y2) / (x1 - x2);
        };
        var yInt = function (x1, y1, x2, y2) {
            if (x1 === x2)
                return y1 === 0 ? 0 : false;
            if (y1 === y2)
                return y1;
            return y1 - slope(x1, y1, x2, y2) * x1;
        };
        var getXInt = function (x1, y1, x2, y2) {
            var slope;
            if (y1 === y2)
                return x1 == 0 ? 0 : false;
            if (x1 === x2)
                return x1;
            return (-1 * ((slope = slope(x1, y1, x2, y2)) * x1 - y1)) / slope;
        };
        // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
        var denominator, a, b, numerator1, numerator2, result = {
            x: null,
            y: null,
            onLine1: false,
            onLine2: false
        };
        denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
        if (denominator == 0) {
            return result;
        }
        a = line1StartY - line2StartY;
        b = line1StartX - line2StartX;
        numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
        numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
        a = numerator1 / denominator;
        b = numerator2 / denominator;
        // if we cast these lines infinitely in both directions, they intersect here:
        result.x = line1StartX + (a * (line1EndX - line1StartX));
        result.y = line1StartY + (a * (line1EndY - line1StartY));
        result.x = Math.round(result.x);
        result.y = Math.round(result.y);
        // if line1 is a segment and line2 is infinite, they intersect if:
        var lengthLine1 = Math.sqrt(Math.pow(line1StartX - line1EndX, 2) + Math.pow(line1StartY - line1EndY, 2));
        var marginOfErrorLine1 = this.intRadius / lengthLine1;
        if (a > (0 - marginOfErrorLine1) && a < (1 + marginOfErrorLine1)) {
            result.onLine1 = true;
        }
        // if line2 is a segment and line1 is infinite, they intersect if:
        var lengthLine2 = Math.sqrt(Math.pow(line2StartX - line2EndX, 2) + Math.pow(line2StartY - line2EndY, 2));
        var marginOfErrorLine2 = this.intRadius / lengthLine2;
        if (b > (0 - marginOfErrorLine2) && b < (1 + marginOfErrorLine2)) {
            result.onLine2 = true;
        }
        // if line1 and line2 are segments, they intersect if both of the above are true
        return result;
    };
    Board.prototype.createNewRoad = function (newR) {
        var _this = this;
        // Keep track of the places where the new road intercepts existing roads
        var newRSplits = [];
        var newRParts = [];
        // For each intercept, split the road intercepted into two
        this.roads.forEach(function (road) {
            var intercept = _this.getIntersection(road, newR);
            if (intercept.onLine1 && intercept.onLine2) {
                var nearest = _this.autoConnect(intercept.x, intercept.y);
                var intCell = new Cells_1.Cell(nearest.x, nearest.y);
                var newRoad = new Cells_1.Road(intCell, road.to);
                newRSplits.push(intCell);
                _this.roads.push(newRoad);
                road.to = intCell;
            }
        });
        // Sort the new road in order of distance from start of new road to prevent overlap
        newRSplits.sort(function (a, b) { return b.distToCell(newR.from) - a.distToCell(newR.from); });
        newRSplits.forEach(function (split) {
            var road1 = _this.splitRoad(newR, split)[0];
            var road2 = _this.splitRoad(newR, split)[1];
            newR = road1;
            newRParts.push(road2);
        });
        newRParts.push(newR);
        this.roads = this.roads.concat(newRParts);
        this.recalcRoadIds();
        this.removeDupRoads();
        this.removeDupIntersections();
        this.groupConnectedRoads();
    };
    Board.prototype.splitRoad = function (road, intCell) {
        var road1 = new Cells_1.Road(road.from, intCell);
        var road2 = new Cells_1.Road(intCell, road.to);
        return [road1, road2];
    };
    Board.prototype.autoConnect = function (x, y) {
        // Autoconnect to existing intersections
        for (var i = 0; i < this.roads.length; i++) {
            var road = this.roads[i];
            if (Math.abs(x - road.from.x) <= this.intSnapDistance && Math.abs(y - road.from.y) <= this.intSnapDistance) {
                return road.from;
            }
            if (Math.abs(x - road.to.x) <= this.intSnapDistance && Math.abs(y - road.to.y) <= this.intSnapDistance) {
                return road.to;
            }
        }
        // Autoconnect to existing roads
        var point = new Cells_1.Cell(x, y);
        for (var i = 0; i < this.roads.length; i++) {
            var road = this.roads[i];
            var res = this.getPointToRoadDist(point, road);
            if (res.dist <= this.roadSnapDistance) {
                return new Cells_1.Cell(res.x, res.y);
            }
        }
        // No cell found nearby
        return new Cells_1.Cell(x, y);
    };
    Board.prototype.findRoadsWithCell = function (cell) {
        var options = [];
        var roads = [];
        var same = [];
        this.roads.forEach(function (road) {
            if (road.from.id === cell.id) {
                same.push(road.from);
                options.push(road.to);
                roads.push(road);
            }
            if (road.to.id === cell.id) {
                same.push(road.to);
                options.push(road.from);
                roads.push(road);
            }
        });
        return { roads: roads, same: same, options: options };
    };
    Board.prototype.findCellsInGroup = function (cell) {
        if (cell.groupNum) {
            return this.connectedInts[cell.groupNum].filter(function (el) { return el.id !== cell.id; });
        }
        else {
            for (var i = 0; i < this.connectedInts.length; i++) {
                var group = this.connectedInts[i];
                if (group.map(function (el) { return el.id; }).indexOf(cell.id) > -1) {
                    return group.filter(function (el) { return el.id !== cell.id; });
                }
            }
        }
    };
    Board.prototype.removeDupRoads = function () {
        var dups = [];
        this.roads = this.roads.filter(function (el) {
            if (dups.indexOf(el.id) == -1) {
                dups.push(el.id);
                return true;
            }
            return false;
        });
        // Remove roads that don't go anywhere
        this.roads = this.roads.filter(function (el) { return el.length() !== 0; });
    };
    Board.prototype.removeDupIntersections = function () {
        var _this = this;
        this.roads.forEach(function (road) {
            _this.intersections = _this.intersections.concat([road.from, road.to]);
        });
        // Remove duplicate intersections
        var dups = [];
        this.intersections = this.intersections.filter(function (el) {
            if (dups.indexOf(el.id) == -1) {
                dups.push(el.id);
                return true;
            }
            return false;
        });
    };
    Board.prototype.recalcRoadIds = function () {
        this.roads.forEach(function (road) {
            road.id = road.hash(road.from, road.to);
        });
    };
    Board.prototype.groupConnectedRoads = function () {
        var _this = this;
        var ungroupedRoads = JSON.parse(JSON.stringify(this.roads));
        var groups = [];
        while (ungroupedRoads.length > 0) {
            groups.push([ungroupedRoads.pop()]);
            groups[groups.length - 1];
            var _loop_1 = function (i) {
                var road = groups[groups.length - 1][i];
                ungroupedRoads.filter(function (el) { return new Cells_1.Road(el.from, el.to).joins(road); }).forEach(function (el) {
                    groups[groups.length - 1].push(el);
                });
                ungroupedRoads = ungroupedRoads.filter(function (el) { return !new Cells_1.Road(el.from, el.to).joins(road); });
            };
            for (var i = 0; i < groups[groups.length - 1].length; i++) {
                _loop_1(i);
            }
        }
        this.connectedInts = [];
        groups.forEach(function (group) {
            _this.connectedInts.push([]);
            var groupNum = _this.connectedInts.length - 1;
            group.forEach(function (el) {
                el.from.groupNum = groupNum;
                el.to.groupNum = groupNum;
                _this.connectedInts[groupNum].push(el.from);
                _this.connectedInts[groupNum].push(el.to);
            });
            var dups = [];
            _this.connectedInts[groupNum] = _this.connectedInts[groupNum].filter(function (el) {
                if (dups.indexOf(el.id) == -1) {
                    dups.push(el.id);
                    return true;
                }
                return false;
            });
        });
    };
    // Rendering
    Board.prototype.drawRoads = function () {
        var _this = this;
        this.roads.forEach(function (road) {
            road.render(_this.ctx);
        });
        this.drawIntersections();
    };
    Board.prototype.drawIntersections = function () {
        var _this = this;
        this.intersections.forEach(function (intersection) {
            _this.ctx.beginPath();
            _this.ctx.fillStyle = _this.intersectionColor;
            _this.ctx.arc(intersection.x, intersection.y, _this.intRadius, 0, 2 * Math.PI, false);
            _this.ctx.fill();
            // this.ctx.beginPath();
            // this.ctx.font = "14px Arial";
            // this.ctx.fillStyle = "rgb(100,255,0)";
            // this.ctx.fillText(intersection.id.toString(), intersection.x, intersection.y);
            // this.ctx.fill();
        });
    };
    Board.prototype.drawGrid = function () {
        var _this = this;
        this.cells.forEach(function (row) {
            row.forEach(function (cell) {
                _this.ctx.beginPath();
                _this.ctx.lineWidth = 1;
                _this.ctx.strokeStyle = _this.gridColor;
                _this.ctx.strokeRect(cell.x, cell.y, _this.gridSize - 1, _this.gridSize - 1);
            });
        });
    };
    Board.prototype.onHover = function (x, y) {
        // Remove the hover effect from the last cell hovered over
        // this.ctx.clearRect(this.lastHovered.x - 1, this.lastHovered.y - 1, this.gridSize + 1, this.gridSize + 1);
        // this.ctx.beginPath();
        // this.ctx.lineWidth = 1;
        // this.ctx.strokeStyle = this.gridColor;
        // this.ctx.strokeRect(this.lastHovered.x, this.lastHovered.y, this.gridSize - 1, this.gridSize - 1);
        // Draw the hover effect for this cell
        // this.ctx.clearRect(x - 1, y - 1, this.gridSize + 1, this.gridSize + 1);
        // this.ctx.beginPath();
        // this.ctx.lineWidth = 1;
        // this.ctx.strokeStyle = this.hoverColor;
        // this.ctx.strokeRect(x, y, this.gridSize - 1, this.gridSize - 1);
        // If drawing a road then show how it will look
        if (this.roadStart) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.pendingRoadColor;
            this.ctx.lineWidth = this.roadWidth;
            this.ctx.lineCap = 'round';
            // Connect to nearest road
            var nearestRoadEnd = this.autoConnect(x, y);
            x = nearestRoadEnd.x;
            y = nearestRoadEnd.y;
            this.ctx.moveTo(this.roadStart.x, this.roadStart.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.ctx.lineWidth = 1;
        }
        // Reset lastHovered for next time
        this.lastHovered = { x: x, y: y };
    };
    Board.prototype.fillPageWithCanvas = function () {
        this.canvas.style;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    };
    Board.prototype.render = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.drawGrid();
        this.drawRoads();
        this.drawIntersections();
    };
    return Board;
}());
exports.Board = Board;
//# sourceMappingURL=Board.js.map