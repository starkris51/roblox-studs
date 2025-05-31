import { GameMode, GameState } from "shared/enums/game";
import { GamePlayer } from "./player";
import { PlayerGameState, PlayerState } from "shared/enums/player";
import { Players, RunService } from "@rbxts/services";
import { Grid } from "./grid";
import PlayerRemotes from "shared/remotes/player";
import { flipDirection, vector3ToTilePosition } from "shared/utils/convert";
import { GridPosition, Tile } from "shared/types/grid";
import { MapType } from "shared/enums/grid";

export class GameManager {
	private state: GameState;
	private mode: GameMode;
	private players: GamePlayer[];
	private map: string;
	private mapVotes: Record<string, number>;
	private modeVotes: Record<GameMode, number>;
	private timer: number = 0;
	private timerConnection?: RBXScriptConnection;
	private grid?: Grid;

	// Remotes for player actions
	private playerActions = PlayerRemotes.Server.GetNamespace("Actions");
	private playerAttack = this.playerActions.Get("PlayerAttack");

	constructor() {
		this.state = GameState.WaitingForPlayers;
		this.mode = GameMode.Normal;
		this.players = [];
		this.map = "";
		this.mapVotes = {};
		this.modeVotes = {
			[GameMode.Normal]: 0,
			[GameMode.Hardcore]: 0,
		};
		this.grid = undefined;

		this.playerAttack.Connect(this.handlePlayerAttack);
	}

	public playerJoin(player: Player): void {
		const newPlayer = new GamePlayer(player);

		newPlayer.setGameState(PlayerGameState.Lobby);

		this.players.push(newPlayer);

		if (this.state === GameState.WaitingForPlayers && this.players.size() >= 1) {
			this.startLobby(); //Starts the main game loop
		}

		print(`Player ${player.Name} joined the game. Total players: ${this.players.size()}`);
	}

	public playerLeave(player: GamePlayer): void {
		const index = this.players.indexOf(player);
		this.players.remove(index);
	}

	public getPlayer(player: Player): GamePlayer | undefined {
		return this.players.find((p) => p.getPlayer().UserId === player.UserId);
	}

	public startLobby() {
		this.state = GameState.Lobby;
		this.timer = 1;

		print("Starting lobby...");

		this.startTimer(() => this.startVoting());
	}

	private startVoting() {
		this.state = GameState.VotingMap;
		this.timer = 0;

		//no ui for voting yet, so we just set a default map
		this.map = "normal";
		this.mapVotes[this.map] = 0;

		print("Starting map voting...");

		this.startTimer(() => this.startGame());
	}

	private startGame() {
		this.state = GameState.Playing;
		this.timer = 60;

		const tileConfig = {
			tileSize: 5,
			tileColor: new Color3(1, 0, 0),
		};

		this.grid = new Grid(10, 10, tileConfig, MapType.Normal, this.OnTileFall);

		for (const player of this.players) {
			player.setGameState(PlayerGameState.Playing);
			this.respawnPlayer(player);
		}

		print(`Starting game with map: ${this.map} and mode: ${this.mode}`);
	}

	private endGame() {
		this.state = GameState.Ended;
		this.timer = 10;
		this.startTimer(() => this.startLobby());
	}

	private startTimer(onEnd: () => void) {
		this.timerConnection?.Disconnect();
		this.timerConnection = RunService.Heartbeat.Connect(() => {
			const [dt] = RunService.Heartbeat.Wait();
			this.timer -= dt;
			if (this.timer <= 0) {
				this.timerConnection?.Disconnect();
				onEnd();
			}
		});
	}

	private respawnPlayer(player: GamePlayer) {
		if (!this.grid) {
			throw error("Grid is not initialized.");
		}

		const respawnLocation = this.grid.getRandomSpawnLocation();

		player.setPlayerState(PlayerState.Moving);
		player.getPlayer().LoadCharacter();
		player.getPlayer().Character?.MoveTo(respawnLocation);
	}

	private handlePlayerAttack = (player: Player, position: Vector3, direction: Vector3) => {
		try {
			if (!this.grid) {
				warn("Grid is not initialized.");
				return;
			}

			const gamePlayer = this.getPlayer(player);

			if (!gamePlayer) {
				warn(`Player ${player.Name} not found in gameManager`);
				return;
			}

			if (gamePlayer.getGameState() !== PlayerGameState.Playing) {
				return;
			}

			if (gamePlayer.getPlayerState() !== PlayerState.Moving) {
				return;
			}

			const tilePosition = vector3ToTilePosition(position, this.grid.getConfig()?.tileSize || 5);
			const flippedDirection = flipDirection(direction);

			this.grid.lineAttack(tilePosition, flippedDirection);
		} catch (error) {
			throw warn(`Error handling player attack for ${player.Name}: ${error}`);
		}
	};

	private getAllPLayerGridPositions(): Record<number, GridPosition> {
		if (!this.grid) {
			throw error("Grid is not initialized.");
		}

		const positions: Record<number, GridPosition> = {};

		for (const player of this.players) {
			if (player.getGameState() === PlayerGameState.Playing && player.getPlayerState() === PlayerState.Moving) {
				const character = player.getPlayer().Character;
				if (character && character.PrimaryPart) {
					const position = vector3ToTilePosition(
						character.PrimaryPart.Position,
						this.grid.getConfig()?.tileSize || 5,
					);
					positions[player.getPlayer().UserId] = position;
				}
			}
		}

		return positions;
	}

	private handlePlayerRespawn = (player: GamePlayer) => {
		this.timer = 2;

		if (player.getPlayerState() === PlayerState.Respawning) {
			warn(`Player is already respawning.`);
			return;
		}
		if (!this.grid) {
			throw error("Grid is not initialized.");
		}

		player.setPlayerState(PlayerState.Respawning);

		// Do a animation or visual effect here if needed

		this.startTimer(() => {
			this.respawnPlayer(player);
		});
	};

	private OnTileFall = (tile: Tile) => {
		if (!this.grid) {
			throw warn("Grid is not initialized.");
		}

		const allPlayerPositions = this.getAllPLayerGridPositions();

		try {
			for (const [idStr, position] of pairs(allPlayerPositions)) {
				const id = tonumber(idStr);
				if (id !== undefined && tile.position.x === position.x && tile.position.y === position.y) {
					const robloxPlayer = Players.GetPlayerByUserId(id);
					if (!robloxPlayer) {
						continue;
					}
					const player = this.getPlayer(robloxPlayer);
					if (player && player.getPlayerState() === PlayerState.Moving) {
						this.handlePlayerRespawn(player);
					}
				}
			}
		} catch (error) {
			warn(`Error processing tile fall for tile at position (${tile.position.x}, ${tile.position.y}): ${error}`);
		}
	};
}
