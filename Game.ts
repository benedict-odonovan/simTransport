import * as Rx from 'rxjs';
import { Board } from './Board';
import { Vehicle } from './IVehicle';
import { Car } from './Car';


export class Game {

    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public board: Board;
    public vehicles: Vehicle[];
    public mouse: MouseEvent;

    public numClicks = 0;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById("cnvs");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        this.board = new Board(this.canvas, this.ctx, 3);
        this.vehicles = []


        let mouseDown = false;
        let startX = 0;
        let startY = 0;
        Rx.Observable.fromEvent(this.canvas, 'mousedown').subscribe(e => {
            mouseDown = true;
            const m = e as MouseEvent;
            startX = m.clientX;
            startY = m.clientY;
        });

        Rx.Observable.fromEvent(this.canvas, 'mousemove').subscribe(e => {
            this.mouse = e as MouseEvent;

            // If it's a drag 
            if (mouseDown && Math.abs(this.mouse.clientX - startX) + Math.abs(this.mouse.clientY - startY) > 10) {
                mouseDown = false;
                const rect = this.canvas.getBoundingClientRect();
                this.numClicks++;
                this.board.planNewRoad(startX - rect.left, startY - rect.top);
            }
        });

        Rx.Observable.fromEvent(this.canvas, 'mouseup')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(e => {
                mouseDown = false;
                const event = e as MouseEvent;
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                this.numClicks++;
                this.board.planNewRoad(x, y);
                if (this.board.roads.length > 0 && this.numClicks % 2 === 0) {
                    this.addVehicle();
                }
            });
    }

    addVehicle() {
        const newVehicle = new Car(this.board);
        newVehicle.pos.x = this.board.roads[0].from.x;
        newVehicle.pos.y = this.board.roads[0].from.y;
        newVehicle.destinationQueue = [this.board.roads[0].to];
        this.vehicles.push(newVehicle);
    }

    play = () => {
        // AA fix
        this.ctx.translate(0.5, 0.5);
        requestAnimationFrame(this.play);
        this.board.render();
        if (this.mouse) {
            const rect = this.canvas.getBoundingClientRect();
            this.board.onHover(this.mouse.clientX - rect.left, this.mouse.clientY - rect.top);
        }
        this.vehicles.forEach(vehicle => {
            vehicle.move();
            vehicle.render(this.ctx);
        });
        // AA fix reset
        this.ctx.translate(-0.5, -0.5);
    }



}