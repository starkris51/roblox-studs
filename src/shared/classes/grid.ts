import { TileState } from "shared/enums/grid";
import { GridPosition, TilePartConfig, Tile } from "shared/types/grid";
import { createTilePart } from "shared/utils/tile";

export class Grid {
    private width: number;
    private height: number;
    private tiles: Tile[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        for (let x = 0; x < width; x++) {
            this.tiles[x] = [];
            for (let y = 0; y < height; y++) {
                this.tiles[x][y] = {
                    position: { x, y },
                    state: TileState.Active,
                };
            }
        }
    }
    
    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public getTiles(): Tile[][] {
        return this.tiles;
    }

    public getTile(pos: GridPosition): Tile | undefined {
        return this.tiles[pos.x]?.[pos.y];
    }

    public removeTile(pos: GridPosition) {
        const tile = this.getTile(pos);
        if (tile && tile.state === TileState.Active) {
            tile.state = TileState.Removed;
            tile.part?.Destroy();
        }
    }

    public setTileState(pos: GridPosition, state: TileState) {
        const tile = this.getTile(pos);
        if (tile) {
            tile.state = state;
        }
    }

    public render(config: TilePartConfig) {
        for (const column of this.tiles) {
            for (const tile of column) {
                tile.part = createTilePart(config, tile.position);
            }
        }
    }

    public reset() {
        for (const column of this.tiles) {
            for (const tile of column) {
                tile.part?.Destroy();
                tile.state = TileState.Active;
            }
        }
    }

}