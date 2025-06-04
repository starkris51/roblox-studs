import { GameMode, GameState } from "shared/enums/game";
import { GamePlayer } from "./player";
import { PlayerGameState, PlayerState } from "shared/enums/player";
import { Players, RunService } from "@rbxts/services";
import { Grid } from "./grid";
import PlayerRemotes from "shared/remotes/player";
import ServerRemotes from "shared/remotes/server";
import { flipDirection, vector3ToTilePosition } from "shared/utils/convert";
import { GridPosition, Tile } from "shared/types/grid";
import { MapType } from "shared/enums/grid";
import { GameResultEntry } from "shared/types/game";
import { playFallAnimation } from "shared/utils/player";

export class GameManager {
	private state: GameState;
	private mode: GameMode;
	private players: GamePlayer[];
	private map: MapType;
	private mapVotes: Record<MapType, number>;
	private modeVotes: Record<GameMode, number>;
	private timer: number = 0;
	private timerConnection?: RBXScriptConnection;
	private grid?: Grid;
	private cameraLocation: CFrame;
	private maxReadyPlayers: number = 1;

	// Remotes for player actions
	private playerActions = PlayerRemotes.Server.GetNamespace("Actions");
	private playerAttack = this.playerActions.Get("PlayerAttack");

	// Remotes for player voting
	private playerVote = PlayerRemotes.Server.GetNamespace("Voting");
	private playerVoteMap = this.playerVote.Get("VoteMap");
	private playerUnVoteMap = this.playerVote.Get("UnvoteMap");

	// Remotes for camera
	private playerCamera = ServerRemotes.Server.GetNamespace("Camera");
	private cameraToMap = this.playerCamera.Get("CameraToMap");
	private cameraToLobby = this.playerCamera.Get("CameraToLobby");

	// Remotes for game management
	private gameNamespace = ServerRemotes.Server.GetNamespace("Game");
	private voteMapSession = this.gameNamespace.Get("VoteMapSession");
	private endVoteMapSession = this.gameNamespace.Get("EndVoteMapSession");
	private lobbyRemote = this.gameNamespace.Get("Lobby");
	private endGameRemote = this.gameNamespace.Get("End");
	private startGameRemote = this.gameNamespace.Get("Start");

	// Remotes for game timer
	private timerRemotes = ServerRemotes.Server.GetNamespace("Timer");
	private startTimerRemote = this.timerRemotes.Get("Start");
	private tickTimerRemote = this.timerRemotes.Get("Tick");
	private endTimerRemote = this.timerRemotes.Get("End");

	// Remotes for UI
	private playerUI = PlayerRemotes.Server.GetNamespace("UI");
	private playerToggleReady = this.playerUI.Get("PlayerToggleReady");

	constructor() {
		this.state = GameState.Lobby;
		this.mode = GameMode.Normal;
		this.players = [];
		this.map = MapType.Normal;
		this.mapVotes = {
			[MapType.Normal]: 0,
			[MapType.Large]: 0,
			[MapType.Randomized]: 0,
		};
		this.modeVotes = {
			[GameMode.Normal]: 0,
			[GameMode.Hardcore]: 0,
		};
		this.grid = undefined;
		this.cameraLocation = new CFrame(0, 50, 0);

		this.playerAttack.Connect(this.handlePlayerAttack);
		this.playerVoteMap.Connect(this.handlePlayerVoteMap);
		this.playerUnVoteMap.Connect(this.handlePlayerUnVoteMap);
		//this.playerVoteMode.Connect(this.handlePlayerVoteMode);
		this.playerToggleReady.SetCallback(this.handlePlayerToggleReady);
	}

	public async initialize(): Promise<void> {
		print("Initializing game...");

		this.state = GameState.Lobby;

		print("Game initialized!");
	}

	public cleanup(): void {
		print("Cleaning up game resources...");

		this.timerConnection?.Disconnect();

		this.grid?.reset();

		this.players = [];

		print("Game cleanup complete!");
	}

	public playerJoin(player: Player): void {
		const newPlayer = new GamePlayer(player);

		newPlayer.setGameState(PlayerGameState.Lobby);

		this.players.push(newPlayer);

		if (this.players.size() > 0) {
			print(`Player ${player.Name} joined. Starting lobby...`);
			this.startLobby(); //Starts the main game loop
		} else if (this.state === GameState.Lobby) {
			this.lobbyRemote.SendToPlayer(player);
		}
	}

	public playerLeave(player: GamePlayer): void {
		const index = this.players.indexOf(player);
		this.players.remove(index);

		if (this.state === GameState.VotingMap) {
			this.handlePlayerUnVoteMap(player.getPlayer(), this.map);
		} else if (this.state === GameState.Playing) {
			this.checkIfGameOver();
		}
	}

	public getPlayer(player: Player): GamePlayer | undefined {
		return this.players.find((p) => p.getPlayer().UserId === player.UserId);
	}

	public startLobby() {
		this.state = GameState.Lobby;
		this.timer = 10;

		this.lobbyRemote.SendToAllPlayers();

		this.startTimer(() => this.startVoting());
	}

	private startVoting() {
		const readyPlayers = this.players.filter((p) => p.getReady());
		if (readyPlayers.size() < this.maxReadyPlayers) {
			print("Not enough players ready to start voting.");
			this.startLobby();
			return;
		}

		this.state = GameState.VotingMap;
		this.timer = 10;

		this.resetVotes();

		const maps = [MapType.Normal, MapType.Large, MapType.Randomized];

		this.voteMapSession.SendToAllPlayers(maps);

		this.startTimer(() => this.startGame());
	}

	private startGame() {
		this.endVoteMapSession.SendToAllPlayers();

		this.state = GameState.Playing;
		this.timer = 10;

		const tileConfig = {
			tileSize: 5,
			tileColor: new Color3(1, 0, 0),
		};

		const mostVotedMap = this.getMostVotedMap();

		let width: number = 5;
		let height: number = 5;
		let randomizedMap = false;

		switch (mostVotedMap) {
			case MapType.Normal:
				this.map = MapType.Normal;
				width = 10;
				height = 10;
				break;
			case MapType.Large:
				this.map = MapType.Large;
				width = 30;
				height = 30;
				break;
			case MapType.Randomized:
				this.map = MapType.Randomized;
				width = math.random(20, 30);
				height = math.random(20, 30);
				randomizedMap = true;
				break;
			default:
				this.map = MapType.Normal;
				break;
		}

		this.grid = new Grid(width, height, tileConfig, MapType.Normal, this.OnTileFall, randomizedMap);

		const center = new Vector3(
			(this.grid!.getWidth() * this.grid!.getConfig()!.tileSize) / 2,
			30,
			(this.grid!.getHeight() * this.grid!.getConfig()!.tileSize) / 2,
		);
		const cameraPosition = center.add(new Vector3(0, 0, 70));
		const lookAtPosition = center.add(new Vector3(0, -30, -10));

		const CFrameCamera = new CFrame(cameraPosition, lookAtPosition);

		this.cameraLocation = CFrameCamera;

		for (const player of this.players) {
			if (!player.getReady()) {
				this.cameraToMap.SendToPlayer(player.getPlayer(), this.cameraLocation);
				player.setGameState(PlayerGameState.Lobby);
				player.setPlayerState(PlayerState.None);
				continue;
			}

			player.setGameState(PlayerGameState.Playing);
			player.setHealth(5);
			this.respawnPlayer(player);
		}
	}

	private endGame() {
		this.state = GameState.Ended;
		this.timer = 10;

		this.grid?.reset();

		for (const player of this.players) {
			if (player.getGameState() !== PlayerGameState.Playing && player.getPlayerState() !== PlayerState.Moving) {
				continue;
			}

			player.setGameState(PlayerGameState.Lobby);
			player.setPlayerState(PlayerState.None);
			player.setHealth(0);
			player.getPlayer().Character = undefined;
		}

		const results: GameResultEntry[] = this.players.map((player: GamePlayer) => {
			const kills: Record<number, number> = {}; // TODO: Populate with actual kill data

			return {
				userId: player.getPlayer().UserId,
				kills: kills,
			};
		});

		this.endGameRemote.SendToAllPlayers(results);

		this.startTimer(() => this.startLobby());
	}

	private startTimer(onEnd: () => void) {
		this.timerConnection?.Disconnect();
		this.startTimerRemote.SendToAllPlayers(this.timer);
		this.timerConnection = RunService.Heartbeat.Connect(() => {
			const [dt] = RunService.Heartbeat.Wait();
			this.timer -= dt;
			this.tickTimerRemote.SendToAllPlayers(math.max(0, math.floor(this.timer)));
			if (this.timer <= 0) {
				this.timerConnection?.Disconnect();
				this.endTimerRemote.SendToAllPlayers();
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
		const character = player.getPlayer().Character;
		if (character && character.PrimaryPart) {
			character.MoveTo(respawnLocation);
		} else {
			player.getPlayer().LoadCharacter();
			const newCharacter = player.getPlayer().Character;
			if (newCharacter && newCharacter.PrimaryPart) {
				newCharacter.MoveTo(respawnLocation);
			} else {
				warn(`Failed to respawn player ${player.getPlayer().Name}. Character not found.`);
			}
		}

		this.cameraToMap.SendToPlayer(player.getPlayer(), this.cameraLocation);
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

	private checkIfGameOver(): void {
		const remainingPlayer: GamePlayer[] = this.players.filter(
			(p: GamePlayer) => p.getPlayerState() === PlayerState.Moving,
		);

		if (remainingPlayer.size() <= 0) {
			this.endGame();
		}
	}

	private losePlayerHealth = (player: GamePlayer) => {
		if (player.getPlayerState() === PlayerState.Respawning) {
			warn(`Player is already respawning.`);
			return;
		}
		this.timer = 2;

		const character = player.getPlayer().Character;
		if (!character) {
			warn("Character is undefined.");
			return;
		}
		const humanoid = character.FindFirstChild("Humanoid") as Humanoid | undefined;
		if (!humanoid) {
			warn("Humanoid not found in character.");
			return;
		}

		humanoid.PlatformStand = true;

		playFallAnimation(character).then(() => {
			let health = player.getHealth() - 1;
			player.setHealth(health);

			player.getPlayer().Character?.Destroy();

			if (health <= 0) {
				player.setPlayerState(PlayerState.Dead);
				this.checkIfGameOver();
				return;
			}

			player.setPlayerState(PlayerState.Respawning);
			this.startTimer(() => {
				this.respawnPlayer(player);
			});
		});

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
						this.losePlayerHealth(player);
					}
				}
			}
		} catch (error) {
			warn(`Error processing tile fall for tile at position (${tile.position.x}, ${tile.position.y}): ${error}`);
		}
	};

	private resetVotes() {
		this.mapVotes = {
			[MapType.Normal]: 0,
			[MapType.Large]: 0,
			[MapType.Randomized]: 0,
		};
	}

	private handlePlayerVoteMap = (player: Player, mapName: MapType) => {
		if (this.state !== GameState.VotingMap) {
			warn(`Player ${player.Name} tried to vote for map ${mapName} but voting is not active.`);
			return;
		}

		if (!this.mapVotes[mapName]) {
			this.mapVotes[mapName] = 0;
		}

		this.mapVotes[mapName] += 1;
	};

	private handlePlayerUnVoteMap = (player: Player, mapName: MapType) => {
		if (this.state !== GameState.VotingMap) {
			warn(`Player ${player.Name} tried to unvote for map ${mapName} but voting is not active.`);
			return;
		}

		if (this.mapVotes[mapName]) {
			this.mapVotes[mapName] -= 1;
			if (this.mapVotes[mapName] <= 0) {
				delete this.mapVotes[mapName];
			}
		}
	};

	// private handlePlayerVoteMode = (player: Player, mode: GameMode) => {
	// 	if (this.state !== GameState.VotingMap) {
	// 		warn(`Player ${player.Name} tried to vote for mode ${mode} but voting is not active.`);
	// 		return;
	// 	}

	// 	if (!this.modeVotes[mode]) {
	// 		this.modeVotes[mode] = 0;
	// 	}
	// 	this.modeVotes[mode] += 1;
	// };

	private getMostVotedMap(): MapType {
		let maxVotes = 0;
		let mostVotedMap: MapType = MapType.Normal;

		for (const [map, votes] of pairs(this.mapVotes)) {
			if (votes > maxVotes) {
				maxVotes = votes;
				mostVotedMap = map;
			}
		}

		return mostVotedMap;
	}

	private handlePlayerToggleReady = (player: Player) => {
		const gamePlayer = this.getPlayer(player);
		if (!gamePlayer) return false;
		if (this.state !== GameState.Lobby) return gamePlayer.getReady();
		gamePlayer.setReady(!gamePlayer.getReady());
		return gamePlayer.getReady();
	};
}
