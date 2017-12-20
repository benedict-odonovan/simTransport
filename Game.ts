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
        const newVehicle = new Car(this.board);
        newVehicle.pos.x = this.board.roads[0].from.x;
        newVehicle.pos.y = this.board.roads[0].from.y;
        newVehicle.destinationQueue = [this.board.roads[0].to];
        this.vehicles.push(newVehicle);
    }

    play = () => {
        requestAnimationFrame(this.play);
        this.board.render();
        if (this.mouse) {
            this.board.onHover(this.mouse.clientX, this.mouse.clientY);
        }
        this.vehicles.forEach(vehicle => {
            vehicle.move();
            vehicle.render(this.ctx);
        });
    }



}