import { Board } from "./Board";
import { Cell } from "./Cells";

export interface Vehicle {
    id: string;
    board: Board;
    pos: Cell;

    move(): void;
    render(ctx: CanvasRenderingContext2D): void;
}