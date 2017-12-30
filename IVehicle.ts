import { Board } from "./Board";
import { Cell } from "./Cells";

export interface Vehicle {
    id: string;
    board: Board;
    pos: Cell;
    acceleration: number;
    topSpeed: number;


    move(): void;
    render(ctx: CanvasRenderingContext2D): void;
}