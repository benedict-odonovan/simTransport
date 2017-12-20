export class Road {
    public id: number;

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
}

export class Cell {
    public id: number;

    constructor(public x: number, public y: number) {
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
}