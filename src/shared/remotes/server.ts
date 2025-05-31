import Net, { Definitions } from "@rbxts/net";
import { GridPosition } from "shared/types/grid";

const Remotes = Net.CreateDefinitions({
	Updates: Definitions.Namespace({
		Timer: Definitions.ServerToClientEvent<[time: number]>(),
		Score: Definitions.ServerToClientEvent<[score: number]>(),
	}),

	Game: Definitions.Namespace({
		Start: Definitions.ServerToClientEvent<[]>(),
		VoteMapSession: Definitions.ServerToClientEvent<[mapName: string]>(),
		VoteGameModeSession: Definitions.ServerToClientEvent<[gameMode: string]>(),
		End: Definitions.ServerToClientEvent<[]>(),
		PlayerJoined: Definitions.ServerToClientEvent<[playerName: string]>(),
		PlayerLeft: Definitions.ServerToClientEvent<[playerName: string]>(),
	}),
});

export = Remotes;
