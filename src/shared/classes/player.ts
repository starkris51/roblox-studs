import { PlayerGameState, PlayerState } from "shared/enums/player";

export class GamePlayer {
	private player: Player;
	private score: number;
	private gameState: PlayerGameState;
	private playerState: PlayerState;

	constructor(player: Player) {
		this.player = player;
		this.score = 0;
		this.gameState = PlayerGameState.Lobby;
		this.playerState = PlayerState.None;
	}

	public getPlayer(): Player {
		return this.player;
	}
	public getScore(): number {
		return this.score;
	}
	public getGameState(): PlayerGameState {
		return this.gameState;
	}
	public getPlayerState(): PlayerState {
		return this.playerState;
	}
	public setScore(score: number): void {
		this.score = score;
	}
	public setGameState(state: PlayerGameState): void {
		this.gameState = state;
	}
	public setPlayerState(state: PlayerState): void {
		this.playerState = state;
	}
}
