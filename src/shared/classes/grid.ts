import { Workspace } from "@rbxts/services";
import { MapType, TileState } from "shared/enums/grid";
import { GridPosition, TilePartConfig, Tile } from "shared/types/grid";
import { tilePositionToVector3 } from "shared/utils/convert";
import { changeTileColor, createTilePart, makeTileFall, makeTileRise } from "shared/utils/tile";

export class Grid {
	private width: number;
	private height: number;
	private tiles: Tile[][];
	private config: TilePartConfig;
	private map: MapType;
	private collisionBlocks: Part[] = [];
	private onTileFell: (tile: Tile) => void;

	constructor(width: number, height: number, config: TilePartConfig, map: MapType, onTileFell: (tile: Tile) => void) {
		this.width = width;
		this.height = height;
		this.tiles = [];
		this.config = config;
		this.map = map;
		for (let x = 0; x < width; x++) {
			this.tiles[x] = [];
			for (let y = 0; y < height; y++) {
				this.tiles[x][y] = {
					position: { x, y },
					state: TileState.Active,
				};
			}
		}

		this.onTileFell = onTileFell;

		for (const column of this.tiles) {
			for (const tile of column) {
				tile.part = createTilePart(config, tile);
			}
		}

		if (this.map === MapType.Normal || this.map === MapType.Large) {
			for (const column of this.tiles) {
				for (const tile of column) {
					if (
						tile.position.x === 0 ||
						tile.position.x === this.width - 1 ||
						tile.position.y === 0 ||
						tile.position.y === this.height - 1
					) {
						const tileSize = config.tileSize;
						const tilePos = tile.position;
						if (tile.position.x === 0) {
							this.createCollisionBlock({ x: tilePos.x - 1, y: tilePos.y }, tileSize);
						}

						if (tile.position.x === this.width - 1) {
							this.createCollisionBlock({ x: tilePos.x + 1, y: tilePos.y }, tileSize);
						}

						if (tile.position.y === 0) {
							this.createCollisionBlock({ x: tilePos.x, y: tilePos.y - 1 }, tileSize);
						}

						if (tile.position.y === this.height - 1) {
							this.createCollisionBlock({ x: tilePos.x, y: tilePos.y + 1 }, tileSize);
						}
					}
				}
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

	public getConfig(): TilePartConfig | undefined {
		return this.config;
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

	public lineAttack(start: GridPosition, direction: Vector3) {
		if (!this.tiles) {
			throw error("Grid tiles are not initialized.");
		}

		const gridDelta = {
			x: direction.X,
			y: direction.Z,
		};

		if (gridDelta.x === 0 && gridDelta.y === 0) {
			return;
		}

		const tilesInLine: Tile[] = [];
		let pos = { x: start.x + gridDelta.x, y: start.y + gridDelta.y };
		while (pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height) {
			const tile = this.getTile(pos);
			if (!tile) {
				break;
			}

			if (tile.state === TileState.Active) {
				tilesInLine.push(tile);
			}

			pos = { x: pos.x + gridDelta.x, y: pos.y + gridDelta.y };
		}

		let colorDelay = 0.05;
		for (const tile of tilesInLine) {
			this.handleStartTileFall(tile, colorDelay, new Color3(0.15, 0.24, 0.63));
			colorDelay += 0.05;
		}

		let fallDelay = colorDelay;
		for (const tile of tilesInLine) {
			tile.state = TileState.Falling;
			this.handleTileFallAndRise(tile, fallDelay);
			fallDelay += 0.15;
		}
	}

	public reset() {
		for (const column of this.tiles) {
			for (const tile of column) {
				tile.part?.Destroy();
				tile.state = TileState.Active;
			}
		}

		for (const block of this.collisionBlocks) {
			block.Destroy();
		}
		this.collisionBlocks = [];
	}

	public getRandomSpawnLocation(): Vector3 {
		let x: number, y: number, tile: Tile | undefined;
		let attempts = 0;
		do {
			x = math.random(0, this.width - 1);
			y = math.random(0, this.height - 1);
			tile = this.getTile({ x, y });
			attempts++;
		} while (tile && tile.state !== TileState.Active && attempts < 100);

		if (tile && tile.part && tile.state === TileState.Active) {
			return tile.part.Position;
		}

		return tilePositionToVector3({ x, y }, this.config?.tileSize || 5);
	}

	private handleStartTileFall(tile: Tile, delay: number, color: Color3) {
		coroutine.wrap(async () => {
			wait(delay);
			changeTileColor(tile.part, color);
		})();
	}

	private respawnTile(tile: Tile, delay: number, collisionBlock: Part | undefined = undefined) {
		coroutine.wrap(async () => {
			wait(delay);
			if (tile.part) {
				tile.part.Transparency = 0;
				tile.part.Position = tilePositionToVector3(tile.position, this.config?.tileSize || 5);
				tile.part.Color = tile.color || this.config?.tileColor || new Color3(1, 0, 0);
			}
			collisionBlock?.Destroy();
		})();
	}

	private handleTileFallAndRise(tile: Tile, delay: number) {
		coroutine.wrap(async () => {
			wait(delay);
			tile.state = TileState.Removed;
			this.onTileFell(tile);
			const collision = this.createCollisionBlock(tile.position, this.config?.tileSize || 5);
			await makeTileFall(tile.part);
			if (tile.part) {
				tile.part.Transparency = 1;
			}

			tile.state = TileState.Active;
			this.respawnTile(tile, 1, collision);
		})();
	}

	private createCollisionBlock(pos: GridPosition, tileSize: number): Part {
		const block = new Instance("Part");
		block.Size = new Vector3(tileSize, tileSize * 5, tileSize);
		block.Anchored = true;
		block.CanCollide = true;
		block.Material = Enum.Material.SmoothPlastic;
		const basePos = tilePositionToVector3(pos, tileSize);
		block.Position = new Vector3(basePos.X, basePos.Y + tileSize, basePos.Z); // 1 block higher
		block.Transparency = 1; // Make it invisible
		block.Parent = Workspace;

		this.collisionBlocks.push(block);

		return block;
	}
}
