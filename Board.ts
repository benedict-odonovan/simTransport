import { Cell, Road } from "./Cells";

export class Board {

    // Grid
    public gridSize = 5; // Pixels
    public lastHovered = { x: 0, y: 0 };
    public cells: Cell[][];

    // Roads
    public roads: Road[] = [];
    public roadStart: Cell;
    public roadSnapDistance = 20;
    public roadWidth = 10;

    // Intersections
    public intersections: Cell[] = [];
    public intSnapDistance = 30;
    public intRadius = 10;
    public connectedInts: Cell[][] = [];

    // Styles
    public gridColor = 'rgb(240,240,240)';
    public hoverColor = 'rgb(0,0,0)';
    public pendingRoadColor = 'rgba(0,0,0,0.2)';
    public intersectionColor = 'rgb(0,120,120)';

    constructor(public canvas: HTMLCanvasElement, public ctx: CanvasRenderingContext2D, public scale: number) {
        this.fillPageWithCanvas();
        //this.initGrid();
    }

    // Grid creation
    public initGrid() {
        this.cells = [];
        let i = 0;
        this.ctx.lineWidth = 1;
        for (let x = 0; x < window.innerWidth; x += this.gridSize) {
            this.cells.push([]);
            for (let y = 0; y < window.innerHeight; y += this.gridSize) {
                const cell = new Cell(x, y);
                this.cells[x / this.gridSize].push(cell);
                i++;
            }
        }
        this.drawGrid();
    }

    // Road Creation
    public planNewRoad(x: number, y: number): void {
        // Connect to nearest road
        const nearestRoadEnd = this.autoConnect(x, y);
        x = nearestRoadEnd.x;
        y = nearestRoadEnd.y;

        // Only add road on the second click
        if (!this.roadStart) {
            this.roadStart = new Cell(x, y);
        } else {
            const newRoad = new Road(this.roadStart, new Cell(x, y));

            // No duplicates
            if (this.roads.every(road => road.id !== newRoad.id)) {
                this.createNewRoad(newRoad);
            }
            this.roadStart = null;
        }
    }

    public getPointToRoadDist(point: Cell, road: Road): { dist: number, x: number, y: number } {

        function sqr(x) { return x * x }
        function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
        function distToSegment(point: Cell, from: Cell, to: Cell) {
            var roadLength = dist2(from, to);
            // If the road is just a point then return the point to point distance
            if (roadLength == 0) return { dist: Math.sqrt(dist2(point, from)), x: point.x, y: point.y };

            // % of the way down the line
            var t = ((point.x - from.x) * (to.x - from.x) + (point.y - from.y) * (to.y - from.y)) / roadLength;
            t = Math.max(0, Math.min(1, t));
            const intX = from.x + t * (to.x - from.x);
            const intY = from.y + t * (to.y - from.y);

            return {
                dist: Math.sqrt(dist2(point, new Cell(intX, intY))),
                x: intX,
                y: intY
            };
        }

        return distToSegment(point, road.from, road.to);
    }

    public getIntersection(road1: Road, road2: Road): { x: number, y: number, onLine1: boolean, onLine2: boolean } {
        const line1StartX = road1.from.x;
        const line1StartY = road1.from.y;
        const line1EndX = road1.to.x;
        const line1EndY = road1.to.y;

        const line2StartX = road2.from.x;
        const line2StartY = road2.from.y;
        const line2EndX = road2.to.x;
        const line2EndY = road2.to.y;

        const slope = (x1: number, y1: number, x2: number, y2: number) => {
            if (x1 == x2) return false;
            return (y1 - y2) / (x1 - x2);
        };
        const yInt = (x1, y1, x2, y2) => {
            if (x1 === x2) return y1 === 0 ? 0 : false;
            if (y1 === y2) return y1;
            return y1 - (slope(x1, y1, x2, y2) as number) * x1;
        };
        const getXInt = (x1, y1, x2, y2) => {
            var slope;
            if (y1 === y2) return x1 == 0 ? 0 : false;
            if (x1 === x2) return x1;
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
        const lengthLine1 = Math.sqrt(Math.pow(line1StartX - line1EndX, 2) + Math.pow(line1StartY - line1EndY, 2))
        const marginOfErrorLine1 = this.intRadius / lengthLine1;
        if (a > (0 - marginOfErrorLine1) && a < (1 + marginOfErrorLine1)) {
            result.onLine1 = true;
        }

        // if line2 is a segment and line1 is infinite, they intersect if:
        const lengthLine2 = Math.sqrt(Math.pow(line2StartX - line2EndX, 2) + Math.pow(line2StartY - line2EndY, 2))
        const marginOfErrorLine2 = this.intRadius / lengthLine2;
        if (b > (0 - marginOfErrorLine2) && b < (1 + marginOfErrorLine2)) {
            result.onLine2 = true;
        }

        // if line1 and line2 are segments, they intersect if both of the above are true
        return result;
    }

    public createNewRoad(newR: Road): void {
        // Keep track of the places where the new road intercepts existing roads
        const newRSplits: Cell[] = [];
        const newRParts: Road[] = [];

        // For each intercept, split the road intercepted into two
        this.roads.forEach(road => {
            const intercept = this.getIntersection(road, newR);
            if (intercept.onLine1 && intercept.onLine2) {
                const nearest = this.autoConnect(intercept.x, intercept.y);
                const intCell = new Cell(nearest.x, nearest.y);
                const newRoad = new Road(intCell, road.to);
                newRSplits.push(intCell);
                this.roads.push(newRoad);
                road.to = intCell;
            }
        });

        // Sort the new road in order of distance from start of new road to prevent overlap
        newRSplits.sort((a, b) => b.distToCell(newR.from) - a.distToCell(newR.from));

        newRSplits.forEach(split => {
            const road1 = this.splitRoad(newR, split)[0];
            const road2 = this.splitRoad(newR, split)[1];
            newR = road1;
            newRParts.push(road2);
        })
        newRParts.push(newR);

        this.roads = this.roads.concat(newRParts);
        this.recalcRoadIds();
        this.removeDupRoads();
        this.removeDupIntersections();
        this.groupConnectedRoads();
    }

    public splitRoad(road: Road, intCell: Cell): Road[] {
        const road1 = new Road(road.from, intCell);
        const road2 = new Road(intCell, road.to);
        return [road1, road2];
    }

    public autoConnect(x, y): Cell {
        // Autoconnect to existing intersections
        for (let i = 0; i < this.roads.length; i++) {
            const road = this.roads[i];
            if (Math.abs(x - road.from.x) <= this.intSnapDistance && Math.abs(y - road.from.y) <= this.intSnapDistance) {
                return road.from;
            }
            if (Math.abs(x - road.to.x) <= this.intSnapDistance && Math.abs(y - road.to.y) <= this.intSnapDistance) {
                return road.to;
            }
        }

        // Autoconnect to existing roads
        const point = new Cell(x, y);
        for (let i = 0; i < this.roads.length; i++) {
            const road = this.roads[i];
            const res = this.getPointToRoadDist(point, road);
            if (res.dist <= this.roadSnapDistance) {
                return new Cell(res.x, res.y);
            }
        }

        // No cell found nearby
        return new Cell(x, y);
    }

    public findRoadsWithCell(cell: Cell): { roads: Road[], same: Cell[], options: Cell[] } {
        const options: Cell[] = [];
        const roads: Road[] = [];
        const same: Cell[] = [];

        this.roads.forEach(road => {
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

        return { roads: roads, same: same, options: options }
    }

    public findCellsInGroup(cell: Cell): Cell[] {
        if (cell.groupNum) {
            return this.connectedInts[cell.groupNum].filter(el => el.id !== cell.id);
        }
        else {
            for (let i = 0; i < this.connectedInts.length; i++) {
                const group = this.connectedInts[i];
                if (group.map(el => el.id).indexOf(cell.id) > -1) {
                    return group.filter(el => el.id !== cell.id);
                }
            }
        }
    }

    public removeDupRoads() {
        const dups = [];
        this.roads = this.roads.filter(function (el) {
            if (dups.indexOf(el.id) == -1) {
                dups.push(el.id);
                return true;
            }
            return false;
        });

        // Remove roads that don't go anywhere
        this.roads = this.roads.filter(el => el.length() !== 0);
    }

    public removeDupIntersections(): void {
        this.roads.forEach(road => {
            this.intersections = this.intersections.concat([road.from, road.to]);
        });

        // Remove duplicate intersections
        const dups = [];
        this.intersections = this.intersections.filter(function (el) {
            if (dups.indexOf(el.id) == -1) {
                dups.push(el.id);
                return true;
            }
            return false;
        });
    }

    public recalcRoadIds() {
        this.roads.forEach(road => {
            road.id = road.hash(road.from, road.to);
        });
    }

    public groupConnectedRoads(): void {
        let ungroupedRoads: Road[] = JSON.parse(JSON.stringify(this.roads));
        const groups: Road[][] = [];
        while (ungroupedRoads.length > 0) {
            groups.push([ungroupedRoads.pop()]);
            groups[groups.length - 1]

            for (let i = 0; i < groups[groups.length - 1].length; i++) {
                const road = groups[groups.length - 1][i];
                ungroupedRoads.filter(el => new Road(el.from, el.to).joins(road)).forEach(el => {
                    groups[groups.length - 1].push(el);
                });
                ungroupedRoads = ungroupedRoads.filter(el => !new Road(el.from, el.to).joins(road));
            }
        }

        this.connectedInts = [];
        groups.forEach(group => {
            this.connectedInts.push([]);
            const groupNum = this.connectedInts.length - 1;
            group.forEach(el => {
                el.from.groupNum = groupNum;
                el.to.groupNum = groupNum;
                this.connectedInts[groupNum].push(el.from);
                this.connectedInts[groupNum].push(el.to);
            });

            const dups = [];
            this.connectedInts[groupNum] = this.connectedInts[groupNum].filter(function (el) {
                if (dups.indexOf(el.id) == -1) {
                    dups.push(el.id);
                    return true;
                }
                return false;
            });
        });
    }

    // Rendering
    public drawRoads(): void {
        this.roads.forEach(road => {
            road.render(this.ctx);
        });
        this.drawIntersections();
    }

    public drawIntersections(): void {
        this.intersections.forEach(intersection => {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.intersectionColor;
            this.ctx.arc(intersection.x, intersection.y, this.intRadius, 0, 2 * Math.PI, false);
            this.ctx.fill();

            // this.ctx.beginPath();
            // this.ctx.font = "14px Arial";
            // this.ctx.fillStyle = "rgb(100,255,0)";
            // this.ctx.fillText(intersection.id.toString(), intersection.x, intersection.y);
            // this.ctx.fill();
        })
    }

    public drawGrid() {
        this.cells.forEach(row => {
            row.forEach(cell => {
                this.ctx.beginPath();
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = this.gridColor;
                this.ctx.strokeRect(cell.x, cell.y, this.gridSize - 1, this.gridSize - 1);
            });
        });
    }

    public onHover(x: number, y: number): void {
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
            const nearestRoadEnd = this.autoConnect(x, y);
            x = nearestRoadEnd.x;
            y = nearestRoadEnd.y;

            this.ctx.moveTo(this.roadStart.x, this.roadStart.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.ctx.lineWidth = 1;
        }

        // Reset lastHovered for next time
        this.lastHovered = { x: x, y: y };
    }

    public fillPageWithCanvas(): void {
        this.canvas.style.height = '100%';
        this.canvas.style.width = '100%';
        this.canvas.width = this.canvas.offsetWidth * this.scale;
        this.canvas.height = this.canvas.offsetHeight * this.scale;
        this.ctx.scale(this.scale, this.scale);
    }

    public render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.drawGrid();
        this.drawRoads();
        this.drawIntersections();
    }

}