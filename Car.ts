import { Vehicle } from "./IVehicle";
import { Cell } from "./Cells";
import { Board } from "./Board";

export class Car implements Vehicle {
    public id: string;
    public pos = new Cell(0, 0);
    public radius = 3;
    public speed = 0.0;
    public topSpeed = 7.0;
    public acceleration = 0.03;
    public destinationQueue: Cell[];
    public lastIntVisited: Cell;
    public style: string;

    constructor(public board: Board) {
        this.style = 'rgb(' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ')';
    }

    public chooseFinalDest(current: Cell): Cell {
        const options = this.board.findCellsInGroup(current);
        return options[Math.ceil(Math.random() * options.length) - 1];
    }

    public aStar(from: Cell, to: Cell): Cell[] {
        const closedSet = [];
        const openSet = [from];
        const cameFrom = {};

        // For each node, the cost of getting from the start node to that node.
        const distFromStart = {};
        distFromStart[from.id] = 0;

        // Straight line distance as a heuristic
        function heuristicEstimate(a: Cell, b: Cell) {
            return a.distToCell(b);
        }

        function reconstructPath(cameFrom, current) {
            const totalPath = [current];
            while (Object.keys(cameFrom).indexOf(current.id.toString()) > -1) {
                current = cameFrom[current.id];
                totalPath.push(current);
            }
            return totalPath;
        }

        // For each node, the total cost of getting from the start node to the goal
        // by passing by that node. That value is partly known, partly heuristic.
        const estTotalLengthVia = {};
        estTotalLengthVia[from.id] = heuristicEstimate(from, to);

        while (openSet.length > 0) {
            // Current is the lowest fScore
            let current;
            current = openSet.sort((a, b) => estTotalLengthVia[a.id] - estTotalLengthVia[b.id])[0];

            // If we've reached the target
            if (current.id === to.id) {
                return reconstructPath(cameFrom, current);
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);

            const neighbours = this.board.findRoadsWithCell(current).options;

            for (let i = 0; i < neighbours.length; i++) {
                const neighbour = neighbours[i];
                if (closedSet.map(el => el.id).indexOf(neighbour.id) === -1) {

                    if (openSet.map(el => el.id).indexOf(neighbour.id) === -1) {
                        openSet.push(neighbour);
                    }

                    const possibleGScore = distFromStart[current.id] + current.distToCell(neighbour);
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
    }

    // Get available options and set destination queue
    public chooseRoute() {
        const finalDest = this.chooseFinalDest(this.lastIntVisited);
        this.destinationQueue = this.aStar(this.lastIntVisited, finalDest).reverse();
    }

    public move() {
        if (this.destinationQueue.length > 0) {
            const distX = this.destinationQueue[0].x - this.pos.x;
            const distY = this.destinationQueue[0].y - this.pos.y;
            const totalDist = +(Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2))).toFixed(5);

            // Calculate when you need to slow down
            let stoppingDist = Math.pow(this.speed + (this.acceleration * 2), 2) / (2.0 * this.acceleration);
            stoppingDist = +stoppingDist.toFixed(5);

            // Accel, decel
            if (totalDist > stoppingDist) {
                this.speed += this.acceleration;
            } else if (totalDist <= stoppingDist) {
                this.speed -= this.acceleration;
            }
            this.speed = +this.speed.toFixed(5);
            this.speed = Math.min(this.topSpeed, Math.max(0.0, this.speed));

            if (totalDist >= 0.3) {
                const angleToDest = Math.atan2(distY, distX);
                this.pos.x += this.speed * Math.cos(angleToDest);
                this.pos.y += this.speed * Math.sin(angleToDest);
            } else {
                this.pos.x = this.destinationQueue[0].x;
                this.pos.y = this.destinationQueue[0].y;
                this.speed = 0;
                this.lastIntVisited = this.destinationQueue[0];
                this.destinationQueue.splice(0, 1);
            }
        } else {
            // this.chooseFinalDest(this.lastIntVisited);
            this.chooseRoute();
            //this.move(); // Move without hesitation
        }
    }

    public render(ctx: CanvasRenderingContext2D) {
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
    }
}
