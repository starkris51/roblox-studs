export type GameResultEntry = {
	userId: number;
	kills: number;
	winner: boolean;
};

export interface PlayerReadyData {
	userId: number;
	displayName: string;
	isReady: boolean;
}

export interface PlayerHealth {
	userId: number;
	displayName: string;
	health: number;
}
