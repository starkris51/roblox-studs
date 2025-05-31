import Net, { Definitions } from "@rbxts/net";

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

	Camera: Definitions.Namespace({
		CameraToMap: Definitions.ServerToClientEvent<[position: CFrame]>(),
		CameraToLobby: Definitions.ServerToClientEvent<[position: CFrame]>(),
	}),
});

export = Remotes;
