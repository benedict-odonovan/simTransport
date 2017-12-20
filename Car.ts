import { Vehicle } from "./IVehicle";
import { Cell } from "./Cells";
import { Board } from "./Board";

export class Car implements Vehicle {
    public id: string;
    public pos = new Cell(0, 0);
    public radius = 3;
    public speed = 5;
    public destinationQueue: Cell[];
    public currentCell: Cell;
    public direction: number;
    public style: string;

    constructor(public board: Board) {
        this.style = 'rgb(' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ',' + Math.round(Math.random() * 125 + 125) + ')';
    }

    // Get available options and set destination queue
    public chooseRoute(): Cell {
        const options = this.board.findRoadsWithCell(this.currentCell).options;
        this.destinationQueue = [];
        const chosenOption = options[Math.ceil(Math.random() * options.length) - 1];
        this.destinationQueue.push(chosenOption);
        return this.destinationQueue[0];
    }

    public move() {
        // Either move to the destination exactly or clear the destination
        if (this.destinationQueue.length > 0) {
            const distX = this.destinationQueue[0].x - this.pos.x;
            const distY = this.destinationQueue[0].y - this.pos.y;
            this.direction = Math.atan2(distY, distX);
            if (Math.abs(distX) > this.speed + 2 || Math.abs(distY) > this.speed + 2) {
                this.pos.x += this.speed * Math.cos(this.direction);
                this.pos.y += this.speed * Math.sin(this.direction);
            } else {
                this.pos.x = this.destinationQueue[0].x;
                this.pos.y = this.destinationQueue[0].y;
                this.currentCell = this.destinationQueue[0];
                this.destinationQueue.splice(0, 1);
            }
        } else {
            this.chooseRoute();
            this.move();
        }
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = this.style;
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fill();
    }
}
