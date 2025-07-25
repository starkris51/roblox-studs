import { Powerups } from "shared/enums/game";
import { PlayerGameState, PlayerState } from "shared/enums/player";
import { GridPosition } from "shared/types/grid";
import ServerRemotes from "shared/remotes/server";

export class GamePlayer {
	private player: Player;
	private health: number;
	private color: Color3 = new Color3(1, 1, 1);
	private isReady: boolean = false;
	private gameState: PlayerGameState;
	private playerState: PlayerState;
	private range: number = 8;
	private powerups: Powerups[] = [];
	private currentDirection: Vector3 = new Vector3(0, 0, -1);
	private kills: number = 0;

	constructor(player: Player) {
		this.player = player;
		this.health = 0;
		this.gameState = PlayerGameState.Lobby;
		this.playerState = PlayerState.None;
		this.isReady = false;
	}

	public getPlayer(): Player {
		return this.player;
	}
	public getHealth(): number {
		return this.health;
	}
	public getRange(): number {
		return this.range;
	}
	public getGameState(): PlayerGameState {
		return this.gameState;
	}
	public getPlayerState(): PlayerState {
		return this.playerState;
	}
	public getColor(): Color3 {
		return this.color;
	}
	public getReady(): boolean {
		return this.isReady;
	}
	public setHealth(health: number): void {
		this.health = health;
	}
	public setGameState(state: PlayerGameState): void {
		this.gameState = state;
	}
	public setPlayerState(state: PlayerState): void {
		this.playerState = state;
	}
	public setColor(color: Color3): void {
		this.color = color;
	}
	public setReady(ready: boolean): void {
		this.isReady = ready;
	}
	public reset(): void {
		this.health = 0;
		this.color = new Color3(1, 1, 1);
		this.isReady = false;
		this.gameState = PlayerGameState.Lobby;
		this.playerState = PlayerState.None;
	}
	public addPowerup(powerup: Powerups): void {
		this.powerups.push(powerup);
	}
	public removePowerup(powerup: Powerups): void {
		const index = this.powerups.indexOf(powerup);
		if (index !== -1) {
			this.powerups.remove(index);
		}
	}
	public getPowerups(): Powerups[] {
		return this.powerups;
	}
	public getPosition(): Vector3 {
		return this.player.Character?.PrimaryPart?.Position || new Vector3(0, 0, 0);
	}
	public getDirection(): Vector3 {
		const character = this.player.Character;
		if (!character || !character.PrimaryPart) {
			return new Vector3(0, 0, -1); // Default direction
		}

		// Get the direction the character is facing
		const lookVector = character.PrimaryPart.CFrame.LookVector;

		// Round to nearest cardinal direction for grid-based movement
		const roundedX = math.abs(lookVector.X) > math.abs(lookVector.Z) ? (lookVector.X > 0 ? 1 : -1) : 0;
		const roundedZ = math.abs(lookVector.Z) > math.abs(lookVector.X) ? (lookVector.Z > 0 ? 1 : -1) : 0;

		print(`Character direction: ${lookVector}, Rounded: (${roundedX}, ${roundedZ})`);

		return new Vector3(roundedX, 0, roundedZ);
	}
	public setKills(kills: number): void {
		this.kills = kills;
	}
	public getKills(): number {
		return this.kills;
	}
}
