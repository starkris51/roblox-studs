import { TileState } from "shared/enums/grid";

export type GridPosition = { x: number; y: number };

export interface TilePartConfig {
	tileSize: number;
	tileColor?: Color3;
	tileTexture?: string;
}

export interface Tile {
	position: GridPosition;
	color?: Color3;
	texture?: string;
	part?: Part;
	state: TileState;
}
