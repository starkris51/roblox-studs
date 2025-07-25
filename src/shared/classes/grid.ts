import { Players, ReplicatedStorage, TweenService, Workspace, RunService } from "@rbxts/services";
import { MapType, TileState } from "shared/enums/grid";
import { GridPosition, TilePartConfig, Tile } from "shared/types/grid";
import { tilePositionToVector3, vector3ToTilePosition } from "shared/utils/convert";
import { changeTileColor, createTilePart, makeTileFall } from "shared/utils/tile";

export class Grid {
	private width: number;
	private height: number;
	private tiles: Tile[][];
	private config: TilePartConfig;
	private map: MapType;
	private collisionBlocks: Part[] = [];
	private activeFallingTiles: Set<Tile> = new Set();
	private powerupSpawnTimer?: RBXScriptConnection;
	private powerupSpawnDelay: number = 0;
	private seed = 0;
	private onTileFell: (tile: Tile) => void;
	private getPowerup: (player: Player) => void;
	private gridFolder: Folder;

	constructor(
		width: number,
		height: number,
		config: TilePartConfig,
		map: MapType,
		onTileFell: (tile: Tile) => void,
		getPowerup: (player: Player) => void,
		generatedMap: boolean = false,
	) {
		this.width = width;
		this.height = height;
		this.tiles = [];
		this.config = config;
		this.map = map;
		this.onTileFell = onTileFell;
		this.getPowerup = getPowerup;

		// Create dedicated folder for all grid parts
		this.gridFolder = new Instance("Folder");
		this.gridFolder.Name = "GridParts";
		this.gridFolder.Parent = Workspace;

		if (generatedMap) {
			this.seed = math.random(0, 10000);
			for (let x = 0; x < width; x++) {
				this.tiles[x] = [];
				for (let y = 0; y < height; y++) {
					const noise = math.noise((x + this.seed) / 6, (y + this.seed) / 6, this.seed);
					const normalized = (noise + 1) / 2;
					let state: TileState;
					if (normalized > 0.37) {
						state = TileState.Active;
					} else {
						state = TileState.Collision;
					}
					this.tiles[x][y] = {
						position: { x, y },
						state,
					};
				}
			}
		} else {
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

		for (const column of this.tiles) {
			for (const tile of column) {
				if (tile.state === TileState.Active) {
					tile.part = createTilePart(config, tile, this.gridFolder);
				} else if (tile.state === TileState.Collision) {
					tile.part = this.createCollisionBlock(tile.position, config.tileSize);
				}
			}
		}

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

	public lineAttack(start: GridPosition, direction: Vector3, range: number, color: Color3) {
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
		let distance = 1;

		const useRange = range > 0;

		while (pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height) {
			if (useRange && distance > range) {
				break;
			}

			const tile = this.getTile(pos);
			if (!tile) {
				break;
			}

			if (tile.state === TileState.Active) {
				tilesInLine.push(tile);
			}

			pos = { x: pos.x + gridDelta.x, y: pos.y + gridDelta.y };
			distance++;
		}

		let colorDelay = 0.05;
		for (const tile of tilesInLine) {
			this.handleStartTileFall(tile, colorDelay, color);
			this.activeFallingTiles.add(tile);
			colorDelay += 0.05;
		}

		let fallDelay = colorDelay;
		for (const tile of tilesInLine) {
			tile.state = TileState.Falling;
			this.handleTileFallAndRise(tile, fallDelay);
			fallDelay += 0.15;
		}
	}

	public canParryAt(position: GridPosition, direction: Vector3): Tile | undefined {
		const checkPos = {
			x: position.x + direction.X,
			y: position.y + direction.Z,
		};

		const tile = this.getTile(checkPos);
		if (tile && this.activeFallingTiles.has(tile) && tile.state === TileState.Falling) {
			return tile;
		}
		return undefined;
	}

	public parryAttack(
		parryPosition: GridPosition,
		parryDirection: Vector3,
		range: number,
		playerColor: Color3,
	): boolean {
		const parriedTile = this.canParryAt(parryPosition, parryDirection);
		if (!parriedTile) {
			return false;
		}

		this.activeFallingTiles.delete(parriedTile);

		parriedTile.state = TileState.Active;
		if (parriedTile.part) {
			parriedTile.part.Color = parriedTile.color || this.config?.tileColor || new Color3(1, 0, 0);
		}

		const randomParryDirection = new Vector3(math.random(-1, 1), 0, math.random(-1, 1));

		this.lineAttack(parryPosition, randomParryDirection, range, playerColor);

		return true;
	}

	public minimizeMap() {
		if (!this.tiles) {
			throw error("Grid tiles are not initialized.");
		}

		const edgeTiles: Tile[] = [];
		let offset = 0;

		// Keep increasing offset until we find active tiles or reach center
		while (edgeTiles.size() === 0 && offset < math.min(this.width, this.height) / 2) {
			// Top row (left to right)
			for (let x = offset; x < this.width - offset; x++) {
				const tile = this.getTile({ x, y: offset });
				if (tile && tile.state === TileState.Active) {
					edgeTiles.push(tile);
				}
			}

			// Right column (top to bottom, excluding corners already added)
			for (let y = offset + 1; y < this.height - offset; y++) {
				const tile = this.getTile({ x: this.width - 1 - offset, y });
				if (tile && tile.state === TileState.Active) {
					edgeTiles.push(tile);
				}
			}

			// Bottom row (right to left, excluding corners already added)
			for (let x = this.width - 2 - offset; x >= offset; x--) {
				const tile = this.getTile({ x, y: this.height - 1 - offset });
				if (tile && tile.state === TileState.Active) {
					edgeTiles.push(tile);
				}
			}

			// Left column (bottom to top, excluding corners already added)
			for (let y = this.height - 2 - offset; y >= offset + 1; y--) {
				const tile = this.getTile({ x: offset, y });
				if (tile && tile.state === TileState.Active) {
					edgeTiles.push(tile);
				}
			}

			// If no active tiles found at current offset, try next inner layer
			if (edgeTiles.size() === 0) {
				offset++;
			}
		}

		// If no active tiles found at all, there's nothing to minimize
		if (edgeTiles.size() === 0) {
			return;
		}

		// go through all edge tile and set them to falling state
		edgeTiles.forEach((element) => {
			element.state = TileState.Falling;
		});

		let colorDelay = 0.05;
		for (const tile of edgeTiles) {
			this.handleStartTileFall(tile, colorDelay, new Color3(0.54, 0.54, 0.54));
			colorDelay += 0.05;
		}

		let fallDelay = colorDelay;
		for (const tile of edgeTiles) {
			this.handlePermanentTileFall(tile, fallDelay);
			fallDelay += 0.15;
		}
	}

	public reset() {
		if (this.gridFolder) {
			this.gridFolder.Destroy();
		}

		// Stop powerup spawning timer
		if (this.powerupSpawnTimer) {
			this.powerupSpawnTimer.Disconnect();
			this.powerupSpawnTimer = undefined;
		}

		for (const column of this.tiles) {
			for (const tile of column) {
				tile.part = undefined;
				tile.powerup = undefined;
				tile.state = TileState.Active;
			}
		}

		for (const activeFallingTiles of this.activeFallingTiles) {
			activeFallingTiles.state = TileState.Active;
			activeFallingTiles.part?.Destroy();
		}

		this.activeFallingTiles = new Set<Tile>();

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

	public getRandomTilePosition(): GridPosition {
		let x: number, y: number, tile: Tile | undefined;
		let attempts = 0;
		do {
			x = math.random(0, this.width - 1);
			y = math.random(0, this.height - 1);
			tile = this.getTile({ x, y });
			attempts++;
		} while (tile && tile.state !== TileState.Active && attempts < 100);
		if (tile && tile.state === TileState.Active) {
			return { x, y };
		}
		return { x: math.random(0, this.width - 1), y: math.random(0, this.height - 1) };
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

	public makeRandomTileFall() {
		const tilesAboutToFall: Tile[] = [];

		const howManyShouldFall = this.width > 10 ? 8 : 5;

		for (let i = 0; i < howManyShouldFall; i++) {
			const randomTilePosition = this.getRandomTilePosition();
			const tile = this.getTile(randomTilePosition);
			if (tile && tile.state === TileState.Active && !this.activeFallingTiles.has(tile)) {
				tile.state = TileState.Falling;
				tilesAboutToFall.push(tile);
			}
		}

		let colorDelay = 0.25;
		for (const tile of tilesAboutToFall) {
			this.handleStartTileFall(tile, colorDelay, new Color3(0.54, 0.54, 0.54));
			this.activeFallingTiles.add(tile);
			colorDelay += 0.25;
		}

		let fallDelay = colorDelay;
		for (const tile of tilesAboutToFall) {
			this.handleTileFallAndRise(tile, fallDelay);
			fallDelay += 0.15;
		}
	}

	private handleTileFallAndRise(tile: Tile, delay: number) {
		coroutine.wrap(async () => {
			wait(delay);
			this.activeFallingTiles.delete(tile);
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

	private handlePermanentTileFall(tile: Tile, delay: number) {
		coroutine.wrap(async () => {
			wait(delay);
			changeTileColor(tile.part, new Color3(0.54, 0.54, 0.54));
			tile.state = TileState.Removed;
			this.onTileFell(tile);
			this.createCollisionBlock(tile.position, this.config?.tileSize || 5);
			await makeTileFall(tile.part);
			if (tile.part) {
				tile.part.Destroy();
			}
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
		block.Parent = this.gridFolder; // Parent to grid folder instead of Workspace

		this.collisionBlocks.push(block);

		return block;
	}

	public spawnPowerupOnTile() {
		// Randomly spawn a powerup on a tile
		const randomTile = this.getRandomSpawnLocation();

		const tilePosition = vector3ToTilePosition(randomTile, this.config?.tileSize || 5);

		if (!randomTile) {
			warn("No valid tile found for powerup spawn.");
			return;
		}

		const tile = this.getTile(tilePosition);

		if (!tile || tile.state !== TileState.Active) {
			return;
		}

		const powerup = ReplicatedStorage.FindFirstChild("TS")
			?.FindFirstChild("assets")
			?.FindFirstChild("powerup") as Part;
		if (!powerup) {
			error("Powerup part not found in ReplicatedStorage.");
		}

		const powerupClone = powerup.Clone();
		powerupClone.Position = new Vector3(randomTile.X, randomTile.Y + 5, randomTile.Z); // Raise it above the tile
		powerupClone.Parent = this.gridFolder; // Parent to grid folder instead of Workspace

		tile.powerup = powerupClone;

		// Add tween animation to the powerup
		TweenService.Create(
			powerupClone,
			new TweenInfo(1, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out, -1, true),
			{
				Position: powerupClone.Position.add(new Vector3(0, 5, 0)), // Bounce up and down
			},
		).Play();

		const connection = powerupClone.Touched.Connect((hit: BasePart) => {
			const player = Players.GetPlayerFromCharacter(hit.Parent);
			if (player) {
				connection.Disconnect();
				tile.powerup?.Destroy();
				this.getPowerup(player);
			}
		});
	}

	public startPowerupSpawning(): void {
		this.stopPowerupSpawning();
		this.resetPowerupTimer();

		this.powerupSpawnTimer = RunService.Heartbeat.Connect(() => {
			const [dt] = RunService.Heartbeat.Wait();
			this.powerupSpawnDelay -= dt;

			if (this.powerupSpawnDelay <= 0) {
				this.spawnPowerupOnTile();
				this.resetPowerupTimer();
			}
		});
	}

	public stopPowerupSpawning(): void {
		if (this.powerupSpawnTimer) {
			this.powerupSpawnTimer.Disconnect();
			this.powerupSpawnTimer = undefined;
		}
	}

	private resetPowerupTimer(): void {
		// Random interval between 15-45 seconds
		this.powerupSpawnDelay = math.random(15, 45);
	}
}
