export class Road {
    public id: number;
    public style = 'rgba(0,0,0,0.5)';
    public roadWidth = 10;

    constructor(public from: Cell, public to: Cell) {
        this.id = this.hash(from, to);
    }

    public hash(from: Cell, to: Cell): number {
        const smaller = from.id < to.id ? from.id : to.id;
        const bigger = from.id < to.id ? to.id : from.id;
        const seed = smaller.toString() + '-' + bigger.toString();
        var hash = 0, i, chr;
        if (seed.length === 0) return hash;
        for (i = 0; i < seed.length; i++) {
            chr = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    public halfway(): Cell {
        const hX = (this.from.x + this.to.x) / 2;
        const hY = (this.from.y + this.to.y) / 2;
        return new Cell(hX, hY);
    }

    public length(): number {
        return this.to.distToCell(this.from);
    }

    public contains(cell: Cell): boolean {
        return this.from.id === cell.id || this.to.id === cell.id;
    }

    public joins(b: Road): boolean {
        return this.contains(b.from) || this.contains(b.to);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.strokeStyle = this.style;
        ctx.lineWidth = this.roadWidth;
        ctx.lineCap = 'round';
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();

        // ctx.beginPath();
        // ctx.font = "14px Arial";
        // ctx.fillStyle = "rgb(0,100,255)";
        // const halfway = this.halfway();
        // ctx.fillText(this.id.toString(), halfway.x, halfway.y);
        // ctx.fill();
    }
}

export class Cell {
    public id: number;
    public groupNum: number;

    constructor(public x: number, public y: number) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.id = this.hash(x, y);
    }

    public hash(x: number, y: number): number {
        const seed = x.toString() + '-' + y.toString();
        var hash = 0, i, chr;
        if (seed.length === 0) return hash;
        for (i = 0; i < seed.length; i++) {
            chr = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    public distToCell(b: Cell): number {
        return Math.abs(this.x - b.x) + Math.abs(this.y - b.y);
    }
}