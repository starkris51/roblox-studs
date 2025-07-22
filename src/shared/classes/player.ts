import { PlayerGameState, PlayerState } from "shared/enums/player";

export class GamePlayer {
	private player: Player;
	private health: number;
	private color: Color3 = new Color3(1, 1, 1);
	private isReady: boolean = false;
	private gameState: PlayerGameState;
	private playerState: PlayerState;
	private range: number = 8;

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
}
