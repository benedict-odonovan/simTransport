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

    public numCars: HTMLInputElement;
    public acc: HTMLInputElement;
    public topSpeed: HTMLInputElement;

    public numClicks = 0;

    constructor() {
        // Rendering elements
        this.canvas = <HTMLCanvasElement>document.getElementById("cnvs");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        // Keeping track of components
        this.board = new Board(this.canvas, this.ctx, 3);
        this.vehicles = []

        // UI Configs
        this.numCars = document.getElementById('numCars') as HTMLInputElement;
        this.numCars.value = '0';
        this.acc = document.getElementById('acc') as HTMLInputElement;
        this.acc.value = '0.03';
        this.topSpeed = document.getElementById('topSpeed') as HTMLInputElement;
        this.topSpeed.value = '7';

        Rx.Observable.fromEvent(this.acc, 'change').subscribe(() => {
            this.vehicles.forEach(vehicle => {
                vehicle.acceleration = + this.acc.value;
            });
        });

        Rx.Observable.fromEvent(this.topSpeed, 'change').subscribe(() => {
            this.vehicles.forEach(vehicle => {
                vehicle.topSpeed = + this.topSpeed.value;
            });
        });

        // For managing drag and drops vs clicks
        let startDrag = false;
        let startX = 0;
        let startY = 0;

        Rx.Observable.fromEvent(this.canvas, 'mousedown').subscribe(e => {
            startDrag = true;
            const m = e as MouseEvent;
            startX = m.clientX;
            startY = m.clientY;
        });

        Rx.Observable.fromEvent(this.canvas, 'mousemove').subscribe(e => {
            this.mouse = e as MouseEvent;

            // If it's a drag 
            if (startDrag && Math.abs(this.mouse.clientX - startX) + Math.abs(this.mouse.clientY - startY) > 10) {
                startDrag = false;
                const rect = this.canvas.getBoundingClientRect();
                this.numClicks++;
                this.board.planNewRoad(startX - rect.left, startY - rect.top);
            }
        });

        Rx.Observable.fromEvent(this.canvas, 'mouseup')
            .throttleTime(10)
            .distinctUntilChanged()
            .subscribe(e => {
                startDrag = false;
                const event = e as MouseEvent;
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                this.numClicks++;
                this.board.planNewRoad(x, y);
                if (this.board.roads.length > 0 && this.numClicks % 2 === 0) {
                    this.addVehicle(true);
                }
            });

    }

    addVehicle(updateUi: boolean) {
        const newVehicle = new Car(this.board);
        newVehicle.pos.x = this.board.roads[0].from.x;
        newVehicle.pos.y = this.board.roads[0].from.y;
        newVehicle.destinationQueue = [this.board.roads[0].to];
        this.vehicles.push(newVehicle);

        // Prevent conflict with user changing numCars value themselves
        if (updateUi) {
            this.numCars.value = (+ this.numCars.value + 1).toString();
        }
    }

    updateVehicleCount() {
        if (+ this.numCars.value > this.vehicles.length) {
            this.addVehicle(false);
        }
        if (+ this.numCars.value < this.vehicles.length) {
            this.vehicles.pop();
        }
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
            this.ctx.fill();
        });
        this.updateVehicleCount();

        // AA fix reset
        this.ctx.translate(-0.5, -0.5);
    }



}

enum Mode {
    'build' = 0,
    'info' = 1,
    'delete' = 2,
}