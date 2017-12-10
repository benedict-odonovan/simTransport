import * as Rx from 'rxjs';

class Board {

    // Grid
    public gridSize = 5; // Pixels
    public lastHovered = { x: 0, y: 0 };
    public cells: Cell[][];

    // Roads
    public roads: Road[] = [];
    public roadStart: Cell;
    public snapDistance = 20;
    public safetyDistance = 35;

    // Intersections
    public intRadius = 10;

    // Styles
    public gridColor = 'rgb(240,240,240)';
    public hoverColor = 'rgb(0,0,0)';
    public roadColor = 'rgba(0,0,0,0.5)';
    public roadWidth = 10;
    public pendingRoadColor = 'rgba(0,0,0,0.2)';
    public intersectionColor = 'rgb(0,120,120)';

    constructor(public canvas: HTMLCanvasElement, public ctx: CanvasRenderingContext2D) {
        this.fillPageWithCanvas();
        this.initGrid();
    }

    public initGrid() {
        this.cells = [];
        let i = 0;
        this.ctx.lineWidth = 1;
        for (let x = 0; x < window.innerWidth; x += this.gridSize) {
            this.cells.push([]);
            for (let y = 0; y < window.innerHeight; y += this.gridSize) {
                const cell = { x: x, y: y };
                this.cells[x / this.gridSize].push(cell);
                i++;
            }
        }
        this.drawGrid();
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
        this.ctx.clearRect(this.lastHovered.x - 1, this.lastHovered.y - 1, this.gridSize + 1, this.gridSize + 1);
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.strokeRect(this.lastHovered.x, this.lastHovered.y, this.gridSize - 1, this.gridSize - 1);

        // Draw the hover effect for this cell
        this.ctx.clearRect(x - 1, y - 1, this.gridSize + 1, this.gridSize + 1);
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.hoverColor;
        this.ctx.strokeRect(x, y, this.gridSize - 1, this.gridSize - 1);

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

    public planNewRoad(x: number, y: number): void {
        // Connect to nearest road
        const nearestRoadEnd = this.autoConnect(x, y);
        x = nearestRoadEnd.x;
        y = nearestRoadEnd.y;

        // Only add road on the second click
        if (!this.roadStart) {
            this.roadStart = { x: x, y: y };
        } else {
            const newRoad = new Road();
            newRoad.from = this.roadStart;
            newRoad.to = { x: x, y: y };

            // from should always be the point closest to the top left
            if (newRoad.from.x + newRoad.from.y > newRoad.to.x + newRoad.to.y) {
                const placeHolder = newRoad.from;
                newRoad.from = newRoad.to;
                newRoad.to = placeHolder;
            }

            // No duplicates
            if (this.roads.every(road => JSON.stringify(road) !== JSON.stringify(newRoad))) {
                this.createNewRoad(newRoad);
            }
            this.roadStart = null;
        }
    }

    public createNewRoad(newR: Road): void {
        // Keep track of the places where the new road intercepts existing roads
        const newRSplits: Cell[] = [];
        const newRParts: Road[] = [];

        // Helper functions
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
        const getIntersection = (line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) => {
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
            /*
                    // it is worth noting that this should be the same as:
                    x = line2StartX + (b * (line2EndX - line2StartX));
                    y = line2StartX + (b * (line2EndY - line2StartY));
                    */
            // if line1 is a segment and line2 is infinite, they intersect if:
            if (a > 0 && a < 1) {
                result.onLine1 = true;
            }
            // if line2 is a segment and line1 is infinite, they intersect if:
            if (b > 0 && b < 1) {
                result.onLine2 = true;
            }
            // if line1 and line2 are segments, they intersect if both of the above are true
            return result;
        };

        // For each intercept split the road intercepted into two
        this.roads.forEach(road => {
            const intercept = getIntersection(road.from.x, road.from.y, road.to.x, road.to.y, newR.from.x, newR.from.y, newR.to.x, newR.to.y);
            if (intercept.onLine1 && intercept.onLine2) {
                const intCell: Cell = { x: intercept.x, y: intercept.y };

                const newRoad: Road = { from: intCell, to: road.to }
                newRSplits.push(intCell);
                this.roads.push(newRoad);
                road.to = intCell;
            }
        });

        // Sort the new road in order to keep things simple when splitting
        newRSplits.sort((a, b) => {
            return (a.x + a.y) - (b.x + b.y)
        });

        newRSplits.forEach(split => {
            const road1 = this.splitRoad(newR, split)[0];
            const road2 = this.splitRoad(newR, split)[1];
            newR = road1;
            newRParts.push(road2);
        })
        newRParts.push(newR);

        this.roads = this.roads.concat(newRParts);
    }

    splitRoad(road: Road, intCell: Cell): Road[] {
        const road1: Road = { from: road.from, to: intCell };
        const road2: Road = { from: intCell, to: road.to };
        return [road1, road2];
    }

    public autoConnect(x, y): Cell {
        // Autoconnect to existing roads
        for (let i = 0; i < this.roads.length; i++) {
            const road = this.roads[i];
            if (Math.abs(x - road.from.x) <= this.snapDistance && Math.abs(y - road.from.y) <= this.snapDistance) {
                x = road.from.x;
                y = road.from.y;
                break;
            }
            if (Math.abs(x - road.to.x) <= this.snapDistance && Math.abs(y - road.to.y) <= this.snapDistance) {
                x = road.to.x;
                y = road.to.y;
                break;
            }
        }
        return { x: x, y: y };
    }

    public drawRoads(): void {
        this.roads.forEach(road => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.roadColor;
            this.ctx.lineWidth = this.roadWidth;
            this.ctx.lineCap = 'round';
            this.ctx.moveTo(road.from.x, road.from.y);
            this.ctx.lineTo(road.to.x, road.to.y);
            this.ctx.stroke();
        });
        this.drawIntersections();
    }

    public drawIntersections(): void {
        let intersections: Cell[] = [];
        this.roads.forEach(road => {
            intersections = intersections.concat([road.from, road.to]);
        })
        intersections.forEach(intersection => {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.intersectionColor;
            this.ctx.arc(intersection.x, intersection.y, this.intRadius, 0, 2 * Math.PI, false);
            this.ctx.fill();
        })
    }

    public fillPageWithCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.drawGrid();
        this.drawRoads();
        this.drawIntersections();
    }

    findRoadsWithCell(cell: Cell): { roads: Road[], same: Cell[], options: Cell[] } {
        const options: Cell[] = [];
        const roads: Road[] = [];
        const same: Cell[] = [];
        const original = JSON.stringify(cell);

        this.roads.forEach(road => {
            if (JSON.stringify(road.from) === original) {
                same.push(road.from);
                options.push(road.to);
                roads.push(road);
            }
            if (JSON.stringify(road.to) === original) {
                same.push(road.to);
                options.push(road.from);
                roads.push(road);
            }
        });

        // Get the nearest cell origin
        // cell.x = cell.x - (cell.x % this.gridSize);
        // cell.y = cell.y - (cell.y % this.gridSize);

        this.roads.forEach(road => {
            if (JSON.stringify(road.from) === JSON.stringify(cell)) {
                same.push(road.from);
                options.push(road.to);
                roads.push(road);
            }
            if (JSON.stringify(road.to) === JSON.stringify(cell)) {
                same.push(road.to);
                options.push(road.from);
                roads.push(road);
            }
        });

        return { roads: roads, same: same, options: options }
    }

}

class Cell {
    public x: number;
    public y: number;
}

class Road {
    public from: Cell;
    public to: Cell;
}

class Vehicle {
    public id: number;
    public x: number;
    public y: number;
    public radius = 3;
    public speed = Math.random() * 8 + 2;
    public destination: Cell;
    public direction: number;
    public style: string;

    constructor() {
        this.style = 'rgb(' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ')';
    }

    public chooseDestination(options: Cell[]): Cell {
        this.destination = options[Math.ceil(Math.random() * options.length) - 1];

        // Find how to get there
        const distX = this.destination.x - this.x;
        const distY = this.destination.y - this.y;
        this.direction = Math.atan2(distY, distX);

        return this.destination;
    }

    public move() {
        // Either move to the destination exactly or clear the destination
        if (this.destination) {
            const distX = this.destination.x - this.x;
            const distY = this.destination.y - this.y;
            if (Math.abs(distX) > this.speed + 2 || Math.abs(distY) > this.speed + 2) {
                this.x += this.speed * Math.cos(this.direction);
                this.y += this.speed * Math.sin(this.direction);
            } else if (distX !== 0 && distY !== 0) {
                this.x = this.destination.x;
                this.y = this.destination.y;
            } else {
                this.destination = null;
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = this.style;
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fill();
    }
}

class Game {

    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public board: Board;
    public vehicles: Vehicle[];
    public pause = false;
    public mouse: MouseEvent;

    public numClicks = 0;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById("cnvs");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        this.board = new Board(this.canvas, this.ctx);
        this.vehicles = []

        Rx.Observable.fromEvent(this.canvas, 'mousemove')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(e => {
                this.mouse = e as MouseEvent;
            });

        Rx.Observable.fromEvent(this.canvas, 'click')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(e => {
                const event = e as MouseEvent;
                const x = event.clientX;
                const y = event.clientY;

                this.numClicks++;
                this.board.planNewRoad(x, y);
                if (this.board.roads.length > 0 && this.numClicks % 2 === 0) {
                    this.addVehicle();
                }
            });
    }

    addVehicle() {
        const newVehicle = new Vehicle();
        newVehicle.x = this.board.roads[0].from.x;
        newVehicle.y = this.board.roads[0].from.y;
        this.vehicles.push(newVehicle);
    }

    play = () => {
        requestAnimationFrame(this.play);
        this.board.render();
        if (this.mouse) {
            this.board.onHover(this.mouse.clientX, this.mouse.clientY);
        }
        this.vehicles.forEach(vehicle => {
            if (vehicle.destination) {
                vehicle.move();
            } else {
                const options = this.board.findRoadsWithCell({ x: vehicle.x, y: vehicle.y }).options;
                vehicle.chooseDestination(options);
                vehicle.move();
            }
            vehicle.render(this.ctx);
        });
    }



}

window.onload = function () { const game = new Game(); game.play(); };


