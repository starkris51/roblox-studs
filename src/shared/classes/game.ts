import { GameMode, GameState, Powerups } from "shared/enums/game";
import { GamePlayer } from "./player";
import { PlayerGameState, PlayerState } from "shared/enums/player";
import { Players, RunService } from "@rbxts/services";
import { Grid } from "./grid";
import PlayerRemotes from "shared/remotes/player";
import ServerRemotes from "shared/remotes/server";
import { flipDirection, vector3ToTilePosition } from "shared/utils/convert";
import { GridPosition, Tile } from "shared/types/grid";
import { MapType } from "shared/enums/grid";
import { GameResultEntry, PlayerHealth, PlayerReadyData } from "shared/types/game";
import { playFallAnimation } from "shared/utils/player";
import { getMapSizeForPlayerCount, playerColors } from "shared/assets/data";
import { fourLinePowerup, shotgunPowerup } from "shared/utils/powerups";

export class GameManager {
	private state: GameState;
	private mode: GameMode;
	private players: GamePlayer[];
	private map: MapType;
	private mapVotes: Record<MapType, number>;
	private modeVotes: Record<GameMode, number>;
	private timer: number = 0;
	private timerConnection?: RBXScriptConnection;
	private powerupTimer: number = 0;
	private powerupTimerConnection?: RBXScriptConnection;
	private respawnTimers: Map<number, RBXScriptConnection> = new Map();
	private grid?: Grid;
	private cameraLocation: CFrame;
	private maxReadyPlayers: number = 2; // Minimum players required to start the game

	// Remotes for player actions
	private playerActionsNamespace = PlayerRemotes.Server.GetNamespace("Actions");
	private playerAttackRemote = this.playerActionsNamespace.Get("PlayerAttack");
	private playerParryRemote = this.playerActionsNamespace.Get("PlayerParry");
	private playerUsePowerupRemote = this.playerActionsNamespace.Get("PlayerUsePowerup");
	private playerGotPowerupRemote = this.playerActionsNamespace.Get("PlayerGotPowerup");
	private playerUsedPowerupRemote = this.playerActionsNamespace.Get("PlayerUsedPowerup");

	// Remotes for player getting a powerup that changes client
	private playerPowerupsNamespace = PlayerRemotes.Server.GetNamespace("Powerups");
	private sendSpeedBoostRemote = this.playerPowerupsNamespace.Get("Speed");
	private sendDizzy = this.playerPowerupsNamespace.Get("Dizzy");
	private sendInvisible = this.playerPowerupsNamespace.Get("Invisible");
	private sendSlowdown = this.playerPowerupsNamespace.Get("Slowdown");
	private sendShield = this.playerPowerupsNamespace.Get("Shield");
	private disableAttack = this.playerPowerupsNamespace.Get("DisableAttack");

	// Remotes for player voting
	private playerVoteNamespace = PlayerRemotes.Server.GetNamespace("Voting");
	private playerVoteMap = this.playerVoteNamespace.Get("VoteMap");
	private playerUnVoteMap = this.playerVoteNamespace.Get("UnvoteMap");

	// Remotes for camera
	private playerCameraNamespace = ServerRemotes.Server.GetNamespace("Camera");
	private cameraToMap = this.playerCameraNamespace.Get("CameraToMap");
	private cameraToLobby = this.playerCameraNamespace.Get("CameraToLobby");

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
	private playerUINamespace = PlayerRemotes.Server.GetNamespace("UI");
	private playerToggleReadyRemote = this.playerUINamespace.Get("PlayerToggleReady");

	// Server side UI Sending
	private serverRemoteUINamespace = ServerRemotes.Server.GetNamespace("UI");
	private playerReadyUpdateRemote = this.serverRemoteUINamespace.Get("PlayerReadyUpdate");
	private playerHealthUpdateRemote = this.serverRemoteUINamespace.Get("PlayerHealthUpdate");
	private showResultsRemote = this.serverRemoteUINamespace.Get("ShowResults");

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

		this.playerAttackRemote.Connect(this.handlePlayerAttack);
		this.playerVoteMap.Connect(this.handlePlayerVoteMap);
		this.playerUnVoteMap.Connect(this.handlePlayerUnVoteMap);
		//this.playerVoteMode.Connect(this.handlePlayerVoteMode);
		this.playerToggleReadyRemote.SetCallback(this.handlePlayerToggleReady);
		this.playerParryRemote.Connect(this.handlePlayerParry);
		this.playerUsePowerupRemote.Connect(this.usePowerup);
	}

	public async initialize(): Promise<void> {
		print("Initializing game...");

		this.state = GameState.Lobby;

		print("Game initialized!");
	}

	public cleanup(): void {
		print("Cleaning up game resources...");

		this.timerConnection?.Disconnect();

		for (const [userId, connection] of this.respawnTimers) {
			connection.Disconnect();
		}
		this.respawnTimers.clear();

		this.grid?.reset();

		this.players = [];

		print("Game cleanup complete!");
	}

	public playerJoin(player: Player): void {
		const newPlayer = new GamePlayer(player);

		newPlayer.setGameState(PlayerGameState.Lobby);

		this.players.push(newPlayer);

		this.broadcastPlayerReadyUpdate();

		if (this.players.size() > 0) {
			print(`Player ${player.Name} joined. Starting lobby...`);
			this.startLobby(); //Starts the main game loop
		} else if (this.state === GameState.Lobby) {
			this.lobbyRemote.SendToPlayer(player);
		}
	}

	public playerLeave(player: GamePlayer): void {
		const userId = player.getPlayer().UserId;

		const index = this.players.indexOf(player);
		this.players.remove(index);

		this.broadcastPlayerReadyUpdate();

		const respawnTimer = this.respawnTimers.get(userId);
		if (respawnTimer) {
			respawnTimer.Disconnect();
			this.respawnTimers.delete(userId);
		}

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

		this.broadcastPlayerReadyUpdate();

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
			tileColor: new Color3(0.55, 0, 0),
		};

		const mostVotedMap = this.getMostVotedMap();

		let playerCount = 0;

		//count players

		for (const player of this.players) {
			if (player.getReady()) {
				playerCount++;
			}
		}

		let width: number = 8;
		let height: number = 8;
		let randomizedMap = false;

		switch (mostVotedMap) {
			case MapType.Normal:
				this.map = MapType.Normal;
				const normalMapSize = getMapSizeForPlayerCount(playerCount);
				width = normalMapSize?.width || 8;
				height = normalMapSize?.height || 8;
				break;
			case MapType.Large:
				this.map = MapType.Large;
				const largeMapSize = getMapSizeForPlayerCount(playerCount);
				width = largeMapSize?.width * 2;
				height = largeMapSize?.height * 2;
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

		this.grid = new Grid(width, height, tileConfig, this.map, this.OnTileFall, this.getPowerup, randomizedMap);

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
			player.setColor(playerColors[playerCount] || new Color3(1, 1, 1));
			player.setHealth(3);
			this.respawnPlayer(player);
		}

		this.startGameRemote.SendToAllPlayers();
		this.broadcastPlayerHealthUpdate();

		this.startPowerupSpawning();
	}

	private endGame() {
		this.state = GameState.Ended;
		this.timer = 15; // Give more time to view results

		this.grid?.reset();

		// Find the winner (last player standing)
		const alivePlayers = this.players.filter((player: GamePlayer) => player.getPlayerState() !== PlayerState.Dead);
		const winnerId = alivePlayers.size() === 1 ? alivePlayers[0].getPlayer().UserId : -1;

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
			const kills: number = player.getKills();
			const isWinner = player.getPlayer().UserId === winnerId;

			return {
				userId: player.getPlayer().UserId,
				kills: kills,
				winner: isWinner,
			};
		});

		// Show results screen to all players
		this.showResultsRemote.SendToAllPlayers(results);
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

	private startPowerupSpawning() {
		this.powerupTimerConnection?.Disconnect();
		this.powerupTimerConnection = RunService.Heartbeat.Connect(() => {
			this.powerupTimer += RunService.Heartbeat.Wait()[0];
			if (this.powerupTimer >= 10) {
				this.grid?.spawnPowerupOnTile();
				this.powerupTimer = 0;
			}
		});
	}

	private respawnPlayer(player: GamePlayer) {
		if (!this.grid) {
			throw error("Grid is not initialized.");
		}

		if (player.getHealth() <= 0) {
			return;
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

			this.grid.lineAttack(tilePosition, flippedDirection, gamePlayer.getRange(), gamePlayer.getColor());
		} catch (error) {
			throw warn(`Error handling player attack for ${player.Name}: ${error}`);
		}
	};

	private handlePlayerParry = (player: Player, position: Vector3, direction: Vector3) => {
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

			const tilePosition = vector3ToTilePosition(position, this.grid.getConfig()?.tileSize || 5);
			const flippedDirection = flipDirection(direction);
			const parrySuccessful = this.grid.parryAttack(
				tilePosition,
				flippedDirection,
				gamePlayer.getRange(),
				gamePlayer.getColor(),
			);

			if (parrySuccessful) {
				print(`Player ${player.Name} successfully parried an attack!`);
			}
		} catch (error) {
			throw warn(`Error handling player parry for ${player.Name}: ${error}`);
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
			(p: GamePlayer) => p.getPlayerState() !== PlayerState.Dead,
		);

		if (remainingPlayer.size() <= 1) {
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

			this.broadcastPlayerHealthUpdate();

			player.getPlayer().Character?.Destroy();

			if (health <= 0) {
				player.setPlayerState(PlayerState.Dead);
				this.grid?.minimizeMap();
				this.checkIfGameOver();
				return;
			}

			player.setPlayerState(PlayerState.Respawning);
			this.startRespawnTimer(player, 2);
		});
	};

	private startRespawnTimer(player: GamePlayer, respawnTime: number) {
		const userId = player.getPlayer().UserId;

		const existingTimer = this.respawnTimers.get(userId);
		if (existingTimer) {
			existingTimer.Disconnect();
		}

		let timeLeft = respawnTime;

		this.startTimerRemote.SendToPlayer(player.getPlayer(), timeLeft);

		const connection = RunService.Heartbeat.Connect(() => {
			const [dt] = RunService.Heartbeat.Wait();
			timeLeft -= dt;

			this.tickTimerRemote.SendToPlayer(player.getPlayer(), math.max(0, math.floor(timeLeft)));

			if (timeLeft <= 0) {
				connection.Disconnect();
				this.respawnTimers.delete(userId);

				this.endTimerRemote.SendToPlayer(player.getPlayer());

				this.respawnPlayer(player);
			}
		});

		this.respawnTimers.set(userId, connection);
	}

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

				if (tile.powerup) {
					tile.powerup.Destroy();
					tile.powerup = undefined;
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

		this.broadcastPlayerReadyUpdate();

		return gamePlayer.getReady();
	};

	private getPowerup = (player: Player) => {
		// This function should handle the logic for when a player collects a powerup
		const powerupTypes = [
			Powerups.FourLine,
			Powerups.Earthquake,
			Powerups.Shotgun,
			Powerups.Speed,
			Powerups.Health,
			Powerups.Slowdown,
			Powerups.Teleport,
			Powerups.Dizzy,
			Powerups.DisableAttack,
		];
		const randomPowerup = powerupTypes[math.random(0, powerupTypes.size() - 1)];

		print(`Player ${player.Name} collected powerup: ${randomPowerup}`);
		const gamePlayer = this.getPlayer(player);
		if (!gamePlayer) {
			warn(`GamePlayer for ${player.Name} not found.`);
			return;
		}

		gamePlayer.addPowerup(randomPowerup);
		this.playerGotPowerupRemote.SendToPlayer(player, randomPowerup);
	};

	private usePowerup = (player: Player) => {
		const gamePlayer = this.getPlayer(player);
		if (!gamePlayer) {
			warn(`GamePlayer for ${player.Name} not found.`);
			return;
		}

		if (gamePlayer.getGameState() !== PlayerGameState.Playing) {
			warn(`Player ${player.Name} is not in a playable state.`);
			return;
		}

		if (gamePlayer.getPowerups().size() === 0) {
			warn(`Player ${player.Name} has no powerups to use.`);
			return;
		}

		const powerup = gamePlayer.getPowerups()[0];
		if (!powerup) {
			warn(`Player ${player.Name} has no powerups to use.`);
			return;
		}

		if (!this.grid) {
			warn("Grid is not initialized.");
			return;
		}

		switch (powerup) {
			case Powerups.FourLine:
				fourLinePowerup(this.grid, gamePlayer.getPosition(), gamePlayer.getColor());
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			case Powerups.Shotgun:
				if (
					shotgunPowerup(
						this.grid,
						gamePlayer.getPosition(),
						gamePlayer.getDirection(),
						gamePlayer.getColor(),
					)
				) {
					gamePlayer.removePowerup(powerup);
					this.playerUsedPowerupRemote.SendToPlayer(player);
				}
				break;
			case Powerups.Speed:
				this.sendSpeedBoostRemote.SendToPlayer(player, 3);
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			case Powerups.Slowdown:
				this.sendSlowdown.SendToAllPlayersExcept(player, 3);
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			case Powerups.Teleport:
				const character = player.Character;
				const randomLocation = this.grid.getRandomSpawnLocation();
				if (character && character.PrimaryPart) {
					character.MoveTo(randomLocation);
				}
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			case Powerups.Earthquake:
				this.grid.makeRandomTileFall();
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			case Powerups.Health:
				gamePlayer.setHealth(gamePlayer.getHealth() + 1);
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				this.broadcastPlayerHealthUpdate();
				break;
			case Powerups.Dizzy:
				this.sendDizzy.SendToAllPlayersExcept(player, 10);
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			case Powerups.DisableAttack:
				this.disableAttack.SendToAllPlayersExcept(player, 5);
				gamePlayer.removePowerup(powerup);
				this.playerUsedPowerupRemote.SendToPlayer(player);
				break;
			default:
				warn(`Unknown powerup: ${powerup}`);
				break;
		}

		this.grid?.spawnPowerupOnTile();
	};

	private broadcastPlayerReadyUpdate(): void {
		if (this.state !== GameState.Lobby) return;

		const playerData: PlayerReadyData[] = this.players.map((player) => ({
			userId: player.getPlayer().UserId,
			displayName: player.getPlayer().DisplayName,
			isReady: player.getReady(),
		}));

		this.playerReadyUpdateRemote.SendToAllPlayers(playerData);
	}

	private broadcastPlayerHealthUpdate(): void {
		const healthData: PlayerHealth[] = this.players.map((player) => ({
			userId: player.getPlayer().UserId,
			displayName: player.getPlayer().DisplayName,
			health: player.getHealth(),
		}));

		this.playerHealthUpdateRemote.SendToAllPlayers(healthData);
	}
}
