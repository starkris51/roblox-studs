export enum GameState {
	WaitingForPlayers,
	Lobby,
	VotingMap,
	VotingMode,
	Playing,
	Ended,
}

export enum GameMode {
	Normal,
	Hardcore,
}

export enum Powerups {
	FourLine = 1,
	Shotgun,
	Speed,
	Slowdown,
	Teleport,
	Health,
	Shield,
	Dizzy,
	Invincibility,
	Earthquake,
	RespawnRandomPlayer,
	IncreaseStageSize,
	DisableAttack,
	IncreaseAttackRange,
}
